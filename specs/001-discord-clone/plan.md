# Implementation Plan: Discord Clone — Real-Time Chat & Video

**Branch**: `001-discord-clone` | **Date**: 2026-07-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-discord-clone/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Build a real-time community chat and video-calling application (servers, channels,
messaging, DMs, presence, voice/video calls) as a single-page React app backed by
Convex as the sole database/backend, with peer-to-peer WebRTC calls signaled through
Convex's reactive queries instead of a separate WebSocket/Socket.io server. Convex's
`useQuery` subscriptions satisfy the constitution's Real-Time Correctness principle
by construction — there is no polling path available even if one were tempted to add
it. Convex's typed schema plus TypeScript strict mode satisfies Type Safety End-to-End.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 18+ for tooling

**Primary Dependencies**: React 18, Vite, Tailwind CSS, React Router, Convex
(`convex` client + server SDK), `@convex-dev/auth` (Convex Auth, password provider).
No WebRTC SDK — native browser `RTCPeerConnection` API only.

**Storage**: Convex (document database with typed schema + reactive queries/mutations);
no separate SQL/NoSQL database, no separate WebSocket server.

**Testing**: Vitest for unit tests of business logic (message/channel/call helper
functions kept separate from UI components per constitution Principle VI); a small
set of Convex function smoke tests using `convex-test`; manual per-milestone
verification checklists in `quickstart.md` for the flows that need two real
browsers (real-time propagation, presence, calls).

**Target Platform**: Modern desktop web browsers (Chrome, Firefox, Safari, Edge —
current versions) supporting WebRTC and `getUserMedia`. No native mobile app (out
of scope per spec).

**Project Type**: Web application — single repo, single frontend (Vite/React SPA)
talking to a single backend-as-a-service (Convex). No separate backend service to
stand up or deploy.

**Performance Goals**: Message delivery and member/channel-list updates visible to
other clients within 1 second (SC-001, SC-002); presence status changes visible
within 40 seconds end-to-end, i.e., a 30-second offline heartbeat timeout plus up
to 10 seconds propagation (SC-003); voice/video call connection established within
10 seconds of both participants joining, ≥95% success rate (SC-004).

**Constraints**: Voice channel calls hard-capped at 4 participants (a 5th join is
rejected with a "channel full" message, per spec FR-019); no TURN server in v1 — STUN
only (`stun:stun.l.google.com:19302`), so calls between peers on strict/symmetric NAT
networks may fail to connect (documented v1 limitation, not solved by this plan);
message length capped at 2000 characters (FR-026); full-mesh WebRTC topology (every
participant connects to every other participant directly), which is only acceptable
because of the 4-participant cap — this would not scale past ~4-6 peers and is an
explicit, spec-approved tradeoff, not a general-purpose calling architecture.

**Scale/Scope**: Single Convex deployment; supports at least 10 members and 10
channels per server without degradation (SC-006); no target beyond what a single
Convex free/dev-tier deployment can serve, since this is a student project, not a
production multi-tenant system.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Simplicity First | No component library, no state-management library beyond Convex's own reactive hooks, no WebRTC SDK, single repo (no monorepo/microservices) | PASS |
| II. Real-Time Correctness | All reads use Convex `useQuery` (subscriptions); no `useEffect` + one-shot `fetch`/`ctx.runQuery`-in-a-loop anywhere in the frontend | PASS (enforced in code review during implementation; see `quickstart.md` verification steps) |
| III. Type Safety End-to-End | TypeScript strict mode repo-wide; all persisted data accessed through `convex/schema.ts` validators — no untyped `any` around documents | PASS |
| IV. Security Basics | Every Convex mutation/query that touches a server, channel, message, DM, or call MUST check `ctx.auth` identity and the caller's `serverMembers`/authorship record before acting — captured as explicit tasks per function in Phase 2 (`/speckit-tasks`) | PASS (design captured in `data-model.md` and `contracts/`; enforcement verified during implementation) |
| V. Incremental Delivery | User stories are already prioritized P1→P3 in the spec and will be implemented and verified one at a time (`quickstart.md` milestones M1-M5), matching the spec's story order | PASS |
| VI. Testable Seams | Message/channel/call domain logic (validation, permission checks) is written as plain TypeScript functions in `convex/` called from mutations/queries, testable via `convex-test` without a browser; at least one smoke test per critical flow (send message, join call) | PASS |

No violations requiring justification — **Complexity Tracking section is not needed** and has been omitted.

## Project Structure

### Documentation (this feature)

```text
specs/001-discord-clone/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
discord-clone/
├── convex/
│   ├── schema.ts               # All table definitions + indexes (single source of truth)
│   ├── auth.ts                 # Convex Auth config (password provider)
│   ├── auth.config.ts
│   ├── users.ts                # queries/mutations: profile, avatar, presence heartbeat
│   ├── servers.ts               # queries/mutations: create/rename/leave server, invite links
│   ├── serverMembers.ts         # queries/mutations: join via invite, list members, remove member
│   ├── channels.ts               # queries/mutations: create/rename/delete text & voice channels
│   ├── messages.ts               # queries/mutations: send/edit/delete, paginated history
│   ├── typing.ts                # mutations: set/clear typing indicator (heartbeat-based)
│   ├── directMessages.ts        # queries/mutations: DM threads + messages
│   ├── calls.ts                  # queries/mutations: join/leave voice channel call, participant state
│   ├── signals.ts                # mutations/queries: WebRTC offer/answer/ICE exchange
│   └── lib/                      # Plain TS helpers (permission checks, validation) — unit tested
│       ├── permissions.ts
│       └── validation.ts
│
├── src/
│   ├── main.tsx
│   ├── App.tsx                   # React Router routes
│   ├── routes/
│   │   ├── LoginPage.tsx
│   │   ├── ServerLayout.tsx       # server rail + channel sidebar + member list shell
│   │   ├── ChannelPage.tsx
│   │   └── DirectMessagePage.tsx
│   ├── components/
│   │   ├── ServerRail.tsx
│   │   ├── ChannelSidebar.tsx
│   │   ├── MemberList.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   ├── TypingIndicator.tsx
│   │   └── call/
│   │       ├── CallView.tsx
│   │       ├── VideoTile.tsx
│   │       └── CallControls.tsx
│   ├── hooks/
│   │   ├── usePresenceHeartbeat.ts
│   │   └── useWebRTCCall.ts       # RTCPeerConnection lifecycle, driven by convex/signals.ts
│   └── lib/
│       └── webrtc/
│           ├── peerConnection.ts   # perfect-negotiation-pattern wrapper
│           └── constants.ts        # STUN server config
│
├── tests/
│   ├── unit/                       # Vitest: convex/lib/*, src/lib/webrtc/* pure logic
│   └── convex/                     # convex-test smoke tests per critical flow
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local                      # CONVEX_DEPLOYMENT, VITE_CONVEX_URL (gitignored)
```

**Structure Decision**: Single repository, single Vite/React frontend at the repo
root with Convex backend functions colocated under `convex/` (Convex's standard
layout) — this is "Option 1: Single project" from the template's structure options,
adapted for a Convex app: there is no separate `backend/` directory because Convex
functions are deployed and typed together with the frontend from one `npx convex dev`
process. Business logic that needs unit testing without a browser lives in
`convex/lib/` and `src/lib/webrtc/`, kept separate from Convex functions and React
components per constitution Principle VI.

## Complexity Tracking

*Not applicable — no Constitution Check violations.*
