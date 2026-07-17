interface TopNavbarProps {
  icon?: string;
  title: string;
  subtitle?: string;
  showMemberToggle?: boolean;
  membersVisible?: boolean;
  onToggleMembers?: () => void;
  rightSlot?: React.ReactNode;
}

export default function TopNavbar({
  icon = "#",
  title,
  subtitle,
  showMemberToggle = false,
  membersVisible = true,
  onToggleMembers,
  rightSlot,
}: TopNavbarProps) {
  return (
    <div className="flex h-12 flex-shrink-0 items-center gap-3 border-b border-neutral-200 bg-panel px-4">
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="flex-shrink-0 font-semibold text-neutral-900">
          <span className="mr-1 text-neutral-400">{icon}</span>
          {title}
        </span>
        {subtitle && (
          <span className="truncate text-sm text-neutral-400">{subtitle}</span>
        )}
      </div>
      <div className="ml-auto flex flex-shrink-0 items-center gap-3">
        {rightSlot}
        <span title="Pinned messages" className="text-neutral-400">
          📌
        </span>
        {showMemberToggle && (
          <button
            title="Toggle member list"
            onClick={onToggleMembers}
            className={membersVisible ? "text-neutral-900" : "text-neutral-400"}
          >
            👥
          </button>
        )}
        <div className="flex items-center gap-1.5 rounded-md bg-neutral-100 px-2 py-1 text-sm text-neutral-400">
          <span>🔍</span>
          <span className="hidden sm:inline">Search</span>
        </div>
      </div>
    </div>
  );
}
