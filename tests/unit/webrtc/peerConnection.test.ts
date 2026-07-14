import { beforeEach, describe, expect, it, vi } from "vitest";
import { PerfectNegotiationPeer } from "../../../src/lib/webrtc/peerConnection";

interface FakeTrack {
  kind: string;
}

interface FakeSender {
  track: FakeTrack | null;
  replaceTrack: (track: FakeTrack) => Promise<void>;
}

interface FakeDescription {
  type: "offer" | "answer";
  sdp: string;
}

/**
 * Minimal fake of the browser `RTCPeerConnection` that mirrors just enough
 * signalingState transitions to exercise PerfectNegotiationPeer's glare
 * detection (research.md §4) — this environment has no real WebRTC stack.
 */
class FakeRTCPeerConnection {
  iceServers: unknown;
  tracks: { track: FakeTrack; stream: unknown }[] = [];
  senders: FakeSender[] = [];
  localDescription: FakeDescription | null = null;
  remoteDescription: FakeDescription | null = null;
  signalingState: "stable" | "have-local-offer" | "have-remote-offer" =
    "stable";
  connectionState = "new";
  iceCandidates: unknown[] = [];
  closed = false;

  onnegotiationneeded: (() => void | Promise<void>) | null = null;
  onicecandidate: ((e: { candidate: unknown }) => void) | null = null;
  ontrack: ((e: { streams: unknown[] }) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;

  constructor(config: unknown) {
    this.iceServers = config;
  }

  addTrack(track: FakeTrack, stream: unknown) {
    this.tracks.push({ track, stream });
    const sender: FakeSender = {
      track,
      replaceTrack: async (t) => {
        sender.track = t;
      },
    };
    this.senders.push(sender);
    return sender;
  }

  getSenders() {
    return this.senders;
  }

  async setLocalDescription(desc?: FakeDescription) {
    this.localDescription =
      desc ??
      ({
        type: this.signalingState === "have-remote-offer" ? "answer" : "offer",
        sdp: "fake-sdp",
      } satisfies FakeDescription);
    this.signalingState =
      this.localDescription.type === "offer" ? "have-local-offer" : "stable";
  }

  async setRemoteDescription(desc: FakeDescription) {
    this.remoteDescription = desc;
    this.signalingState = desc.type === "offer" ? "have-remote-offer" : "stable";
  }

  async addIceCandidate(candidate: unknown) {
    this.iceCandidates.push(candidate);
  }

  close() {
    this.closed = true;
  }
}

function fakeLocalStream(): MediaStream {
  return {
    getTracks: () => [{ kind: "audio" }, { kind: "video" }],
    getAudioTracks: () => [{ kind: "audio" }],
    getVideoTracks: () => [{ kind: "video" }],
  } as unknown as MediaStream;
}

function makePeer(polite: boolean) {
  const onTrack = vi.fn();
  const onSignal = vi.fn();
  const peer = new PerfectNegotiationPeer(polite, fakeLocalStream(), {
    onTrack,
    onSignal,
  });
  const pc = peer.pc as unknown as FakeRTCPeerConnection;
  return { peer, pc, onTrack, onSignal };
}

beforeEach(() => {
  vi.stubGlobal(
    "RTCPeerConnection",
    FakeRTCPeerConnection as unknown as typeof RTCPeerConnection,
  );
});

describe("PerfectNegotiationPeer construction", () => {
  it("adds every local track to the connection", () => {
    const { pc } = makePeer(true);
    expect(pc.tracks.map((t) => t.track.kind)).toEqual(["audio", "video"]);
  });
});

describe("onnegotiationneeded", () => {
  it("creates a local offer and signals it", async () => {
    const { pc, onSignal } = makePeer(true);
    await pc.onnegotiationneeded?.();
    expect(pc.localDescription?.type).toBe("offer");
    expect(onSignal).toHaveBeenCalledWith(
      "offer",
      JSON.stringify(pc.localDescription),
    );
  });
});

describe("handleSignal — no collision", () => {
  it("accepts a remote offer while stable and answers it", async () => {
    const { peer, pc, onSignal } = makePeer(false);
    const remoteOffer: FakeDescription = { type: "offer", sdp: "remote-offer" };
    await peer.handleSignal(
      "offer",
      JSON.stringify(remoteOffer),
      onSignal,
    );
    expect(pc.remoteDescription).toEqual(remoteOffer);
    expect(pc.localDescription?.type).toBe("answer");
    expect(onSignal).toHaveBeenCalledWith(
      "answer",
      JSON.stringify(pc.localDescription),
    );
  });

  it("applies a remote answer without generating a further signal", async () => {
    const { peer, pc, onSignal } = makePeer(true);
    await pc.onnegotiationneeded?.(); // puts us in have-local-offer, like a real caller
    onSignal.mockClear();

    const remoteAnswer: FakeDescription = { type: "answer", sdp: "remote-answer" };
    await peer.handleSignal("answer", JSON.stringify(remoteAnswer), onSignal);

    expect(pc.remoteDescription).toEqual(remoteAnswer);
    expect(onSignal).not.toHaveBeenCalled();
  });
});

describe("handleSignal — glare (simultaneous offers)", () => {
  it("impolite peer ignores the incoming offer and keeps its own", async () => {
    const { peer, pc, onSignal } = makePeer(false);
    await pc.onnegotiationneeded?.(); // pc now has an outstanding local offer
    const ourOffer = pc.localDescription;
    onSignal.mockClear();

    const remoteOffer: FakeDescription = { type: "offer", sdp: "their-offer" };
    await peer.handleSignal("offer", JSON.stringify(remoteOffer), onSignal);

    expect(pc.remoteDescription).toBeNull();
    expect(pc.localDescription).toEqual(ourOffer);
    expect(onSignal).not.toHaveBeenCalled();
  });

  it("polite peer yields (implicit rollback) and answers the incoming offer", async () => {
    const { peer, pc, onSignal } = makePeer(true);
    await pc.onnegotiationneeded?.(); // pc now has an outstanding local offer
    onSignal.mockClear();

    const remoteOffer: FakeDescription = { type: "offer", sdp: "their-offer" };
    await peer.handleSignal("offer", JSON.stringify(remoteOffer), onSignal);

    expect(pc.remoteDescription).toEqual(remoteOffer);
    expect(pc.localDescription?.type).toBe("answer");
    expect(onSignal).toHaveBeenCalledWith(
      "answer",
      JSON.stringify(pc.localDescription),
    );
  });
});

describe("handleSignal — ICE candidates", () => {
  it("forwards an ice candidate to the connection", async () => {
    const { peer, pc, onSignal } = makePeer(true);
    const candidate = { candidate: "fake", sdpMid: "0", sdpMLineIndex: 0 };
    await peer.handleSignal(
      "ice-candidate",
      JSON.stringify(candidate),
      onSignal,
    );
    expect(pc.iceCandidates).toEqual([candidate]);
  });

  it("silently drops a candidate that fails while an offer was ignored", async () => {
    const { peer, pc, onSignal } = makePeer(false);
    await pc.onnegotiationneeded?.();
    onSignal.mockClear();

    // trigger glare so the peer marks this round's offer as ignored
    await peer.handleSignal(
      "offer",
      JSON.stringify({ type: "offer", sdp: "their-offer" }),
      onSignal,
    );

    pc.addIceCandidate = async () => {
      throw new Error("candidate rejected");
    };

    await expect(
      peer.handleSignal(
        "ice-candidate",
        JSON.stringify({ candidate: "fake" }),
        onSignal,
      ),
    ).resolves.toBeUndefined();
  });
});

describe("close", () => {
  it("closes the underlying connection", () => {
    const { peer, pc } = makePeer(true);
    peer.close();
    expect(pc.closed).toBe(true);
  });
});

describe("replaceLocalStream", () => {
  it("replaces the track on the matching sender", async () => {
    const { peer, pc } = makePeer(true);
    const newAudioTrack: FakeTrack = { kind: "audio" };
    const newStream = {
      getTracks: () => [newAudioTrack],
    } as unknown as MediaStream;

    peer.replaceLocalStream(newStream);
    // replaceTrack is invoked asynchronously (fire-and-forget in source); flush microtasks
    await Promise.resolve();

    const audioSender = pc.senders.find((s) => s.track?.kind === "audio");
    expect(audioSender?.track).toBe(newAudioTrack);
  });

  it("adds a new track when no sender matches its kind", () => {
    const { peer, pc } = makePeer(true);
    const screenTrack: FakeTrack = { kind: "screen" };
    const newStream = {
      getTracks: () => [screenTrack],
    } as unknown as MediaStream;

    const before = pc.tracks.length;
    peer.replaceLocalStream(newStream);

    expect(pc.tracks.length).toBe(before + 1);
    expect(pc.tracks[pc.tracks.length - 1].track).toBe(screenTrack);
  });
});
