interface TypingUser {
  _id: string;
  name?: string;
}

interface TypingIndicatorProps {
  users: TypingUser[];
}

export default function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return <div className="h-6 flex-shrink-0 bg-panel px-4" />;

  const names = users.map((u) => u.name ?? "Someone");
  const text =
    names.length === 1
      ? `${names[0]} is typing…`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing…`
        : `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]} are typing…`;

  return (
    <div className="flex h-6 flex-shrink-0 items-center gap-1.5 bg-panel px-4">
      <div className="flex -space-x-1.5">
        {users.slice(0, 3).map((u) => (
          <span
            key={u._id}
            className="flex h-4 w-4 items-center justify-center rounded-full border border-panel bg-neutral-300 text-[8px] font-semibold text-white"
          >
            {(u.name ?? "?").slice(0, 1).toUpperCase()}
          </span>
        ))}
      </div>
      <span className="text-xs italic text-neutral-400">{text}</span>
    </div>
  );
}
