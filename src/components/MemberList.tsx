export interface MemberSummary {
  _id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  presence: "online" | "offline";
  isOwner: boolean;
}

interface MemberListProps {
  members: MemberSummary[];
  currentUserId?: string;
  onMessage?: (userId: string) => void;
  onRemove?: (userId: string) => void;
  canManage?: boolean;
}

export default function MemberList({
  members,
  currentUserId,
  onMessage,
  onRemove,
  canManage = false,
}: MemberListProps) {
  const online = members.filter((m) => m.presence === "online");
  const offline = members.filter((m) => m.presence === "offline");

  return (
    <div className="w-60 flex-shrink-0 space-y-4 overflow-y-auto border-l border-neutral-200 bg-panel px-3 py-3">
      <MemberGroup
        title={`Online — ${online.length}`}
        members={online}
        currentUserId={currentUserId}
        onMessage={onMessage}
        onRemove={onRemove}
        canManage={canManage}
      />
      <MemberGroup
        title={`Offline — ${offline.length}`}
        members={offline}
        currentUserId={currentUserId}
        onMessage={onMessage}
        onRemove={onRemove}
        canManage={canManage}
      />
    </div>
  );
}

function MemberGroup({
  title,
  members,
  currentUserId,
  onMessage,
  onRemove,
  canManage,
}: {
  title: string;
  members: MemberSummary[];
  currentUserId?: string;
  onMessage?: (userId: string) => void;
  onRemove?: (userId: string) => void;
  canManage: boolean;
}) {
  if (members.length === 0) return null;
  return (
    <div>
      <div className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {title}
      </div>
      {members.map((member) => (
        <div
          key={member._id}
          className="group flex items-center justify-between rounded-md px-1 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          <button
            onClick={() =>
              member.userId !== currentUserId && onMessage?.(member.userId)
            }
            className={`flex flex-1 items-center gap-2 truncate text-left ${
              member.presence === "offline" ? "opacity-50" : ""
            }`}
            disabled={member.userId === currentUserId}
          >
            <span className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-300 text-xs font-semibold text-white">
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                member.name.slice(0, 2).toUpperCase()
              )}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-panel ${
                  member.presence === "online" ? "bg-emerald-500" : "bg-neutral-300"
                }`}
              />
            </span>
            <span className="min-w-0 flex-1 truncate">
              <span className="block truncate font-medium text-neutral-900">
                {member.name}
                {member.isOwner && <span className="ml-1 text-xs">👑</span>}
              </span>
            </span>
          </button>
          {canManage && member.userId !== currentUserId && (
            <button
              title="Remove from server"
              onClick={() => onRemove?.(member.userId)}
              className="hidden flex-shrink-0 text-neutral-400 hover:text-red-500 group-hover:block"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
