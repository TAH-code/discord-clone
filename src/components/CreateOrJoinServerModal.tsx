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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setMode("create")}
            className={`flex-1 rounded-md py-1.5 text-sm font-semibold ${
              mode === "create"
                ? "bg-indigo-600 text-white"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            Create a server
          </button>
          <button
            onClick={() => setMode("join")}
            className={`flex-1 rounded-md py-1.5 text-sm font-semibold ${
              mode === "join"
                ? "bg-indigo-600 text-white"
                : "bg-neutral-100 text-neutral-600"
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
                className="w-full rounded-md bg-neutral-50 px-3 py-2 text-neutral-900 outline-none ring-1 ring-neutral-200 focus:ring-indigo-500"
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
                className="w-full rounded-md bg-neutral-50 px-3 py-2 text-neutral-900 outline-none ring-1 ring-neutral-200 focus:ring-indigo-500"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {mode === "create" ? "Create" : "Join"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
