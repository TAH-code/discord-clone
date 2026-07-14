# Tasks: Discord Clone — Real-Time Chat & Video

**Input**: Design documents from `/specs/001-discord-clone/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (all present)

**Tests**: Full TDD is not requested. However, constitution Principle VI
(Testable Seams — NON-NEGOTIABLE) mandates at least one smoke test for each
critical flow: **send message** and **join call**. Those two tests are
included, marked explicitly; no other test tasks are included beyond the
Vitest unit tests for pure logic called for in plan.md's Testing section.

**Organization**: Tasks are grouped by user story per spec.md priorities.
User Story 2 (create/join a server) is sequenced before User Story 1
(messaging) despite both being P1, because a channel to message in cannot
exist until a server exists — this ordering matches the guide's suggested
build order (setup → servers/channels → messaging → DMs → calls → polish)
without changing either story's priority or its independent-testability.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (messaging), US2 (servers), US3 (channel mgmt), US4 (DMs), US5 (calls)

## Path Conventions

Single project per plan.md: Vite/React app at repo root, Convex functions
under `convex/`, tests under `tests/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic tooling

- [ ] T001 Scaffold Vite + React 18 + TypeScript project at repo root (`npm create vite@latest . -- --template react-ts`), keeping the existing `.claude/`, `.specify/`, `specs/`, `.git/`, `.gitignore`
- [ ] T002 Install and configure Tailwind CSS (`tailwind.config.ts`, `postcss.config.js`, base styles in `src/index.css`) for the Discord-like dark theme
- [ ] T003 [P] Install and configure React Router (`react-router-dom`) with a placeholder route tree in `src/App.tsx`
- [ ] T004 [P] Configure ESLint + Prettier for TypeScript strict mode (constitution Principle III)
- [ ] T005 Run `npx convex dev` once to create the Convex project and initialize `convex/` directory and `.env.local`
- [ ] T006 [P] Install `@convex-dev/auth` and `@auth/core@0.41.1` per research.md §1
- [ ] T007 Confirm `.env.local` is listed in `.gitignore` (already present from Phase 0; verify, do not duplicate)

