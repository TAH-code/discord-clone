import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface CreateChannelModalProps {
  serverId: Id<"servers">;
  onClose: () => void;
}

export default function CreateChannelModal({
  serverId,
  onClose,
}: CreateChannelModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"text" | "voice">("text");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const createChannel = useMutation(api.channels.createChannel);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createChannel({ serverId, name, type });
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
        <h2 className="mb-4 text-lg font-bold text-white">Create Channel</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-neutral-400">
              Channel type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("text")}
                className={`flex-1 rounded py-1.5 text-sm ${
                  type === "text"
                    ? "bg-indigo-600 text-white"
                    : "bg-neutral-700 text-neutral-300"
                }`}
              >
                # Text
              </button>
              <button
                type="button"
                onClick={() => setType("voice")}
                className={`flex-1 rounded py-1.5 text-sm ${
                  type === "voice"
                    ? "bg-indigo-600 text-white"
                    : "bg-neutral-700 text-neutral-300"
                }`}
              >
                🔊 Voice
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-neutral-400">
              Channel name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded bg-neutral-900 px-3 py-2 text-white outline-none ring-1 ring-neutral-700 focus:ring-indigo-500"
            />
          </div>

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
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
