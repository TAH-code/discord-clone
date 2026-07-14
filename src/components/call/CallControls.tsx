interface CallControlsProps {
  micOn: boolean;
  cameraOn: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
}

export default function CallControls({
  micOn,
  cameraOn,
  onToggleMic,
  onToggleCamera,
  onLeave,
}: CallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 border-t border-neutral-950 bg-neutral-900 py-4">
      <button
        onClick={onToggleMic}
        title={micOn ? "Mute" : "Unmute"}
        className={`flex h-12 w-12 items-center justify-center rounded-full text-lg ${
          micOn
            ? "bg-neutral-700 text-white hover:bg-neutral-600"
            : "bg-red-600 text-white hover:bg-red-500"
        }`}
      >
        {micOn ? "🎤" : "🔇"}
      </button>
      <button
        onClick={onToggleCamera}
        title={cameraOn ? "Turn camera off" : "Turn camera on"}
        className={`flex h-12 w-12 items-center justify-center rounded-full text-lg ${
          cameraOn
            ? "bg-neutral-700 text-white hover:bg-neutral-600"
            : "bg-red-600 text-white hover:bg-red-500"
        }`}
      >
        {cameraOn ? "📷" : "📵"}
      </button>
      <button
        onClick={onLeave}
        title="Leave call"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-lg text-white hover:bg-red-500"
      >
        📞
      </button>
    </div>
  );
}
