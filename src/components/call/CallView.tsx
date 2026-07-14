import type { Id } from "../../../convex/_generated/dataModel";
import { useWebRTCCall } from "../../hooks/useWebRTCCall";
import VideoTile from "./VideoTile";
import CallControls from "./CallControls";

interface CallViewProps {
  callId: Id<"calls">;
  onLeave: () => void;
}

export default function CallView({ callId, onLeave }: CallViewProps) {
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

  async function handleLeave() {
    await leave();
    onLeave();
  }

  if (mediaError) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-red-400">
        Could not access camera/microphone: {mediaError}
      </div>
    );
  }

  const me = participants.find((p) => p.userId === currentUserId);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-3 overflow-y-auto p-4">
        {me && (
          <VideoTile
            name={`${me.userName} (You)`}
            stream={localStream}
            muted
            micOn={me.micOn}
            cameraOn={me.cameraOn}
            speaking={me.speaking}
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
  );
}
