interface CallControlsProps {
  micOn: boolean;
  cameraOn: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
}

function ControlButton({
  onClick,
  active,
  danger,
  icon,
  label,
}: {
  onClick?: () => void;
  active?: boolean;
  danger?: boolean;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 text-xs text-neutral-300 hover:text-white"
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full text-base ${
          danger
            ? "bg-red-600 text-white hover:bg-red-500"
            : active
              ? "bg-indigo-600 text-white"
              : "bg-neutral-700 text-white hover:bg-neutral-600"
        }`}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}

export default function CallControls({
  micOn,
  cameraOn,
  onToggleMic,
  onToggleCamera,
  onLeave,
}: CallControlsProps) {
  return (
    <div className="flex flex-shrink-0 items-center justify-center gap-6 bg-neutral-900 py-3">
      <ControlButton
        onClick={onToggleMic}
        icon={micOn ? "🎤" : "🔇"}
        label="Mute"
        danger={!micOn}
      />
      <ControlButton
        onClick={onToggleCamera}
        icon={cameraOn ? "📷" : "📵"}
        label="Camera"
        danger={!cameraOn}
      />
      <ControlButton icon="🖥" label="Share" />
      <ControlButton icon="✨" label="Effects" />
      <ControlButton icon="⋯" label="More" />
      <button
        onClick={onLeave}
        className="flex flex-col items-center gap-1 text-xs text-neutral-300 hover:text-white"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-base text-white hover:bg-red-500">
          📞
        </span>
        Leave
      </button>
    </div>
  );
}
