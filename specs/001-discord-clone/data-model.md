# Data Model: Discord Clone — Real-Time Chat & Video

All tables are defined in `convex/schema.ts`. Every table lists the index(es)
it needs and *why* (which query/access pattern each index serves), per the
plan's "index for every access pattern" rule.

## users

Extends the `authTables` users table provided by `@convex-dev/auth`.

| Field | Type | Notes |
|---|---|---|
| `_id` | `Id<"users">` | provided by Convex |
| `email` | `string` | provided by Convex Auth (Password provider) |
| `name` | `string` | display name (spec: "each user has a display name") |
| `avatarUrl` | `string \| null` | optional avatar image |
| `lastHeartbeat` | `number` (ms epoch) | updated by presence heartbeat; a user is offline if `now - lastHeartbeat > 30_000` (Clarification: 30s timeout) |

No custom index needed beyond what `authTables` provides (looked up by id only).

## servers

| Field | Type | Notes |
|---|---|---|
| `_id` | `Id<"servers">` | |
| `name` | `string` | |
| `imageUrl` | `string \| null` | optional (FR-003) |
| `ownerId` | `Id<"users">` | current owner; reassigned on voluntary leave (Clarification) |
| `inviteCode` | `string` | opaque token embedded in invite link; never expires (FR-027) |

**Indexes**:
- `by_inviteCode` (`["inviteCode"]`) — resolve an invite link to a server (FR-005).

## serverMembers

Join table between `users` and `servers`.

| Field | Type | Notes |
|---|---|---|
| `_id` | `Id<"serverMembers">` | |
| `serverId` | `Id<"servers">` | |
| `userId` | `Id<"users">` | |
| `joinedAt` | `number` (ms epoch) | used to pick "next-oldest member" for ownership transfer (Clarification) |

**Indexes**:
- `by_server` (`["serverId"]`) — list all members of a server (member list, FR-006); combined with `joinedAt` ordering for ownership transfer.
- `by_user` (`["userId"]`) — list all servers a given user belongs to (server rail); also used to compute "do these two users share a server" for DM eligibility (FR-016).
- `by_server_and_user` (`["serverId", "userId"]`) — O(1) "is this user a member of this server" authorization check, used by nearly every mutation in `channels.ts`/`messages.ts` (constitution Principle IV).

## channels

| Field | Type | Notes |
|---|---|---|
| `_id` | `Id<"channels">` | |
| `serverId` | `Id<"servers">` | |
| `name` | `string` | e.g. "general" |
| `type` | `"text" \| "voice"` | |
| `createdAt` | `number` | |

**Indexes**:
- `by_server` (`["serverId"]`) — list all channels of a server (FR-010), and the special case of finding/creating the default "general" text channel on server creation (FR-004).

## messages

Used for channel messages (`threadType: "channel"`).

| Field | Type | Notes |
|---|---|---|
| `_id` | `Id<"messages">` | |
| `channelId` | `Id<"channels">` | |
| `authorId` | `Id<"users">` | |
| `body` | `string` | max 2000 chars, enforced in mutation (FR-026) |
| `createdAt` | `number` | |
| `editedAt` | `number \| null` | non-null ⇒ show "edited" marker (FR-013) |
| `deleted` | `boolean` | soft flag is NOT used per spec (deletes are permanent, Assumptions) — deletion removes the row entirely; field omitted from final schema, listed here only to document the decision |

**Indexes**:
- `by_channel` (`["channelId", "createdAt"]`) — paginated, newest-first history via `usePaginatedQuery` (FR-014).

## directMessageThreads

| Field | Type | Notes |
|---|---|---|
| `_id` | `Id<"directMessageThreads">` | |
| `userAId` | `Id<"users">` | lower-sorted user id, for a canonical/deduplicated lookup |
| `userBId` | `Id<"users">` | higher-sorted user id |
| `createdAt` | `number` | |

**Indexes**:
- `by_users` (`["userAId", "userBId"]`) — find-or-create the thread between two specific users (FR-016), with ids always stored in a canonical sorted order so the pair is looked up in one direction only.

## directMessages

| Field | Type | Notes |
|---|---|---|
| `_id` | `Id<"directMessages">` | |
| `threadId` | `Id<"directMessageThreads">` | |
| `authorId` | `Id<"users">` | |
| `body` | `string` | same 2000-char limit as channel messages |
| `createdAt` | `number` | |
| `editedAt` | `number \| null` | |

**Indexes**:
- `by_thread` (`["threadId", "createdAt"]`) — paginated history, same pattern as `messages.by_channel` (FR-017).

