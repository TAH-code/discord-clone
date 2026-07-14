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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-neutral-900">
      <div className="flex h-12 flex-shrink-0 items-center border-b border-neutral-950 px-4 font-semibold text-white shadow-sm">
        {serverName}
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
          className="m-2 rounded bg-neutral-800 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white"
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
      <div className="mb-1 px-2 text-xs font-semibold uppercase text-neutral-500">
        {title}
      </div>
      {channels.map((channel) => (
        <div
          key={channel._id}
          className={`group flex items-center justify-between rounded px-2 py-1.5 text-sm ${
            activeChannelId === channel._id
              ? "bg-neutral-800 text-white"
              : "text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200"
          }`}
        >
          <Link
            to={`/servers/${serverId}/channels/${channel._id}`}
            className="flex flex-1 items-center gap-1.5 truncate"
          >
            <span className="text-neutral-500">
              {channel.type === "voice" ? "🔊" : "#"}
            </span>
            {channel.name}
          </Link>
          {channel.type === "voice" && (
            <VoiceChannelStatus channelId={channel._id as Id<"channels">} />
          )}
          {canManage && (
            <div className="hidden gap-1 group-hover:flex">
              <button
                title="Rename"
                onClick={() => onRenameChannel?.(channel)}
                className="text-neutral-500 hover:text-white"
              >
                ✎
              </button>
              <button
                title="Delete"
                onClick={() => onDeleteChannel?.(channel)}
                className="text-neutral-500 hover:text-red-400"
              >
                🗑
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function VoiceChannelStatus({ channelId }: { channelId: Id<"channels"> }) {
  const call = useQuery(api.calls.getActiveCallForChannel, { channelId });
  const participants = useQuery(
    api.calls.listParticipants,
    call ? { callId: call._id } : "skip",
  );

  if (!call || !participants || participants.length === 0) return null;

  return (
    <span
      title={participants.map((p) => p.userName).join(", ")}
      className="ml-1 flex flex-shrink-0 items-center gap-1 text-xs text-green-400"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
      {participants.length}
    </span>
  );
}
