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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-neutral-900">
          Create Channel
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-neutral-400">
              Channel type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("text")}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium ${
                  type === "text"
                    ? "bg-indigo-600 text-white"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                # Text
              </button>
              <button
                type="button"
                onClick={() => setType("voice")}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium ${
                  type === "voice"
                    ? "bg-indigo-600 text-white"
                    : "bg-neutral-100 text-neutral-600"
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
              className="w-full rounded-md bg-neutral-50 px-3 py-2 text-neutral-900 outline-none ring-1 ring-neutral-200 focus:ring-indigo-500"
            />
          </div>

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
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
