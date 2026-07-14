import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import CallView from "../components/call/CallView";

export default function VoiceChannelPage({
  channelId,
}: {
  channelId: Id<"channels">;
}) {
  const joinVoiceChannel = useMutation(api.calls.joinVoiceChannel);
  const [callId, setCallId] = useState<Id<"calls"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasLeft, setHasLeft] = useState(false);

  useEffect(() => {
    if (hasLeft) return;
    let cancelled = false;
    setError(null);
    void joinVoiceChannel({ channelId }).then((result) => {
      if (cancelled) return;
      if (result.error !== undefined) {
        setError(result.error);
      } else if (result.callId !== undefined) {
        setCallId(result.callId);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [channelId, joinVoiceChannel, hasLeft]);

  if (hasLeft) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-neutral-400">
        You left the call.
        <button
          onClick={() => setHasLeft(false)}
          className="rounded bg-neutral-700 px-4 py-1.5 text-sm text-white hover:bg-neutral-600"
        >
          Rejoin
        </button>
      </div>
    );
  }

  if (error === "channel_full") {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-neutral-400">
        This voice channel is full (max 4 participants). Try again once
        someone leaves.
      </div>
    );
  }

  if (callId === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-neutral-400">
        Joining voice channel…
      </div>
    );
  }

  return <CallView callId={callId} onLeave={() => setHasLeft(true)} />;
}
