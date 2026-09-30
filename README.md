# CUTOVER

**CUTOVER is a GenLayer-backed production migration acceptance protocol.** It answers a narrow release question: has the exact replacement website preserved the routes, behaviours and commitments that matter enough to authorize production cutover?

A migration is not accepted because a homepage returns HTML. CUTOVER freezes bounded baseline evidence before migration, authenticates that snapshot against the public baseline, independently observes the candidate, classifies rule-level semantic changes through GenLayer consensus, and uses deterministic contract code to derive `BLOCKED`, `INCONCLUSIVE`, `READY`, and finally `AUTHORIZED`.

## Why GenLayer

Normal smart contracts can deterministically manage candidate identity, hashes, generations, deadlines, duplicate prevention and state transitions. They cannot by themselves judge whether new wording silently changes a cancellation obligation, whether a redirect lands on the semantically corresponding page, or whether a redesigned journey still preserves the required function.

CUTOVER therefore uses consensus only for bounded interpretation. Models never answer “should this migration be authorized?” Models report structured findings; deterministic contract code owns release consequence.

## Lifecycle

`DRAFT → BASELINED → CANDIDATE → READY | BLOCKED | INCONCLUSIVE → CHALLENGED? → READY → AUTHORIZED`

Changing `candidate_origin` or `candidate_ref` increments the candidate generation and invalidates prior assessment/authorization state. A non-owner may submit at most three admitted challenge attempts per generation and two per route. Invalid, unavailable or irrelevant evidence consumes no attempt. Challenge text is retained for audit, but only triggers a fresh independent candidate assessment; it is not semantic-verdict input. Ordinary assessments are owner-only so unrelated callers cannot exhaust the bounded retry budget. A READY-preserving challenge does not permanently close the route; every admitted attempt and its evidence digest remain auditable. There is no force-ready or force-authorize escape hatch.

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
- `contracts/surface.json` — tracked public read/write ABI surface
- `apps/web` — Next.js release-control interface
- `apps/fixtures` — proof fixture lab
- `packages/gate` — read-only GitHub deployment gate
- `tests`, `mutations`, `scripts` — validation, mutation, integrity and packaging
- `docs` — architecture, consensus, baseline, security, frontend and live-proof design
- `PRO_HANDOFF.md` — exact local/live handoff boundary

## Validation boundary

Offline/static checks and GitHub Actions are evidence only for the code paths they actually execute. The previous deployment, live cycles and gate run below apply to contract source SHA-256 `34018863567489cea352be045f16f6308b0a5c0ef8af668ad84551e10cf75834`. This audit changes `contracts/cutover.py`; the previous deployment is no longer evidence for the revised source. A fresh deployment, source verification, live cycles and green CI for the new commit remain required. Historical browser observations are in [`proof/live/browser-qa.json`](proof/live/browser-qa.json); account-change and wrong-network wallet QA remain incomplete. Do not describe the revised source as submission-ready.

## Previous baseline validation (historical)

The earlier deployment commit `548cb04a79166a3fa59778c4214f7d3cc56b3059` passed **92/92 Direct Mode cases**, killed **65/65 actual-contract mutants**, passed **62/62 frontend tests**, killed **20/20 frontend mutants**, and passed **7/7 GitHub gate tests**. ESLint, TypeScript, builds, repository integrity and contract-surface checks passed in [CI run 36688808069](https://github.com/Ifem1/cutover/actions/runs/36688808069). These results are historical and do not cover the revised source. Direct Mode on Windows needs a local-only workaround for the pinned helper's tempfile cleanup; no workaround is tracked in the repository.

## Current revised-source audit

The revised contract source currently hashes to `13bfc90c1c2aad4ae09c591dbc72af1c063f43e0c71640e70c521b66ed867c79`. Local checks passed: **111/111 Direct Mode tests**, **73/73 actual-contract mutants**, **73/73 frontend tests**, **20/20 frontend mutants**, and **7/7 gate tests**. Frontend lint, TypeScript, the web/fixtures/gate production builds, Python compile, contract-surface, repository-integrity, network-discipline and GenVM lint/validation checks passed locally. A clean handoff archive also passed its content audit (**118 entries**, no local runtime, build cache or secret files). These results are offline-only; GitHub Actions validation is pending. The revised contract has not been deployed and the current live/browser/gate records remain historical.

## Previous live deployment (historical evidence only)

Contract `0xB8B2157c9d4f19c66e241178A63A89B13EAB3237` was deployed on Studionet chain 61999 in transaction `0xd20c981216ecccc524ca46ec32263a1698893704fad2a4309bbbece4bdbca65e`. Its finalized retrieved source matched SHA-256 `34018863567489cea352be045f16f6308b0a5c0ef8af668ad84551e10cf75834`. This is historical proof, not the current revised contract. Preserve it; after explicit deployment approval, add a versioned record for the revised source rather than replacing it.

The canonical public CUTOVER frontend is [cutover-kappa.vercel.app](https://cutover-kappa.vercel.app/). Its `NEXT_PUBLIC_CUTOVER_CONTRACT_ADDRESS` must point to the newly deployed revised-contract address after deployment approval; network, RPC and explorer are pinned in frontend source. The isolated adversarial proof fixture is hosted at [cutover-live-proof-20260930.vercel.app](https://cutover-live-proof-20260930.vercel.app/); its manifest is intentionally replaced between proof cases and it is not the production frontend. Historical cycle records retain the fixture origins that were live when those transactions ran.

The historical positive cycle (migration 3) ended `AUTHORIZED` after the review deadline, with a challenge resolved and re-derived. Migration 4 ended `BLOCKED`; separate old-deployment cases show unavailable source, manifest-ref mismatch and body-digest mismatch becoming `INCONCLUSIVE`. Migration 7's unresolved challenge remained open after an authorization attempt; the earlier state guard produced `candidate not ready`. See [`proof/live/adversarial-cases.json`](proof/live/adversarial-cases.json) for hashes and exact results. These outcomes are scoped to the previous source hash and do not prove the revised contract. Historical browser QA confirms navbar connect/disconnect, refresh recovery, migration 3/4 views and explorer lifecycle; account switching and wrong-network switching remain untested. New source deployment and proof are pending.
