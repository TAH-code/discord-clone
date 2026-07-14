import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface ServerSettingsModalProps {
  serverId: Id<"servers">;
  serverName: string;
  isOwner: boolean;
  onClose: () => void;
}

export default function ServerSettingsModal({
  serverId,
  serverName,
  isOwner,
  onClose,
}: ServerSettingsModalProps) {
  const [name, setName] = useState(serverName);
  const [copied, setCopied] = useState(false);
  const invite = useQuery(api.servers.getInvite, { serverId });
  const renameServer = useMutation(api.servers.renameServer);
  const generateInvite = useMutation(api.servers.generateInvite);
  const leaveServer = useMutation(api.servers.leaveServer);
  const navigate = useNavigate();

  const inviteLink = invite
    ? `${window.location.origin}/invite/${invite.inviteCode}`
    : "";

  async function handleRename() {
    if (name.trim() && name !== serverName) {
      await renameServer({ serverId, name: name.trim() });
    }
  }

  async function handleRegenerateInvite() {
    if (
      window.confirm(
        "Regenerate the invite link? The old link will stop working immediately.",
      )
    ) {
      await generateInvite({ serverId });
    }
  }

  async function handleLeave() {
    if (
      !window.confirm(
        isOwner
          ? "As owner, leaving will transfer ownership (or delete the server if you're the last member). Continue?"
          : "Leave this server?",
      )
    ) {
      return;
    }
    await leaveServer({ serverId });
    navigate("/");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-lg bg-neutral-800 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-white">Server Settings</h2>

        {isOwner && (
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold uppercase text-neutral-400">
              Server name
            </label>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded bg-neutral-900 px-3 py-2 text-white outline-none ring-1 ring-neutral-700 focus:ring-indigo-500"
              />
              <button
                onClick={handleRename}
                className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Save
              </button>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold uppercase text-neutral-400">
            Invite link
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={inviteLink}
              className="w-full rounded bg-neutral-900 px-3 py-2 text-sm text-neutral-300 outline-none"
            />
            <button
              onClick={() => {
                void navigator.clipboard.writeText(inviteLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="rounded bg-neutral-700 px-3 py-1.5 text-sm text-white hover:bg-neutral-600"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          {isOwner && (
            <button
              onClick={() => void handleRegenerateInvite()}
              className="mt-1.5 text-xs text-neutral-500 hover:text-neutral-300"
            >
              Regenerate invite link
            </button>
          )}
        </div>

        <div className="flex justify-between border-t border-neutral-700 pt-4">
          <button
            onClick={handleLeave}
            className="rounded px-3 py-1.5 text-sm font-semibold text-red-400 hover:bg-red-500/10"
          >
            Leave Server
          </button>
          <button
            onClick={onClose}
            className="rounded px-3 py-1.5 text-sm text-neutral-400 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
