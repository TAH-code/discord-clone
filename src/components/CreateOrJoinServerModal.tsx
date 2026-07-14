import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";

interface CreateOrJoinServerModalProps {
  onClose: () => void;
}

export default function CreateOrJoinServerModal({
  onClose,
}: CreateOrJoinServerModalProps) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const createServer = useMutation(api.servers.createServer);
  const joinViaInvite = useMutation(api.servers.joinViaInvite);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const serverId =
        mode === "create"
          ? await createServer({ name })
          : await joinViaInvite({ inviteCode: inviteCode.trim() });
      navigate(`/servers/${serverId}`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-lg bg-neutral-800 p-6 shadow-xl">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setMode("create")}
            className={`flex-1 rounded py-1.5 text-sm font-semibold ${
              mode === "create"
                ? "bg-indigo-600 text-white"
                : "bg-neutral-700 text-neutral-300"
            }`}
          >
            Create a server
          </button>
          <button
            onClick={() => setMode("join")}
            className={`flex-1 rounded py-1.5 text-sm font-semibold ${
              mode === "join"
                ? "bg-indigo-600 text-white"
                : "bg-neutral-700 text-neutral-300"
            }`}
          >
            Join via invite
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "create" ? (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-neutral-400">
                Server name
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded bg-neutral-900 px-3 py-2 text-white outline-none ring-1 ring-neutral-700 focus:ring-indigo-500"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-neutral-400">
                Invite code
              </label>
              <input
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full rounded bg-neutral-900 px-3 py-2 text-white outline-none ring-1 ring-neutral-700 focus:ring-indigo-500"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-1.5 text-sm text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {mode === "create" ? "Create" : "Join"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
