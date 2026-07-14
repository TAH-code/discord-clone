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
    <div className="w-60 space-y-4 overflow-y-auto bg-neutral-900 px-3 py-3">
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
      <div className="mb-1 px-1 text-xs font-semibold uppercase text-neutral-500">
        {title}
      </div>
      {members.map((member) => (
        <div
          key={member._id}
          className="group flex items-center justify-between rounded px-1 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800/60"
        >
          <button
            onClick={() =>
              member.userId !== currentUserId && onMessage?.(member.userId)
            }
            className="flex flex-1 items-center gap-2 truncate text-left"
            disabled={member.userId === currentUserId}
          >
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-neutral-700 text-xs font-semibold text-white">
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
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-neutral-900 ${
                  member.presence === "online" ? "bg-emerald-500" : "bg-neutral-600"
                }`}
              />
            </span>
            <span className="truncate">
              {member.name}
              {member.isOwner && (
                <span className="ml-1 text-xs text-amber-400">👑</span>
              )}
            </span>
          </button>
          {canManage && member.userId !== currentUserId && (
            <button
              title="Remove from server"
              onClick={() => onRemove?.(member.userId)}
              className="hidden text-neutral-500 hover:text-red-400 group-hover:block"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
