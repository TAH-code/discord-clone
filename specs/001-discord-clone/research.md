# Phase 0 Research: Discord Clone — Real-Time Chat & Video

All findings below were verified against current official documentation (not
relied on from training data alone), since Convex and WebRTC APIs evolve quickly.
See Sources under each item.

## 1. Convex Auth (password-based signup/login)

**Decision**: Use `@convex-dev/auth` with the built-in `Password` provider.

**Rationale**: It's Convex's own first-party auth library, requires no
third-party auth service (Auth0/Clerk), and is the simplest path to
email/password signup for a student project with no SSO requirement
(per spec Assumptions).

**Setup**:
- `npm install @convex-dev/auth @auth/core@0.41.1`
- `npx @convex-dev/auth` scaffolds the config files automatically.
- `convex/schema.ts`: spread `authTables` from `@convex-dev/auth/server` into
  `defineSchema()` alongside the app's own tables (users, servers, etc.).
- `convex/auth.ts`:
  ```ts
  import { Password } from "@convex-dev/auth/providers/Password";
  import { convexAuth } from "@convex-dev/auth/server";
  export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
    providers: [Password],
  });
  ```
  No separate `auth.config.ts` needed for the Password provider (that file is
  only required for OAuth/JWT-based providers).
- `src/main.tsx`: wrap the app in `ConvexAuthProvider` (from
  `@convex-dev/auth/react`) instead of the plain `ConvexProvider`.
- Inside a query/mutation: `getAuthUserId(ctx)` from `@convex-dev/auth/server`
  returns the authenticated user's document id (or `null`) — this is the
  primitive every authorization check in the plan is built on (constitution
  Principle IV).

**Alternatives considered**: `@convex-dev/better-auth` (newer, more full-featured,
still labs-stage) and direct Auth0 integration — both rejected as unnecessary
complexity for a password-only student app (constitution Principle I).

**Sources**: labs.convex.dev/auth/setup, labs.convex.dev/auth/config/passwords,
docs.convex.dev/auth/convex-auth

## 2. Convex React hooks (queries, mutations, pagination)

**Decision**: `useQuery`, `useMutation`, and `usePaginatedQuery` from `convex/react`
are current and unchanged; `usePaginatedQuery` is the mechanism for the spec's
infinite-scroll message history requirement (FR-014).

**Rationale**: `useQuery` is a live subscription (satisfies constitution
Principle II by construction — there is no non-reactive read path to
accidentally use). `usePaginatedQuery` returns `{ results, status, loadMore }`
and stays reactive across pages, so newly arriving messages still show up live
even while paginating older history.

**Server-side pairing**: define the query with
`args: { paginationOpts: paginationOptsValidator }` and call
`.paginate(args.paginationOpts)` on an ordered `ctx.db.query(...)` chain.

**Alternatives considered**: `@convex-dev/react-query` (TanStack Query
integration) — rejected, adds a dependency with no benefit over native hooks
for this app's needs (Principle I).

**Sources**: docs.convex.dev/client/react, docs.convex.dev/database/pagination

## 3. Convex schema/index syntax

**Decision**: `defineSchema()` + `defineTable()` + `.index("name", [...fields])`
syntax confirmed current and unchanged.

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    channelId: v.id("channels"),
    body: v.string(),
  }).index("by_channel", ["channelId"]),
});
```

**Rationale**: This is the basis for the "index for every access pattern" rule
in the plan's Technical Context — every query in `data-model.md` is designed
around a specific named index rather than a full table scan.

**Sources**: docs.convex.dev/database/schemas

## 4. WebRTC signaling: Perfect Negotiation pattern

**Decision**: Adopt the "polite peer" / "impolite peer" perfect-negotiation
pattern from MDN, with role assignment done deterministically (lower user ID
= polite), and signaling messages (offers/answers/ICE candidates) persisted as
rows in a Convex `signals` table instead of emitted over Socket.io.

**Rationale**: This directly answers the plan's hardest correctness question —
"what happens if both peers in a voice channel try to call each other at the
same moment" (glare). Perfect negotiation gives identical client-side logic on
both peers (no separate caller/callee code paths), which maps cleanly onto
"dumb" Convex mutations that just insert a signal row; all negotiation logic
lives in a `useWebRTCCall` hook reacting to `useQuery` on the `signals` table.

**Mechanics**:
- Each peer has a fixed role (polite/impolite), not tied to who joined first.
- **Glare**: if both send offers simultaneously, the polite peer detects the
  collision and does an ICE rollback (`setLocalDescription({type:"rollback"})`),
  then accepts the incoming offer; the impolite peer ignores the incoming
  offer and keeps its own.
- **ICE candidate queueing**: candidates arriving before `setRemoteDescription`
  resolves must not throw fatally — errors are ignorable for the polite peer
  during rollback.
- **Renegotiation**: `onnegotiationneeded` triggers a fresh offer automatically
  when tracks change (e.g., enabling camera mid-call), rather than manual
  re-offer logic.

**Alternatives considered**: A simpler "always-offerer-is-lower-ID" scheme
without rollback — rejected because it doesn't handle the case where both
peers' `onnegotiationneeded` fires in the same tick (still possible even with
a nominal offerer), which perfect negotiation handles robustly.

**Sources**: developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation

## 5. STUN-only, no TURN

**Decision**: Use the public Google STUN server `stun:stun.l.google.com:19302`;
no TURN server in v1.

**Rationale**: Confirmed still operational with no deprecation notice, matching
the plan's Constraints (no TURN in v1). Not SLA-backed, so this is an
acceptable choice for a student project, not something to rely on in
production.

**Known limitation (documented, not solved by this plan)**: STUN alone cannot
establish connectivity behind symmetric NAT (common on corporate/some mobile
networks) — without a TURN relay, those calls will fail. This is called out in
the spec's Assumptions and must be repeated in the project README per the
guide's submission checklist.

**Sources**: videosdk.live/developer-hub/stun-turn-server/google-stun-server

## Summary of resolved unknowns

All "NEEDS CLARIFICATION" markers from the Technical Context have been resolved:
auth library and setup (✅ §1), real-time/pagination hook pattern (✅ §2), schema
syntax (✅ §3), WebRTC signaling protocol design (✅ §4), and STUN/TURN posture
(✅ §5). No open unknowns remain blocking Phase 1 design.
