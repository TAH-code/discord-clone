import { useParams } from "react-router-dom";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import TypingIndicator from "../components/TypingIndicator";
import VoiceChannelPage from "./VoiceChannelPage";

export default function ChannelPage() {
  const { serverId, channelId } = useParams();
  const cid = channelId as Id<"channels">;
  const channels = useQuery(api.channels.listChannels, {
    serverId: serverId as Id<"servers">,
  });
  const channel = channels?.find((c) => c._id === cid);

  if (channel === undefined) return null;
  if (channel.type === "voice")
    return <VoiceChannelPage channelId={cid} title={channel.name} />;
  return <TextChannelPage channelId={cid} />;
}

function TextChannelPage({ channelId }: { channelId: Id<"channels"> }) {
  const currentUser = useQuery(api.users.getCurrentUser);
  const { results, status, loadMore } = usePaginatedQuery(
    api.messages.listMessages,
    { channelId },
    { initialNumItems: 25 },
  );
  const typingUsers = useQuery(api.typing.listTyping, { channelId });

  const sendMessage = useMutation(api.messages.sendMessage);
  const editMessage = useMutation(api.messages.editMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const setTyping = useMutation(api.typing.setTyping);

  return (
    <div className="flex h-full flex-col">
      <MessageList
        messages={results.map((m) => ({
          _id: m._id,
          authorId: m.authorId,
          authorName: m.authorName,
          authorAvatarUrl: m.authorAvatarUrl,
          body: m.body,
          createdAt: m.createdAt,
          editedAt: m.editedAt,
        }))}
        status={status}
        loadMore={loadMore}
        currentUserId={currentUser?._id}
        onEdit={async (messageId, body) =>
          void (await editMessage({
            messageId: messageId as Id<"messages">,
            body,
          }))
        }
        onDelete={async (messageId) =>
          void (await deleteMessage({ messageId: messageId as Id<"messages"> }))
        }
      />
      <TypingIndicator users={typingUsers ?? []} />
      <MessageInput
        placeholder="Message #channel"
        onSend={async (body) =>
          void (await sendMessage({ channelId, body }))
        }
        onTyping={() => void setTyping({ channelId })}
      />
    </div>
  );
}
