import { Link, useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export interface ChannelSummary {
  _id: string;
  name: string;
  type: "text" | "voice";
}

interface ChannelSidebarProps {
  serverName: string;
  channels: ChannelSummary[];
  onCreateChannel?: () => void;
  canManage?: boolean;
  onRenameChannel?: (channel: ChannelSummary) => void;
  onDeleteChannel?: (channel: ChannelSummary) => void;
}

export default function ChannelSidebar({
  serverName,
  channels,
  onCreateChannel,
  canManage = false,
  onRenameChannel,
  onDeleteChannel,
}: ChannelSidebarProps) {
  const { serverId, channelId: activeChannelId } = useParams();
  const textChannels = channels.filter((c) => c.type === "text");
  const voiceChannels = channels.filter((c) => c.type === "voice");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-panel-muted">
      <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-neutral-200 px-4 font-semibold text-neutral-900">
        {serverName}
        <span className="text-neutral-400">⌄</span>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
        <ChannelGroup
          title="Text Channels"
          channels={textChannels}
          serverId={serverId!}
          activeChannelId={activeChannelId}
          canManage={canManage}
          onRenameChannel={onRenameChannel}
          onDeleteChannel={onDeleteChannel}
        />
        <ChannelGroup
          title="Voice Channels"
          channels={voiceChannels}
          serverId={serverId!}
          activeChannelId={activeChannelId}
          canManage={canManage}
          onRenameChannel={onRenameChannel}
          onDeleteChannel={onDeleteChannel}
        />
      </div>
      {canManage && (
        <button
          onClick={onCreateChannel}
          className="m-2 rounded bg-white py-1.5 text-sm font-medium text-neutral-600 shadow-sm ring-1 ring-neutral-200 hover:bg-neutral-50 hover:text-neutral-900"
        >
          + Create Channel
        </button>
      )}
    </div>
  );
}

function ChannelGroup({
  title,
  channels,
  serverId,
  activeChannelId,
  canManage,
  onRenameChannel,
  onDeleteChannel,
}: {
  title: string;
  channels: ChannelSummary[];
  serverId: string;
  activeChannelId: string | undefined;
  canManage: boolean;
  onRenameChannel?: (channel: ChannelSummary) => void;
  onDeleteChannel?: (channel: ChannelSummary) => void;
}) {
  if (channels.length === 0) return null;
  return (
    <div>
      <div className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {title}
      </div>
      {channels.map((channel) => (
        <div key={channel._id}>
          <div
            className={`group flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${
              activeChannelId === channel._id
                ? "bg-white font-medium text-neutral-900 shadow-sm ring-1 ring-neutral-200"
                : "text-neutral-500 hover:bg-white/60 hover:text-neutral-900"
            }`}
          >
            <Link
              to={`/servers/${serverId}/channels/${channel._id}`}
              className="flex flex-1 items-center gap-1.5 truncate"
            >
              <span className="text-neutral-400">
                {channel.type === "voice" ? "🔊" : "#"}
              </span>
              {channel.name}
            </Link>
            {canManage && (
              <div className="hidden flex-shrink-0 gap-1 group-hover:flex">
                <button
                  title="Rename"
                  onClick={() => onRenameChannel?.(channel)}
                  className="text-neutral-400 hover:text-neutral-900"
                >
                  ✎
                </button>
                <button
                  title="Delete"
                  onClick={() => onDeleteChannel?.(channel)}
                  className="text-neutral-400 hover:text-red-500"
                >
                  🗑
                </button>
              </div>
            )}
          </div>
          {channel.type === "voice" && (
            <VoiceChannelStatus
              serverId={serverId}
              channelId={channel._id as Id<"channels">}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function VoiceChannelStatus({
  serverId,
  channelId,
}: {
  serverId: string;
  channelId: Id<"channels">;
}) {
  const call = useQuery(api.calls.getActiveCallForChannel, { channelId });
  const participants = useQuery(
    api.calls.listParticipants,
    call ? { callId: call._id } : "skip",
  );

  if (!call || !participants || participants.length === 0) return null;

  return (
    <div className="ml-6 mt-0.5 space-y-0.5 border-l border-neutral-200 pl-2">
      {participants.map((p) => (
        <Link
          key={p.userId}
          to={`/servers/${serverId}/channels/${channelId}`}
          className="flex items-center gap-1.5 truncate rounded px-1.5 py-1 text-xs text-neutral-500 hover:bg-white/60 hover:text-neutral-900"
        >
          <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-neutral-300 text-[8px] font-semibold text-white">
            {p.userName.slice(0, 2).toUpperCase()}
          </span>
          {p.userName}
        </Link>
      ))}
    </div>
  );
}
