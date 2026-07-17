interface CallParticipantSummary {
  userId: string;
  userName: string;
  micOn: boolean;
  cameraOn: boolean;
  isYou: boolean;
}

interface CallSidebarProps {
  participants: CallParticipantSummary[];
  onInvite?: () => void;
}

export default function CallSidebar({ participants, onInvite }: CallSidebarProps) {
  return (
    <div className="flex w-60 flex-shrink-0 flex-col gap-3 border-l border-neutral-200 bg-panel px-3 py-3">
      <div className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        In this call — {participants.length}
      </div>
      <div className="space-y-1">
        {participants.map((p) => (
          <div
            key={p.userId}
            className="flex items-center justify-between rounded-md px-1 py-1.5 text-sm text-neutral-700"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-300 text-xs font-semibold text-white">
                {p.userName.slice(0, 2).toUpperCase()}
              </span>
              <span className="truncate">
                <span className="block truncate font-medium text-neutral-900">
                  {p.userName}
                </span>
                <span className="block truncate text-xs text-neutral-400">
                  {p.isYou ? "You speaking" : p.cameraOn ? "Camera on" : "Camera off"}
                </span>
              </span>
            </div>
            <span className="flex-shrink-0 text-neutral-400">
              {!p.micOn && "🔇"}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-auto rounded-lg bg-neutral-50 p-3">
        <p className="mb-1 text-xs font-semibold text-neutral-900">
          Invite to call
        </p>
        <p className="mb-2 text-xs text-neutral-400">
          Add teammates from this server.
        </p>
        <button
          onClick={onInvite}
          className="w-full rounded-md bg-indigo-600 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Invite
        </button>
      </div>
    </div>
  );
}
