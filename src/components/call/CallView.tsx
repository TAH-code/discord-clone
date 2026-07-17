import { useEffect, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { useWebRTCCall } from "../../hooks/useWebRTCCall";
import VideoTile from "./VideoTile";
import CallControls from "./CallControls";
import CallSidebar from "./CallSidebar";

interface CallViewProps {
  callId: Id<"calls">;
  title: string;
  onLeave: () => void;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function CallView({ callId, title, onLeave }: CallViewProps) {
  const {
    localStream,
    mediaError,
    remoteStreams,
    participants,
    currentUserId,
    micOn,
    cameraOn,
    toggleMic,
    toggleCamera,
    leave,
  } = useWebRTCCall(callId);

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  async function handleLeave() {
    await leave();
    onLeave();
  }

  if (mediaError) {
    return (
      <div className="flex flex-1 items-center justify-center bg-panel p-6 text-center text-red-500">
        Could not access camera/microphone: {mediaError}
      </div>
    );
  }

  const me = participants.find((p) => p.userId === currentUserId);

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col overflow-hidden bg-neutral-950">
        <div className="flex h-12 flex-shrink-0 items-center gap-2 border-b border-white/10 px-4 text-white">
          <span className="font-semibold">{title}</span>
          <span className="flex items-center gap-1 text-xs text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {formatDuration(elapsed)}
          </span>
          <div className="ml-auto flex items-center gap-3 text-sm text-neutral-400">
            <span className="flex items-center gap-1">
              <span>📶</span> Excellent
            </span>
            <button title="Chat">💬</button>
            <button title="Fullscreen">⛶</button>
          </div>
        </div>
        <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-3 overflow-y-auto p-4">
          {me && (
            <VideoTile
              name={me.userName}
              stream={localStream}
              muted
              micOn={me.micOn}
              cameraOn={me.cameraOn}
              speaking={me.speaking}
              isYou
            />
          )}
          {participants
            .filter((p) => p.userId !== currentUserId)
            .map((p) => (
              <VideoTile
                key={p.userId}
                name={p.userName}
                stream={remoteStreams[p.userId] ?? null}
                micOn={p.micOn}
                cameraOn={p.cameraOn}
                speaking={p.speaking}
              />
            ))}
        </div>
        <CallControls
          micOn={micOn}
          cameraOn={cameraOn}
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
          onLeave={() => void handleLeave()}
        />
      </div>
      <CallSidebar
        participants={participants.map((p) => ({
          userId: p.userId,
          userName: p.userName,
          micOn: p.micOn,
          cameraOn: p.cameraOn,
          isYou: p.userId === currentUserId,
        }))}
      />
    </div>
  );
}
