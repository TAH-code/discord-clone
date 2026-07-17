import { useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import ServerRail from "../components/ServerRail";
import ChannelSidebar, {
  type ChannelSummary,
} from "../components/ChannelSidebar";
import DirectMessageList from "../components/DirectMessageList";
import MemberList from "../components/MemberList";
import TopNavbar from "../components/TopNavbar";
import UserBar from "../components/UserBar";
import CreateOrJoinServerModal from "../components/CreateOrJoinServerModal";
import CreateChannelModal from "../components/CreateChannelModal";
import ServerSettingsModal from "../components/ServerSettingsModal";

export default function ServerLayout() {
  const { serverId, channelId, threadId } = useParams();
  const navigate = useNavigate();
  const sid = serverId as Id<"servers">;

  const currentUser = useQuery(api.users.getCurrentUser);
  const servers = useQuery(api.servers.listMyServers);
  const channels = useQuery(api.channels.listChannels, { serverId: sid });
  const members = useQuery(api.servers.listMembers, { serverId: sid });
  const threads = useQuery(api.directMessages.listMyThreads);

  const renameChannel = useMutation(api.channels.renameChannel);
  const deleteChannel = useMutation(api.channels.deleteChannel);
  const openThread = useMutation(api.directMessages.openThread);
  const removeMember = useMutation(api.servers.removeMember);

  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [membersVisible, setMembersVisible] = useState(true);

  const server = servers?.find((s) => s._id === sid);
  const isOwner = server !== undefined && currentUser?._id === server.ownerId;
  const activeChannel = channels?.find((c) => c._id === channelId);
  const activeThread = threads?.find((t) => t._id === threadId);

  async function handleRenameChannel(channel: ChannelSummary) {
    const name = window.prompt("Rename channel to:", channel.name);
    if (name && name.trim() && name !== channel.name) {
      await renameChannel({
        channelId: channel._id as Id<"channels">,
        name: name.trim(),
      });
    }
  }

  async function handleDeleteChannel(channel: ChannelSummary) {
    if (window.confirm(`Delete #${channel.name}? This cannot be undone.`)) {
      await deleteChannel({ channelId: channel._id as Id<"channels"> });
    }
  }

  async function handleMessage(userId: string) {
    const threadId = await openThread({ otherUserId: userId as Id<"users"> });
    navigate(`/servers/${sid}/dm/${threadId}`);
  }

  async function handleRemoveMember(userId: string) {
    if (window.confirm("Remove this member from the server?")) {
      await removeMember({ serverId: sid, userId: userId as Id<"users"> });
    }
  }

  const isVoiceChannel = activeChannel?.type === "voice";
  const headerTitle = activeThread
    ? activeThread.otherUserName
    : (activeChannel?.name ?? server?.name ?? "");
  const headerIcon = activeThread ? "@" : "#";

  return (
    <div className="h-screen w-screen bg-app-bg p-3">
      <div className="flex h-full overflow-hidden rounded-2xl bg-panel shadow-lg">
        <ServerRail
          servers={servers ?? []}
          onCreateServer={() => setShowCreateServer(true)}
          currentUserName={currentUser?.name}
        />
        <div className="flex w-60 min-h-0 flex-col overflow-hidden">
          <ChannelSidebar
            serverName={server?.name ?? ""}
            channels={channels ?? []}
            canManage={isOwner}
            onCreateChannel={() => setShowCreateChannel(true)}
            onRenameChannel={handleRenameChannel}
            onDeleteChannel={handleDeleteChannel}
          />
          <DirectMessageList serverId={sid} threads={threads ?? []} />
          <UserBar
            name={currentUser?.name ?? "Me"}
            avatarUrl={currentUser?.avatarUrl}
            onOpenSettings={() => setShowSettings(true)}
          />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          {!isVoiceChannel && (
            <TopNavbar
              icon={headerIcon}
              title={headerTitle}
              showMemberToggle={!activeThread}
              membersVisible={membersVisible}
              onToggleMembers={() => setMembersVisible((v) => !v)}
            />
          )}
          <div className="flex-1 overflow-hidden">
            <Outlet />
          </div>
        </div>
        {membersVisible && !activeThread && !isVoiceChannel && (
          <MemberList
            members={members ?? []}
            currentUserId={currentUser?._id}
            onMessage={handleMessage}
            onRemove={handleRemoveMember}
            canManage={isOwner}
          />
        )}
      </div>

      {showCreateServer && (
        <CreateOrJoinServerModal onClose={() => setShowCreateServer(false)} />
      )}
      {showCreateChannel && (
        <CreateChannelModal
          serverId={sid}
          onClose={() => setShowCreateChannel(false)}
        />
      )}
      {showSettings && server && (
        <ServerSettingsModal
          serverId={sid}
          serverName={server.name}
          isOwner={isOwner}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