## typingIndicators

Ephemeral — rows are upserted on keystroke and expire/are cleaned up.

| Field | Type | Notes |
|---|---|---|
| `_id` | `Id<"typingIndicators">` | |
| `channelId` | `Id<"channels"> \| null` | set for channel typing |
| `threadId` | `Id<"directMessageThreads"> \| null` | set for DM typing (exactly one of `channelId`/`threadId` is set) |
| `userId` | `Id<"users">` | |
| `expiresAt` | `number` | a client-side timer clears the indicator; server also ignores/deletes rows past `expiresAt` |

**Indexes**:
- `by_channel` (`["channelId"]`) — who is typing in this channel (FR-015).
- `by_thread` (`["threadId"]`) — who is typing in this DM thread.

## calls

One row per active (or ended) call, associated with either a voice `channel` or a DM thread (for 1-on-1 DM video calls, FR-024).

| Field | Type | Notes |
|---|---|---|
| `_id` | `Id<"calls">` | |
| `channelId` | `Id<"channels"> \| null` | set for voice-channel calls |
| `threadId` | `Id<"directMessageThreads"> \| null` | set for DM-initiated 1-on-1 calls (exactly one of the two is set) |
| `startedAt` | `number` | |
| `endedAt` | `number \| null` | set when the last participant leaves or the channel is deleted (Edge Case) |

**Indexes**:
- `by_channel` (`["channelId"]`) — find the active call for a voice channel, to join-or-start (FR-018).
- `by_thread` (`["threadId"]`) — find/start a DM call (FR-024).

## callParticipants

| Field | Type | Notes |
|---|---|---|
| `_id` | `Id<"callParticipants">` | |
| `callId` | `Id<"calls">` | |
| `userId` | `Id<"users">` | |
| `micOn` | `boolean` | (FR-020) |
| `cameraOn` | `boolean` | (FR-020) |
| `speaking` | `boolean` | driven by client-side audio-level detection, written on a throttle (FR-021) |
| `joinedAt` | `number` | |
| `lastHeartbeat` | `number` | stale-participant cleanup when `beforeunload` doesn't fire (Troubleshooting: "Stale participants") |

**Indexes**:
- `by_call` (`["callId"]`) — list current participants of a call; enforce the 4-participant hard cap by counting rows before insert (Clarification, FR-019).
- `by_call_and_user` (`["callId", "userId"]`) — idempotent join/leave and heartbeat upsert.

**State transition**: a participant row is deleted (not soft-ended) when the
user leaves or their heartbeat goes stale; when the last row for a `callId` is
deleted, the parent `calls` row's `endedAt` is set.

## signals

WebRTC signaling payloads — the Convex-native replacement for a Socket.io
signaling server (per plan's Phase 0 research on perfect negotiation).

| Field | Type | Notes |
|---|---|---|
| `_id` | `Id<"signals">` | |
| `callId` | `Id<"calls">` | |
| `fromUserId` | `Id<"users">` | |
| `toUserId` | `Id<"users">` | signals are point-to-point between two participants (full-mesh ⇒ one `signals` row conceptually per ordered pair) |
| `kind` | `"offer" \| "answer" \| "ice-candidate"` | |
| `payload` | `string` (JSON-encoded SDP or ICE candidate) | |
| `createdAt` | `number` | |

**Indexes**:
- `by_call_and_recipient` (`["callId", "toUserId"]`) — each peer's `useWebRTCCall` hook subscribes to exactly the signals addressed to it within the current call, via `useQuery`.

**Lifecycle**: signal rows are write-once and consumed reactively; a cleanup
job (or the `endedAt` transition on `calls`) removes rows for ended calls so
the table doesn't grow unbounded.

## presence (folded into `users.lastHeartbeat`)

The spec's suggested standalone `presence` table was simplified per constitution
Principle I (Simplicity First): a `lastHeartbeat` field directly on `users` is
sufficient to compute online/offline status and avoids a second table with a
1:1 relationship to `users` and no independent lifecycle of its own.

## Entity relationship summary

```text
users ─┬─< serverMembers >─┬─ servers ─┬─< channels >─┬─< messages
       │                   │           │              └─< typingIndicators (channelId)
       │                   │           └─< calls (channelId) ─< callParticipants
       │                   │                              └─< signals
       └─< directMessageThreads >─< directMessages
                          └─< typingIndicators (threadId)
                          └─< calls (threadId) ─< callParticipants ─< signals
```
