import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { Navigate, useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export default function JoinInvitePage() {
  const { inviteCode } = useParams();
  const joinViaInvite = useMutation(api.servers.joinViaInvite);
  const [serverId, setServerId] = useState<Id<"servers"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inviteCode) return;
    joinViaInvite({ inviteCode })
      .then(setServerId)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Invalid invite link"),
      );
  }, [inviteCode, joinViaInvite]);

  if (serverId) return <Navigate to={`/servers/${serverId}`} replace />;
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900 text-red-400">
        {error}
      </div>
    );
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900 text-neutral-400">
      Joining server…
    </div>
  );
}
