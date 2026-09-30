# CUTOVER

**CUTOVER is a GenLayer-backed production migration acceptance protocol.** It answers a narrow release question: has the exact replacement website preserved the routes, behaviours and commitments that matter enough to authorize production cutover?

A migration is not accepted because a homepage returns HTML. CUTOVER freezes bounded baseline evidence before migration, authenticates that snapshot against the public baseline, independently observes the candidate, classifies rule-level semantic changes through GenLayer consensus, and uses deterministic contract code to derive `BLOCKED`, `INCONCLUSIVE`, `READY`, and finally `AUTHORIZED`.

## Why GenLayer

Normal smart contracts can deterministically manage candidate identity, hashes, generations, deadlines, duplicate prevention and state transitions. They cannot by themselves judge whether new wording silently changes a cancellation obligation, whether a redirect lands on the semantically corresponding page, or whether a redesigned journey still preserves the required function.

CUTOVER therefore uses consensus only for bounded interpretation. Models never answer “should this migration be authorized?” Models report structured findings; deterministic contract code owns release consequence.

## Lifecycle

`DRAFT → BASELINED → CANDIDATE → READY | BLOCKED | INCONCLUSIVE → CHALLENGED? → READY → AUTHORIZED`

Changing `candidate_origin` or `candidate_ref` increments the candidate generation and invalidates prior assessment/authorization state. A non-owner may submit at most three admitted challenge attempts per generation and two per route. Invalid, unavailable or irrelevant evidence consumes no attempt. A READY-preserving challenge does not permanently close the route; every admitted attempt and its evidence digest remain auditable. There is no force-ready or force-authorize escape hatch.

## Status meanings

- **BLOCKED** — at least one required rule is `MATERIAL_CHANGE`, `MISSING`, or `BROKEN`.
- **INCONCLUSIVE** — no stronger failure exists, but evidence is unavailable, conflicting, unreadable, malformed, stale, or incomplete.
- **READY** — every required current-generation route is assessed and every rule is `PRESERVED` or `ALLOWED_CHANGE`.
- **AUTHORIZED** — the exact current READY candidate survived the review/challenge conditions and the deterministic review window has closed.

## Stable network discipline

CUTOVER targets **Studionet only**:

- network: `studionet`
- chain ID: `61999`
- currency: `GEN`
- RPC: `https://studio.genlayer.com/api`
- explorer: `https://explorer-studio.genlayer.com`
- repository CLI: `0.39.1`
- `genlayer-js`: `1.1.8`

Release-candidate Studio-dev tooling is intentionally excluded from runtime paths.

## Repository map

- `contracts/cutover.py` — Intelligent Contract
- `contracts/core_logic.py` — pure deterministic model used for offline invariants/mutation tests
- `apps/web` — Next.js release-control interface
- `apps/fixtures` — proof fixture lab
- `packages/gate` — read-only GitHub deployment gate
- `tests`, `mutations`, `scripts` — validation, mutation, integrity and packaging
- `docs` — architecture, consensus, baseline, security, frontend and live-proof design
- `PRO_HANDOFF.md` — exact local/live handoff boundary

## Validation boundary

Offline/static checks and GitHub Actions are evidence only for the code paths they actually execute. **Live Studionet deployment, wallet signing, transaction hashes, deployed-source verification, real validator behaviour and browser-wallet QA remain NOT YET RUN until the funded-wallet phase.**

Do not describe CUTOVER as production-ready solely because offline CI passes.

## Phase 2 local offline validation

The current local source passed **92/92 Direct Mode cases**, killed **65/65 actual-contract mutants**, passed **62/62 frontend tests**, killed **20/20 frontend mutants**, and passed **7/7 GitHub gate tests**. ESLint, TypeScript, web/fixture/gate builds, repository integrity and contract-surface checks passed. Direct Mode needed a temporary Windows tempfile compatibility shim because the pinned test helper unlinks a file while Windows still has it open; that shim changed no repository files. GenVM lint reported three lint checks passed, but validation could not complete because the pinned `py-genlayer` runner archive was missing locally. These are local results; final GitHub Actions and live proof remain pending.
