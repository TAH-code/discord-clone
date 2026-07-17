import { Link, useParams } from "react-router-dom";

export interface ThreadSummary {
  _id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl?: string;
}

interface DirectMessageListProps {
  serverId: string;
  threads: ThreadSummary[];
}

export default function DirectMessageList({
  serverId,
  threads,
}: DirectMessageListProps) {
  const { threadId: activeThreadId } = useParams();
  if (threads.length === 0) return null;

  return (
    <div className="flex-shrink-0 border-t border-neutral-200 bg-panel-muted px-2 py-3">
      <div className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        Direct Messages
      </div>
      {threads.map((thread) => (
        <Link
          key={thread._id}
          to={`/servers/${serverId}/dm/${thread._id}`}
          className={`flex items-center gap-2 truncate rounded-md px-2 py-1.5 text-sm ${
            activeThreadId === thread._id
              ? "bg-white font-medium text-neutral-900 shadow-sm ring-1 ring-neutral-200"
              : "text-neutral-500 hover:bg-white/60 hover:text-neutral-900"
          }`}
        >
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-neutral-300 text-[10px] font-semibold text-white">
            {thread.otherUserAvatarUrl ? (
              <img
                src={thread.otherUserAvatarUrl}
                alt={thread.otherUserName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              thread.otherUserName.slice(0, 2).toUpperCase()
            )}
          </span>
          {thread.otherUserName}
        </Link>
      ))}
    </div>
  );
}