**Checkpoint**: `npm run dev` serves a blank Vite+Tailwind app; `npx convex dev` connects to a live Convex deployment.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, auth, and shell UI that every user story depends on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Define full schema in `convex/schema.ts`: spread `authTables`, then add `servers`, `serverMembers` (with `by_server`, `by_user`, `by_server_and_user` indexes), `channels` (`by_server`), `messages` (`by_channel`), `directMessageThreads` (`by_users`), `directMessages` (`by_thread`), `typingIndicators` (`by_channel`, `by_thread`), `calls` (`by_channel`, `by_thread`), `callParticipants` (`by_call`, `by_call_and_user`), `signals` (`by_call_and_recipient`) — per data-model.md
- [ ] T009 Configure Convex Auth in `convex/auth.ts` with the `Password` provider per research.md §1
- [ ] T010 Wrap the app in `ConvexAuthProvider` in `src/main.tsx`
- [ ] T011 [P] Implement `getCurrentUser`, `updateProfile` in `convex/users.ts` (FR-001)
- [ ] T012 [P] Implement `heartbeat`, `getPresence` in `convex/users.ts` using `lastHeartbeat` with the 30s cutoff (FR-002)
- [ ] T013 [P] Create `usePresenceHeartbeat` hook in `src/hooks/usePresenceHeartbeat.ts` that calls `heartbeat` on an interval while the app is open
- [ ] T014 [P] Create permission-check helpers in `convex/lib/permissions.ts`: `assertServerMember`, `assertServerOwner`, `assertMessageAuthor` (constitution Principle IV — every mutation below calls one of these)
- [ ] T015 [P] Create validation helpers in `convex/lib/validation.ts`: `assertMessageLength` (2000 chars, FR-026)
- [ ] T016 [P] Build `LoginPage.tsx` in `src/routes/LoginPage.tsx` (sign up / log in forms using Convex Auth's `signIn`)
- [ ] T017 Build empty-state shell layout: `src/routes/ServerLayout.tsx`, `src/components/ServerRail.tsx`, `src/components/ChannelSidebar.tsx`, `src/components/MemberList.tsx` (render with no data yet; populated in later stories)
- [ ] T018 [P] Set up Vitest config (`vitest.config.ts`) and `tests/unit/` directory for `convex/lib/*` and `src/lib/webrtc/*` (plan.md Testing section)

**Checkpoint**: A user can sign up, log in, and see an empty app shell. `convex/lib/permissions.ts` and `validation.ts` are unit-testable in isolation.

---

## Phase 3: User Story 2 - Create and Join a Server (Priority: P1)

**Goal**: A user can create a server (with an auto-created "general" channel), generate an invite link, and have another user join it, with the member list updating live.

**Independent Test**: Alice creates a server; Bob uses the invite link to join; Alice sees Bob appear in the member list without refreshing (per quickstart.md M2).

### Implementation for User Story 2

- [ ] T019 [P] [US2] Implement `createServer` in `convex/servers.ts`: creates server + owner `serverMembers` row + default "general" text channel via `channels` insert (FR-003, FR-004)
- [ ] T020 [P] [US2] Implement `listChannels` in `convex/channels.ts` (FR-010) — needed immediately so the default channel is visible after creation
- [ ] T021 [US2] Implement `renameServer`, `removeMember` in `convex/servers.ts`, gated by `assertServerOwner` (FR-007)
- [ ] T022 [US2] Implement `leaveServer` in `convex/servers.ts`: voluntary leave, ownership transfer to next-oldest `serverMembers` row by `joinedAt`, or server deletion if last member (FR-007a, Clarification)
- [ ] T023 [US2] Implement `generateInvite`/`getInvite` (creates/returns non-expiring `inviteCode`) and `joinViaInvite` in `convex/servers.ts` (FR-005, FR-027)
- [ ] T024 [US2] Implement `listMyServers`, `listMembers` (joined with `getPresence`) in `convex/servers.ts` (FR-006)
- [ ] T025 [US2] Wire `ServerRail.tsx` to `listMyServers` (live server list)
- [ ] T026 [US2] Wire `ChannelSidebar.tsx` to `listChannels` (live channel list, shows "general" immediately after creation)
- [ ] T027 [US2] Wire `MemberList.tsx` to `listMembers` (live member list with online/offline dot from presence)
- [ ] T028 [US2] Build "Create Server" and "Join via Invite" UI flows (modal or dedicated route) calling `createServer` / `joinViaInvite`
- [ ] T029 [US2] Build server settings UI (rename, generate/copy invite link, remove member, leave server) gated in the UI to owner-only actions where applicable

**Checkpoint**: Run quickstart.md M2 — server creation, invite join, live member list all verified with two browsers.

---

## Phase 4: User Story 1 - Real-Time Text Messaging in a Channel (Priority: P1) 🎯 MVP

**Goal**: Members exchange real-time text messages in a channel, with edit/delete, typing indicators, and infinite scroll.

**Independent Test**: Two members in the same channel exchange, edit, and delete messages, seeing every change instantly with no refresh (per quickstart.md M3).

### Tests for User Story 1 (constitution Principle VI — NON-NEGOTIABLE smoke test)

- [ ] T030 [P] [US1] Smoke test "send message" in `tests/convex/messages.smoke.test.ts` using `convex-test`: a member sends a message and it is retrievable via `listMessages`; a non-member is rejected

### Implementation for User Story 1

- [ ] T031 [P] [US1] Implement `sendMessage` in `convex/messages.ts`, gated by `assertServerMember` + `assertMessageLength` (FR-011, FR-026)
- [ ] T032 [P] [US1] Implement `listMessages` (paginated, newest-first via `usePaginatedQuery`/`paginationOptsValidator`) in `convex/messages.ts` (FR-012, FR-014)
- [ ] T033 [US1] Implement `editMessage`, `deleteMessage` in `convex/messages.ts`, gated by `assertMessageAuthor` (FR-013)
- [ ] T034 [P] [US1] Implement `setTyping`, `listTyping` in `convex/typing.ts` for `channelId` (FR-015)
- [ ] T035 [US1] Build `MessageList.tsx` in `src/components/MessageList.tsx` using `usePaginatedQuery` + `loadMore` on scroll-up (FR-014)
- [ ] T036 [US1] Build `MessageInput.tsx` in `src/components/MessageInput.tsx`: send on submit, call `setTyping` on keystroke (debounced), 2000-char limit with client-side warning
- [ ] T037 [US1] Build `TypingIndicator.tsx` in `src/components/TypingIndicator.tsx` wired to `listTyping`
- [ ] T038 [US1] Wire `ChannelPage.tsx` in `src/routes/ChannelPage.tsx` to render `MessageList` + `MessageInput` + `TypingIndicator` for the active channel

**Checkpoint**: Run quickstart.md M3 — real-time send/edit/delete/typing/infinite-scroll all verified with two browsers. **This is the MVP.**

---

## Phase 5: User Story 3 - Manage Channels (Priority: P2)

**Goal**: The server owner creates, renames, and deletes text and voice channels beyond "general."

**Independent Test**: Owner creates a text and a voice channel, renames one, deletes another; members see the channel list update live (per quickstart.md M2 step 5-6, extended).

### Implementation for User Story 3

- [ ] T039 [US3] Implement `createChannel`, `renameChannel` in `convex/channels.ts`, gated by `assertServerOwner`, supporting `type: "text" | "voice"` (FR-008)
- [ ] T040 [US3] Implement `deleteChannel` in `convex/channels.ts`: cascades to delete all `messages` rows for the channel (FR-009) and end any active `calls` row for the channel (FR-025, Edge Case)
- [ ] T041 [US3] Build "Create Channel" UI (text/voice type picker) in `ChannelSidebar.tsx`, owner-only
- [ ] T042 [US3] Build channel rename/delete UI (context menu or settings icon) in `ChannelSidebar.tsx`, owner-only

**Checkpoint**: Owner can fully manage channels; non-owners cannot see management controls and are rejected server-side if they try anyway.

---

## Phase 6: User Story 4 - Direct Messages Between Members (Priority: P2)

**Goal**: Any two users sharing a server can open a private DM and exchange messages with the same real-time behavior as channel messages.

**Independent Test**: Alice and Bob, sharing a server, open a DM and exchange/edit/delete messages in real time (per quickstart.md M4).

### Implementation for User Story 4

- [ ] T043 [P] [US4] Implement `openThread` in `convex/directMessages.ts`: find-or-create, asserting the two users share ≥1 server via `serverMembers.by_user` (FR-016)
- [ ] T044 [US4] Implement `listMessages` (paginated), `sendMessage`, `editMessage`, `deleteMessage` in `convex/directMessages.ts`, gated by thread-participant checks — note the shared-server check applies only at `openThread` time, not to subsequent messages, per Clarification (FR-017)
- [ ] T045 [US4] Extend `setTyping`/`listTyping` in `convex/typing.ts` to accept `threadId` (FR-015 applied to DMs)
- [ ] T046 [US4] Build `DirectMessagePage.tsx` in `src/routes/DirectMessagePage.tsx`, reusing `MessageList`/`MessageInput`/`TypingIndicator` against thread data instead of channel data
- [ ] T047 [US4] Add "Message" action to `MemberList.tsx` that calls `openThread` and navigates to `DirectMessagePage`
- [ ] T048 [US4] Build a DM thread list UI (sidebar section or separate panel) wired to `listMyThreads`

**Checkpoint**: Run quickstart.md M4 — DM open/send/edit/delete and presence-flip timing verified with two browsers.

---

## Phase 7: User Story 5 - Voice/Video Calls in a Voice Channel (Priority: P3)

**Goal**: Members join a voice channel to start/join a live call (2-4 participants) with mute/camera toggle, speaking indicator, and can also start 1-on-1 calls from a DM.

**Independent Test**: Two members join the same voice channel and see/hear each other; toggling mute/camera is reflected on the other side (per quickstart.md M5).

### Tests for User Story 5 (constitution Principle VI — NON-NEGOTIABLE smoke test)

- [ ] T049 [P] [US5] Smoke test "join call" in `tests/convex/calls.smoke.test.ts` using `convex-test`: joining an empty voice channel creates a call and a participant row; a 5th join attempt when 4 already exist is rejected with `channel_full`

### Implementation for User Story 5

- [ ] T050 [P] [US5] Implement `joinVoiceChannel` in `convex/calls.ts`: find-or-create `calls` row by `channelId`, enforce the 4-participant cap via `callParticipants.by_call` count (FR-018, FR-019, Clarification)
- [ ] T051 [P] [US5] Implement `startDmCall` in `convex/calls.ts` for `threadId`-based calls (FR-024)
- [ ] T052 [US5] Implement `leaveCall` in `convex/calls.ts`: deletes the participant row, ends the call if last participant (FR-023)
- [ ] T053 [P] [US5] Implement `setMediaState`, `setSpeaking`, `heartbeatCall` in `convex/calls.ts` (FR-020, FR-021)
- [ ] T054 [P] [US5] Implement `listParticipants`, `getActiveCallForChannel` in `convex/calls.ts` (FR-022)
- [ ] T055 [P] [US5] Implement `sendSignal`, `listSignalsForMe` in `convex/signals.ts`, gated by current-participant checks on both `fromUserId` and `toUserId`
- [ ] T056 [P] [US5] Implement perfect-negotiation `RTCPeerConnection` wrapper in `src/lib/webrtc/peerConnection.ts` per research.md §4 (polite/impolite role assignment, ICE rollback on glare, ICE candidate queueing)
- [ ] T057 [P] [US5] Define STUN server config in `src/lib/webrtc/constants.ts` (`stun:stun.l.google.com:19302`, documented no-TURN limitation)
- [ ] T058 [US5] Implement `useWebRTCCall` hook in `src/hooks/useWebRTCCall.ts`: reacts to `listParticipants` to create/tear down per-peer `RTCPeerConnection`s, reacts to `listSignalsForMe` to drive negotiation, writes outgoing signals via `sendSignal` (depends on T055, T056)
- [ ] T059 [US5] Build `CallView.tsx`, `VideoTile.tsx`, `CallControls.tsx` in `src/components/call/` (mute/camera toggle, speaking indicator, leave button, "channel full" rejection message)
- [ ] T060 [US5] Show connected-participant indicator per voice channel in `ChannelSidebar.tsx` wired to `getActiveCallForChannel`/`listParticipants` (FR-022)
- [ ] T061 [US5] Add "Start Video Call" action to `DirectMessagePage.tsx` calling `startDmCall` (FR-024)

**Checkpoint**: Run quickstart.md M5 in full, including the 5th-participant rejection and the DM-initiated call.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final quality gates before submission

- [ ] T062 [P] Write `README.md`: setup steps, architecture summary (per plan.md), and known limitations (no TURN server — strict-NAT calls may fail; hard 4-participant call cap)
- [ ] T063 [P] Unit tests in `tests/unit/` for `convex/lib/permissions.ts` and `convex/lib/validation.ts` (plan.md Testing section)
- [ ] T064 [P] Unit tests in `tests/unit/` for `src/lib/webrtc/peerConnection.ts` glare/rollback logic (plan.md Testing section)
- [ ] T065 Confirm no secrets committed: verify `.env.local` was never staged in any commit (`git log --all --full-history -- .env.local` should be empty)
- [ ] T066 Run full quickstart.md M1-M5 walkthrough end-to-end with two real browsers as a final regression pass
- [ ] T067 Verify constitution compliance: grep the codebase for any `useEffect` + one-shot data fetch that should be a `useQuery` (Principle II regression check)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US2 (Phase 3)**: Depends on Foundational only
- **US1 (Phase 4)**: Depends on Foundational + US2 (needs a server/channel to message in)
- **US3 (Phase 5)**: Depends on Foundational + US2 (extends channel management); independent of US1
- **US4 (Phase 6)**: Depends on Foundational + US2 (needs shared-server membership); independent of US1/US3
- **US5 (Phase 7)**: Depends on Foundational + US2 + US3 (needs a voice channel to exist) + US4 (for DM-initiated calls, T061 only)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### Parallel Opportunities

- All `[P]` tasks within a phase touch different files and can run concurrently.
- Once Phase 3 (US2) is complete, US3 and US4 backend work (Phases 5, 6) can proceed in parallel with US1 (Phase 4) if staffed, since they touch different Convex files (`channels.ts` vs `messages.ts`/`typing.ts` vs `directMessages.ts`) — only the UI shell files (`ChannelSidebar.tsx`) are shared and would need coordination.
- US5 (Phase 7) is the largest phase and its backend (`calls.ts`, `signals.ts`) and frontend (`peerConnection.ts`, `useWebRTCCall.ts`) halves can be built in parallel by two people, converging at T058.

---

## Implementation Strategy

### MVP First

1. Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US2: servers) → Phase 4 (US1: messaging).
2. **STOP and VALIDATE** with quickstart.md M1-M3 using two browsers.
3. This is the MVP: a working real-time chat app with servers and channels, matching the spec's two P1 stories.

### Incremental Delivery

1. MVP (above) → demo.
2. Add Phase 5 (US3: channel management) → demo.
3. Add Phase 6 (US4: DMs) → demo.
4. Add Phase 7 (US5: calls) → demo — the full feature set.
5. Phase 8 (Polish) → submission-ready.

This order matches constitution Principle V (Incremental Delivery): the app
builds and runs after each phase, and no phase leaves main broken.

## Notes

- Commit after each phase (or logical group of tasks within a phase) per the
  guide's "commit after every milestone" checkpoint — matches Phase 3-7
  checkpoints above.
- `convex/schema.ts` (T008) intentionally includes all tables up front rather
  than growing incrementally per story, because Convex deploys one schema
  file for the whole project — this is a Convex-specific exception to
  "build only what the current story needs," not a general license to
  over-build; every table added in T008 is justified by data-model.md.
