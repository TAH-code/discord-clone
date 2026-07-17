interface UserBarProps {
  name: string;
  avatarUrl?: string;
  onOpenSettings?: () => void;
}

export default function UserBar({ name, avatarUrl, onOpenSettings }: UserBarProps) {
  return (
    <div className="flex flex-shrink-0 items-center gap-2 border-t border-neutral-200 bg-panel-muted px-2 py-2">
      <span className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-300 text-xs font-semibold text-white">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          name.slice(0, 2).toUpperCase()
        )}
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-panel-muted bg-emerald-500" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900">{name}</p>
        <p className="truncate text-xs text-neutral-500">Online</p>
      </div>
      <button title="Mute" className="text-neutral-400 hover:text-neutral-900">
        🎤
      </button>
      <button title="Deafen" className="text-neutral-400 hover:text-neutral-900">
        🎧
      </button>
      <button
        title="Settings"
        onClick={onOpenSettings}
        className="text-neutral-400 hover:text-neutral-900"
      >
        ⚙
      </button>
    </div>
  );
}
