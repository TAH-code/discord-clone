import { useEffect, useRef, useState } from "react";

export interface MessageItem {
  _id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  body: string;
  createdAt: number;
  editedAt?: number;
}

interface MessageListProps {
  messages: MessageItem[];
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
  loadMore: (n: number) => void;
  currentUserId?: string;
  onEdit: (messageId: string, body: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
}

export default function MessageList({
  messages,
  status,
  loadMore,
  currentUserId,
  onEdit,
  onDelete,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const prevMessageCountRef = useRef(messages.length);

  // messages arrive newest-first from the paginated query; chronological order for display
  const chronological = [...messages].reverse();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const grewAtTop = chronological.length > prevMessageCountRef.current;
    if (grewAtTop && status !== "LoadingFirstPage") {
      // preserve scroll position when older history is prepended
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
    } else {
      el.scrollTop = el.scrollHeight;
    }
    prevMessageCountRef.current = chronological.length;
    prevScrollHeightRef.current = el.scrollHeight;
  }, [chronological.length, status]);

  return (
    <div
      ref={containerRef}
      className="flex flex-1 flex-col overflow-y-auto bg-panel px-4 py-2"
      onScroll={(e) => {
        const el = e.currentTarget;
        if (el.scrollTop < 100 && status === "CanLoadMore") {
          loadMore(25);
        }
      }}
    >
      {status === "CanLoadMore" && (
        <button
          onClick={() => loadMore(25)}
          className="mb-2 w-full text-center text-xs text-neutral-400 hover:text-neutral-700"
        >
          Load older messages
        </button>
      )}
      {status === "LoadingMore" && (
        <p className="mb-2 text-center text-xs text-neutral-400">Loading…</p>
      )}
      {chronological.map((message) => (
        <MessageRow
          key={message._id}
          message={message}
          isOwn={message.authorId === currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function MessageRow({
  message,
  isOwn,
  onEdit,
  onDelete,
}: {
  message: MessageItem;
  isOwn: boolean;
  onEdit: (messageId: string, body: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);

  async function handleSaveEdit() {
    if (draft.trim() && draft !== message.body) {
      await onEdit(message._id, draft.trim());
    }
    setEditing(false);
  }

  return (
    <div className="group flex gap-3 rounded-md px-2 py-1.5 hover:bg-neutral-50">
      <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-neutral-300 text-xs font-semibold text-white">
        {message.authorAvatarUrl ? (
          <img
            src={message.authorAvatarUrl}
            alt={message.authorName}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          message.authorName.slice(0, 2).toUpperCase()
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-neutral-900">
            {message.authorName}
          </span>
          <span className="text-xs text-neutral-400">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {message.editedAt && (
            <span className="text-xs text-neutral-400">(edited)</span>
          )}
        </div>
        {editing ? (
          <div className="mt-1 flex gap-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSaveEdit();
                if (e.key === "Escape") setEditing(false);
              }}
              className="flex-1 rounded bg-white px-2 py-1 text-sm text-neutral-900 outline-none ring-1 ring-neutral-300 focus:ring-indigo-500"
            />
            <button
              onClick={() => void handleSaveEdit()}
              className="text-xs text-indigo-600 hover:text-indigo-500"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-neutral-400 hover:text-neutral-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words text-neutral-700">
            {message.body}
          </p>
        )}
      </div>
      {isOwn && !editing && (
        <div className="hidden gap-2 self-start group-hover:flex">
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-neutral-400 hover:text-neutral-900"
          >
            ✎
          </button>
          <button
            onClick={() => void onDelete(message._id)}
            className="text-xs text-neutral-400 hover:text-red-500"
          >
            🗑
          </button>
        </div>
      )}
    </div>
  );
}
