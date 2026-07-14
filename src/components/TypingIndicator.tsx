interface TypingUser {
  _id: string;
  name?: string;
}

interface TypingIndicatorProps {
  users: TypingUser[];
}

export default function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return <div className="h-5 px-4" />;

  const names = users.map((u) => u.name ?? "Someone");
  const text =
    names.length === 1
      ? `${names[0]} is typing…`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing…`
        : `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]} are typing…`;

  return <div className="h-5 px-4 text-xs italic text-neutral-400">{text}</div>;
}
