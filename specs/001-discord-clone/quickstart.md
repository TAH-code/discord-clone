# Quickstart & Validation Guide: Discord Clone

This guide proves the feature works end-to-end once implemented. It does not
contain implementation code — see `data-model.md` for schema and
`contracts/convex-functions.md` for the function contracts each step exercises.

## Prerequisites

- Node.js 18+, a Convex account (convex.dev), two browsers or one normal +
  one incognito window.
- Repo cloned, `npm install` run at the repo root.
- `.env.local` populated (created automatically by the first `npx convex dev`
  run — never commit this file).

## Setup commands

```bash
npx convex dev   # terminal 1 — pushes convex/schema.ts + functions, watches for changes
npm run dev      # terminal 2 — Vite dev server (http://localhost:5173)
```

The first `npx convex dev` run prompts a browser login and creates a Convex
project, writing the deployment URL into `.env.local`.

## Milestone verification (run in this order — matches spec user story priority)

### M1 — Setup & Auth (User Story: n/a, foundation)

1. Open the app in Browser A, sign up as "Alice."
2. Open the app in Browser B (or incognito), sign up as "Bob."
3. In the Convex dashboard's `users` table, confirm both Alice and Bob appear
   with distinct ids.

**Expected**: Both users exist; each can log out and log back in.

### M2 — Servers & Channels (User Stories 2, 3)

1. Alice creates a server "Study Group." Confirm a "general" text channel
   exists automatically (FR-004).
2. Alice opens the invite link/code and sends it to Bob (paste manually for
   this test).
3. Bob opens the invite link and joins.
4. **Without refreshing**, Alice's member list shows Bob (FR-006, SC-002).
5. Alice creates a voice channel "Hangout." Bob's channel sidebar updates
   without refreshing.
6. Alice renames "Study Group" to "CS 101 Study Group" — Bob sees the new name
   without refreshing.

**Expected**: All updates appear on the other user's screen with no manual
refresh, within ~1 second (SC-002).

### M3 — Real-Time Chat (User Story 1)

1. In the "general" channel, Alice sends "hey Bob." It appears instantly in
   Bob's browser (SC-001).
2. Bob starts typing a reply — Alice sees a typing indicator; it clears when
   Bob sends or stops typing (FR-015).
3. Alice edits her message — Bob sees the updated text with an "edited" marker
   (FR-013).
4. Bob deletes his own message — it disappears for Alice too.
5. Send >2000 characters — submission is blocked with a message-length
   warning (FR-026).
6. Scroll up past the initially loaded messages — older history loads
   incrementally (FR-014).

**Expected**: All propagate within 1 second, no refresh needed anywhere.

### M4 — Direct Messages & Presence (User Story 4)

1. From the member list, Alice opens a DM with Bob (allowed — they share
   "CS 101 Study Group," FR-016).
2. Alice and Bob exchange DMs with the same edit/delete/real-time behavior as
   channel messages (FR-017).
3. Bob closes his browser tab entirely (simulating disconnect).
4. Within ~40 seconds (30s heartbeat timeout + propagation, Clarification/
   SC-003), Alice sees Bob's status flip to offline in the member list.

**Expected**: DM works identically to channel chat; presence flips within the
documented window, not instantly and not never.

### M5 — Voice/Video Calls (User Story 5)

1. Alice joins the "Hangout" voice channel. The channel list shows her as
   connected (FR-022).
2. Bob joins the same voice channel. Both browsers show two video tiles with
   live audio/video within 10 seconds (SC-004).
3. Alice mutes her microphone — Bob sees Alice's muted indicator update
   (FR-020).
4. Alice disables her camera — her video tile reflects "camera off" for Bob.
5. A third test user (or a third browser session) joins the same channel —
   three-way call works (FR-019, up to the cap).
6. A 5th simultaneous participant attempts to join — they are rejected with a
   "channel full" message; the existing 4 are unaffected (Clarification,
   FR-019).
7. Bob leaves the call — Alice sees him disconnect; the channel list no
   longer shows Bob as connected (FR-023).
8. From the Alice–Bob DM, Alice starts a 1-on-1 video call directly (FR-024).

**Expected**: Calls connect ≥95% of the time within 10s (SC-004); mute/camera/
speaking state and participant list update live for all participants; the
4-participant cap is enforced cleanly.

**Known limitation to accept, not debug**: on strict/symmetric-NAT networks
(no TURN server in v1), step 2 may fail to connect. Document this in the
project README rather than chasing it indefinitely (per research.md §5).

## Cross-cutting checks (apply throughout all milestones)

- Every acceptance scenario in `spec.md` maps to at least one step above.
- No step requires a manual page refresh to observe another user's change —
  if one does, that is a Principle II (Real-Time Correctness) violation.
- Attempting an action without the required permission (e.g., Bob trying to
  delete Alice's message, or a non-owner trying to delete a channel) must be
  rejected, not silently allowed.
