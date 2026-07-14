import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PerfectNegotiationPeer } from "../lib/webrtc/peerConnection";

const HEARTBEAT_INTERVAL_MS = 10_000;
const SPEAKING_CHECK_INTERVAL_MS = 300;
const SPEAKING_THRESHOLD = 12;

export function useWebRTCCall(callId: Id<"calls"> | null) {
  const currentUser = useQuery(api.users.getCurrentUser);
  const participants = useQuery(
    api.calls.listParticipants,
    callId ? { callId } : "skip",
  );
  const signals = useQuery(
    api.signals.listSignalsForMe,
    callId ? { callId } : "skip",
  );

  const sendSignal = useMutation(api.signals.sendSignal);
  const consumeSignal = useMutation(api.signals.consumeSignal);
  const setMediaState = useMutation(api.calls.setMediaState);
  const setSpeaking = useMutation(api.calls.setSpeaking);
  const heartbeatCall = useMutation(api.calls.heartbeatCall);
  const leaveCall = useMutation(api.calls.leaveCall);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});

  const peersRef = useRef<Map<string, PerfectNegotiationPeer>>(new Map());

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        setLocalStream(s);
      })
      .catch((err) => {
        setMediaError(
          err instanceof Error ? err.message : "Could not access camera/mic",
        );
      });
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!callId) return;
    const id = setInterval(() => void heartbeatCall({ callId }), HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [callId, heartbeatCall]);

  // local speaking detection via Web Audio API, throttled
  useEffect(() => {
    if (!localStream || !callId) return;
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(localStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let lastSpeaking = false;

    const id = setInterval(() => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
      const speaking = avg > SPEAKING_THRESHOLD;
      if (speaking !== lastSpeaking) {
        lastSpeaking = speaking;
        void setSpeaking({ callId, speaking });
      }
    }, SPEAKING_CHECK_INTERVAL_MS);

    return () => {
      clearInterval(id);
      void audioContext.close();
    };
  }, [localStream, callId, setSpeaking]);

  // create/tear down per-peer connections as the participant list changes
  useEffect(() => {
    if (!callId || !localStream || !currentUser || !participants) return;
    const others = participants.filter((p) => p.userId !== currentUser._id);
    const otherIds = new Set<string>(others.map((p) => p.userId));

    for (const other of others) {
      if (peersRef.current.has(other.userId)) continue;
      const polite = currentUser._id < other.userId;
      const peer = new PerfectNegotiationPeer(polite, localStream, {
        onTrack: (stream) =>
          setRemoteStreams((prev) => ({ ...prev, [other.userId]: stream })),
        onSignal: (kind, payload) =>
          void sendSignal({
            callId,
            toUserId: other.userId as Id<"users">,
            kind,
            payload,
          }),
      });
      peersRef.current.set(other.userId, peer);
    }

    for (const [userId, peer] of peersRef.current) {
      if (!otherIds.has(userId)) {
        peer.close();
        peersRef.current.delete(userId);
        setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }
    }
  }, [callId, localStream, currentUser, participants, sendSignal]);

  // drive negotiation from incoming signals
  useEffect(() => {
    if (!signals || !callId) return;
    for (const signal of signals) {
      const peer = peersRef.current.get(signal.fromUserId);
      if (peer) {
        void peer.handleSignal(signal.kind, signal.payload, (kind, payload) =>
          void sendSignal({
            callId,
            toUserId: signal.fromUserId,
            kind,
            payload,
          }),
        );
      }
      void consumeSignal({ signalId: signal._id });
    }
  }, [signals, callId, sendSignal, consumeSignal]);

  useEffect(() => {
    return () => {
      for (const peer of peersRef.current.values()) peer.close();
      peersRef.current.clear();
    };
  }, []);

  function toggleMic() {
    if (!localStream || !callId) return;
    const next = !micOn;
    localStream.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
    void setMediaState({ callId, micOn: next });
  }

  function toggleCamera() {
    if (!localStream || !callId) return;
    const next = !cameraOn;
    localStream.getVideoTracks().forEach((t) => (t.enabled = next));
    setCameraOn(next);
    void setMediaState({ callId, cameraOn: next });
  }

  async function leave() {
    if (callId) {
      await leaveCall({ callId });
    }
    localStream?.getTracks().forEach((t) => t.stop());
    for (const peer of peersRef.current.values()) peer.close();
    peersRef.current.clear();
  }

  return {
    localStream,
    mediaError,
    remoteStreams,
    participants: participants ?? [],
    currentUserId: currentUser?._id,
    micOn,
    cameraOn,
    toggleMic,
    toggleCamera,
    leave,
  };
}
