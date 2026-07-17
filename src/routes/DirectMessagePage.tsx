import { useParams } from "react-router-dom";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import TypingIndicator from "../components/TypingIndicator";

export default function DirectMessagePage() {
  const { threadId } = useParams();
  const tid = threadId as Id<"directMessageThreads">;

  const currentUser = useQuery(api.users.getCurrentUser);
  const { results, status, loadMore } = usePaginatedQuery(
    api.directMessages.listMessages,
    { threadId: tid },
    { initialNumItems: 25 },
  );
  const typingUsers = useQuery(api.typing.listTyping, { threadId: tid });

  const sendMessage = useMutation(api.directMessages.sendMessage);
  const editMessage = useMutation(api.directMessages.editMessage);
  const deleteMessage = useMutation(api.directMessages.deleteMessage);
  const setTyping = useMutation(api.typing.setTyping);
  const startDmCall = useMutation(api.calls.startDmCall);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center justify-end border-b border-neutral-200 bg-panel px-4 py-1.5">
        <button
          onClick={() => void startDmCall({ threadId: tid })}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          📹 Start Video Call
        </button>
      </div>
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
        onEdit={async (directMessageId, body) =>
          void (await editMessage({
            directMessageId: directMessageId as Id<"directMessages">,
            body,
          }))
        }
        onDelete={async (directMessageId) =>
          void (await deleteMessage({
            directMessageId: directMessageId as Id<"directMessages">,
          }))
        }
      />
      <TypingIndicator users={typingUsers ?? []} />
      <MessageInput
        placeholder="Message"
        onSend={async (body) =>
          void (await sendMessage({ threadId: tid, body }))
        }
        onTyping={() => void setTyping({ threadId: tid })}
      />
    </div>
  );
}
