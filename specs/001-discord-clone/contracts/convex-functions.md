# API Contract: Convex Functions

This is a Convex app — there is no separate REST/GraphQL API. The "interface
contract" the frontend depends on is the set of typed Convex queries and
mutations below. Every function that touches server/channel/message/call data
MUST verify the caller's identity (`getAuthUserId(ctx)`) and, where relevant,
their `serverMembers` row, per constitution Principle IV — this is noted per
function as **Auth**.

## users.ts

| Function | Type | Args | Returns | Auth |
|---|---|---|---|---|
| `getCurrentUser` | query | `{}` | `User \| null` | none (returns null if unauthenticated) |
| `updateProfile` | mutation | `{ name?: string, avatarUrl?: string }` | `void` | caller must be authenticated |
| `heartbeat` | mutation | `{}` | `void` | caller must be authenticated; updates `lastHeartbeat` |
| `getPresence` | query | `{ userIds: Id<"users">[] }` | `Record<Id<"users">, "online" \| "offline">` | none; derived from `lastHeartbeat` vs 30s cutoff |

## servers.ts

| Function | Type | Args | Returns | Auth |
|---|---|---|---|---|
| `createServer` | mutation | `{ name: string, imageUrl?: string }` | `Id<"servers">` | authenticated; creates server + owner `serverMembers` row + default "general" text channel (FR-003, FR-004) |
| `renameServer` | mutation | `{ serverId, name }` | `void` | caller must be `ownerId` of the server |
| `generateInvite` \| `getInvite` | query/mutation | `{ serverId }` | `{ inviteCode: string }` | caller must be a member (invite already exists per server, never expires — FR-027) |
| `joinViaInvite` | mutation | `{ inviteCode: string }` | `Id<"servers">` | authenticated; idempotent if already a member |
| `leaveServer` | mutation | `{ serverId }` | `void` | caller must be a member; reassigns ownership to next-oldest member if caller is owner, deletes server if caller is last member (Clarification, FR-007a) |
| `removeMember` | mutation | `{ serverId, userId }` | `void` | caller must be `ownerId`; cannot remove self (use `leaveServer`) |
| `listMyServers` | query | `{}` | `Server[]` | authenticated; via `serverMembers.by_user` |
| `listMembers` | query | `{ serverId }` | `(ServerMember & { user: User, presence: "online"\|"offline" })[]` | caller must be a member |

## channels.ts

| Function | Type | Args | Returns | Auth |
|---|---|---|---|---|
| `listChannels` | query | `{ serverId }` | `Channel[]` | caller must be a member (all members see all channels, FR-010) |
| `createChannel` | mutation | `{ serverId, name, type: "text"\|"voice" }` | `Id<"channels">` | caller must be `ownerId` |
| `renameChannel` | mutation | `{ channelId, name }` | `void` | caller must be `ownerId` of the parent server |
| `deleteChannel` | mutation | `{ channelId }` | `void` | caller must be `ownerId`; cascades: deletes messages (FR-009), ends any active call (Edge Case) |

## messages.ts

| Function | Type | Args | Returns | Auth |
|---|---|---|---|---|
| `listMessages` | query (paginated) | `{ channelId, paginationOpts }` | `PaginationResult<Message>` | caller must be a member of the channel's server |
| `sendMessage` | mutation | `{ channelId, body }` | `Id<"messages">` | caller must be a member; rejects `body.length > 2000` (FR-026) |
| `editMessage` | mutation | `{ messageId, body }` | `void` | caller must be the message's `authorId` (FR-013) |
| `deleteMessage` | mutation | `{ messageId }` | `void` | caller must be the message's `authorId` |

## typing.ts

| Function | Type | Args | Returns | Auth |
|---|---|---|---|---|
| `setTyping` | mutation | `{ channelId? , threadId? }` (exactly one) | `void` | caller must be a member/DM participant; upserts with a short expiry |
| `listTyping` | query | `{ channelId? , threadId? }` | `User[]` (excluding caller) | same membership check |

## directMessages.ts

| Function | Type | Args | Returns | Auth |
|---|---|---|---|---|
| `openThread` | mutation | `{ otherUserId }` | `Id<"directMessageThreads">` | caller and `otherUserId` must currently share ≥1 server (FR-016); idempotent find-or-create |
| `listMyThreads` | query | `{}` | `DirectMessageThread[]` | authenticated |
| `listMessages` | query (paginated) | `{ threadId, paginationOpts }` | `PaginationResult<DirectMessage>` | caller must be a participant in the thread (thread persists even if servers no longer shared, Clarification) |
| `sendMessage` | mutation | `{ threadId, body }` | `Id<"directMessages">` | caller must be a thread participant |
| `editMessage` / `deleteMessage` | mutation | `{ directMessageId, body? }` | `void` | caller must be the message's `authorId` |

## calls.ts

| Function | Type | Args | Returns | Auth |
|---|---|---|---|---|
| `joinVoiceChannel` | mutation | `{ channelId }` | `{ callId: Id<"calls"> } \| { error: "channel_full" }` | caller must be a member; creates a `calls` row if none active; rejects if `callParticipants.by_call` count is already 4 (FR-019) |
| `startDmCall` | mutation | `{ threadId }` | `Id<"calls">` | caller must be a thread participant |
| `leaveCall` | mutation | `{ callId }` | `void` | caller must be a current participant; deletes participant row, ends call if last participant (FR-023) |
| `setMediaState` | mutation | `{ callId, micOn?, cameraOn? }` | `void` | caller must be a current participant (FR-020) |
| `setSpeaking` | mutation | `{ callId, speaking: boolean }` | `void` | caller must be a current participant; throttled client-side (FR-021) |
| `heartbeatCall` | mutation | `{ callId }` | `void` | caller must be a current participant; updates `lastHeartbeat` for stale-participant cleanup |
| `listParticipants` | query | `{ callId }` | `(CallParticipant & { user: User })[]` | caller must be a member of the channel/thread the call belongs to |
| `getActiveCallForChannel` | query | `{ channelId }` | `Call \| null` | caller must be a member; drives "who is connected" in the channel list (FR-022) |

## signals.ts

| Function | Type | Args | Returns | Auth |
|---|---|---|---|---|
| `sendSignal` | mutation | `{ callId, toUserId, kind: "offer"\|"answer"\|"ice-candidate", payload: string }` | `void` | caller must be a current participant of `callId`; `toUserId` must also be a current participant |
| `listSignalsForMe` | query | `{ callId }` | `Signal[]` | caller must be a current participant; filtered via `by_call_and_recipient` index to `toUserId === caller` |

## Contract-level invariants (apply across all functions above)

- **Every** query/mutation above begins by resolving `getAuthUserId(ctx)`; if
  `null` and the function isn't explicitly public, it throws (no silent
  no-op — a rejected write must be visible to the caller as an error).
- Every membership-gated function re-derives authorization from the
  `serverMembers.by_server_and_user` (or equivalent) index — never trusts a
  role/flag passed in from the client.
- Mutations that produce a real-time UI change do so purely by writing to
  Convex tables; there is no direct client-to-client channel (e.g., no
  WebSocket the client opens itself) — `useQuery` subscriptions are the only
  propagation mechanism, satisfying constitution Principle II by construction.
