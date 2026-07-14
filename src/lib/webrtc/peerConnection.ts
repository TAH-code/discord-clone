import { ICE_SERVERS } from "./constants";

export type SignalKind = "offer" | "answer" | "ice-candidate";

export interface PeerConnectionCallbacks {
  onTrack: (stream: MediaStream) => void;
  onSignal: (kind: SignalKind, payload: string) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

/**
 * One RTCPeerConnection to a single remote participant, implementing the
 * "perfect negotiation" pattern (research.md §4) so both peers run identical
 * negotiation logic regardless of who joined the call first. `polite` is
 * assigned deterministically (lower user id = polite) so both sides agree on
 * who yields during an offer/offer collision ("glare").
 */
export class PerfectNegotiationPeer {
  readonly pc: RTCPeerConnection;
  private readonly polite: boolean;
  private makingOffer = false;
  private ignoreOffer = false;

  constructor(
    polite: boolean,
    localStream: MediaStream,
    callbacks: PeerConnectionCallbacks,
  ) {
    this.polite = polite;
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    for (const track of localStream.getTracks()) {
      this.pc.addTrack(track, localStream);
    }

    this.pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;
        await this.pc.setLocalDescription();
        if (this.pc.localDescription) {
          callbacks.onSignal(
            "offer",
            JSON.stringify(this.pc.localDescription),
          );
        }
      } catch (err) {
        console.error("negotiationneeded failed", err);
      } finally {
        this.makingOffer = false;
      }
    };

    this.pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        callbacks.onSignal("ice-candidate", JSON.stringify(candidate));
      }
    };

    this.pc.ontrack = ({ streams }) => {
      if (streams[0]) callbacks.onTrack(streams[0]);
    };

    if (callbacks.onConnectionStateChange) {
      this.pc.onconnectionstatechange = () => {
        callbacks.onConnectionStateChange?.(this.pc.connectionState);
      };
    }
  }

  /** Feed an incoming signal (offer/answer/ice-candidate) from the remote peer. */
  async handleSignal(
    kind: SignalKind,
    payload: string,
    onSignal: (kind: SignalKind, payload: string) => void,
  ) {
    try {
      if (kind === "offer" || kind === "answer") {
        const description: RTCSessionDescriptionInit = JSON.parse(payload);

        const offerCollision =
          description.type === "offer" &&
          (this.makingOffer || this.pc.signalingState !== "stable");

        this.ignoreOffer = !this.polite && offerCollision;
        if (this.ignoreOffer) return;

        // For the polite peer, setRemoteDescription implicitly rolls back
        // its own outstanding offer when a collision is detected (modern
        // WebRTC spec behavior) — no explicit rollback call needed.
        await this.pc.setRemoteDescription(description);

        if (description.type === "offer") {
          await this.pc.setLocalDescription();
          if (this.pc.localDescription) {
            onSignal("answer", JSON.stringify(this.pc.localDescription));
          }
        }
      } else if (kind === "ice-candidate") {
        const candidate: RTCIceCandidateInit = JSON.parse(payload);
        try {
          await this.pc.addIceCandidate(candidate);
        } catch (err) {
          if (!this.ignoreOffer) throw err;
        }
      }
    } catch (err) {
      console.error("handleSignal failed", err);
    }
  }

  replaceLocalStream(stream: MediaStream) {
    const senders = this.pc.getSenders();
    for (const track of stream.getTracks()) {
      const sender = senders.find((s) => s.track?.kind === track.kind);
      if (sender) {
        void sender.replaceTrack(track);
      } else {
        this.pc.addTrack(track, stream);
      }
    }
  }

  close() {
    this.pc.close();
  }
}
