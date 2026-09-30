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

Offline/static checks and GitHub Actions are evidence only for the code paths they actually execute. The exact tracked contract is deployed and source-verified on Studionet. Public fixture and frontend deployments are available, and one positive plus one negative migration cycle have been recorded. Live GitHub-gate verification and browser-wallet QA remain incomplete; do not describe CUTOVER as submission-ready yet.

## Phase 2 local offline validation

The local source at deployment commit `548cb04a79166a3fa59778c4214f7d3cc56b3059` passed **92/92 Direct Mode cases**, killed **65/65 actual-contract mutants**, passed **62/62 frontend tests**, killed **20/20 frontend mutants**, and passed **7/7 GitHub gate tests**. ESLint, TypeScript, web/fixture/gate builds, repository integrity and contract-surface checks passed. GitHub Actions run [36688808069](https://github.com/Ifem1/cutover/actions/runs/36688808069) passed on that commit. Direct Mode needed a temporary Windows tempfile compatibility shim because the pinned test helper unlinks a file while Windows still has it open; that shim changed no repository files.

## Live deployment (partial)

The contract is deployed on Studionet chain 61999 at `0xB8B2157c9d4f19c66e241178A63A89B13EAB3237`. Deployment transaction: `0xd20c981216ecccc524ca46ec32263a1698893704fad2a4309bbbece4bdbca65e`. The finalized source fetched through `genlayer-js` 1.1.8 has the same SHA-256 as `contracts/cutover.py`: `34018863567489cea352be045f16f6308b0a5c0ef8af668ad84551e10cf75834`. See [deployment evidence](proof/live/deployment.json), [positive authorized cycle](proof/live/positive-cycle.json), and [negative blocked cycle](proof/live/negative-cycle.json).

The public CUTOVER frontend is [cutover-web.vercel.app](https://cutover-web.vercel.app), and the public fixture lab is [cutover-fixtures.vercel.app](https://cutover-fixtures.vercel.app). For a Vercel frontend deployment, set `NEXT_PUBLIC_CUTOVER_CONTRACT_ADDRESS=0xB8B2157c9d4f19c66e241178A63A89B13EAB3237`. Network, RPC and explorer are pinned in the frontend source. For the fixture deployment, set `CUTOVER_CANDIDATE_MANIFEST_JSON` to the JSON returned by `https://cutover-fixtures.vercel.app/.well-known/cutover.json`; generate and verify it with `scripts/live/build_manifest.mjs` whenever the fixture source or deployment changes.

The live positive cycle (migration 3) ended `AUTHORIZED` after the review deadline, with an independent challenge resolved and re-derived. The negative cycle (migration 4) ended `BLOCKED` for pricing, legal, signup and injection fixtures. The unrelated-route assessment produced validator `MAJORITY_DISAGREE` and remained unapproved. Live unavailable-source, wrong-ref, body-digest mismatch, GitHub gate, and browser-wallet cases remain outstanding.
