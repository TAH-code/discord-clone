<!--
Sync Impact Report
- Version change: TEMPLATE → 1.0.0 (initial ratification)
- Modified principles: n/a (first adoption)
- Added sections: Core Principles (6), Technology Constraints, Development Workflow, Governance
- Removed sections: none
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (no changes needed; already generic)
  - .specify/templates/spec-template.md ✅ (no changes needed; already generic)
  - .specify/templates/tasks-template.md ✅ (no changes needed; already generic)
  - .claude/skills/* ✅ (no agent-specific references to reconcile)
- Follow-up TODOs: none
-->

# Discord Clone Constitution

## Core Principles

### I. Simplicity First
Prefer the smallest solution that satisfies the spec. No speculative abstractions,
no design patterns introduced ahead of need, and no libraries or dependencies beyond
those named in the approved implementation plan. If a simpler approach meets the
requirement, it is the correct approach, even if a more general one is more elegant.

### II. Real-Time Correctness
The UI MUST reflect server state through reactive subscriptions. Manual polling,
page refreshes, or stale cached reads to observe state changes that another user
or process produced are prohibited. Any view of shared data (messages, presence,
membership, call state) must update on its own once the underlying data changes.

### III. Type Safety End-to-End
TypeScript strict mode is mandatory across the entire codebase. Database access
must go exclusively through typed schema definitions — no untyped documents, no
`any` escape hatches around persisted data. Types are the contract between frontend
and backend and must not be bypassed for convenience.

### IV. Security Basics
Every backend function MUST validate that the caller is authenticated and
authorized for the specific resource it touches (e.g., a member of the server,
the author of the message being edited). Absence of an auth/authorization check
in a backend function is a defect, not an oversight to fix later.

### V. Incremental Delivery
The application MUST build and run after each user story is completed. The main
branch is never left in a broken state between stories. Work is implemented and
verified story-by-story rather than as one large, unverified batch.

### VI. Testable Seams (NON-NEGOTIABLE)
Business logic MUST be separated from UI so it can be exercised without a browser.
Critical flows — sending a message, joining a call — require at least a smoke test
proving the flow completes end-to-end. A feature without a corresponding test for
its critical path is incomplete.

## Technology Constraints

No specific frontend framework, database, or real-time transport is prescribed by
this constitution. The technology stack is decided during the planning phase
(`/speckit-plan`) and recorded in `plan.md`; this constitution constrains *how*
that stack is used (simplicity, type safety, real-time reactivity, security,
testability), not *which* stack is chosen. Any spec produced under this
constitution must remain implementation-agnostic — it must still make sense if
the underlying stack were swapped out entirely.

## Development Workflow

Work proceeds in the Spec-Driven Development order: constitution → specify →
clarify → plan → analyze → tasks → implement. Each phase's artifact is committed
to git before the next phase begins, so the artifact history is a complete,
reviewable record of how the project was built. Implementation is executed one
user story (or milestone) at a time, with a manual verification checkpoint after
each, per Principle V.

## Governance

This constitution supersedes ad-hoc practices and prior verbal agreements about
how the project is built. All plans, specs, and generated code are expected to
comply with it; any deviation must be explicitly justified in the relevant
artifact (e.g., a "Complexity Tracking" note in `plan.md`) rather than silently
introduced.

Amendments require: (1) a proposed change to this file, (2) a version bump per
the policy below, and (3) a check that dependent templates (`plan-template.md`,
`spec-template.md`, `tasks-template.md`) still align with the updated principles.

Versioning policy (semantic versioning applied to governance):
- MAJOR: Backward-incompatible principle removals or redefinitions.
- MINOR: A new principle or materially expanded section is added.
- PATCH: Wording, clarification, or typo fixes with no semantic change.

**Version**: 1.0.0 | **Ratified**: 2026-07-14 | **Last Amended**: 2026-07-14
