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

Offline/static checks and GitHub Actions support only the source and paths they actually execute. The historical contract and its cycles remain recorded separately from the revised source. Current revised-source live deployment and cycle evidence is in [`proof/live/revised-deployment.json`](proof/live/revised-deployment.json) and [`proof/live/revised-live-cases.json`](proof/live/revised-live-cases.json). The revised source hash is `13bfc90c1c2aad4ae09c591dbc72af1c063f43e0c71640e70c521b66ed867c79`. Its revised live GitHub gate passed, the production frontend now targets the revised contract, and manual injected-wallet QA is recorded in [`proof/live/revised-browser-qa.json`](proof/live/revised-browser-qa.json).

## Previous baseline validation (historical)

The earlier deployment commit `548cb04a79166a3fa59778c4214f7d3cc56b3059` passed **92/92 Direct Mode cases**, killed **65/65 actual-contract mutants**, passed **62/62 frontend tests**, killed **20/20 frontend mutants**, and passed **7/7 GitHub gate tests**. ESLint, TypeScript, builds, repository integrity and contract-surface checks passed in [CI run 36688808069](https://github.com/Ifem1/cutover/actions/runs/36688808069). These results are historical and do not cover the revised source. Direct Mode on Windows needs a local-only workaround for the pinned helper's tempfile cleanup; no workaround is tracked in the repository.

## Revised-source validation

For source SHA-256 `13bfc90c1c2aad4ae09c591dbc72af1c063f43e0c71640e70c521b66ed867c79`, final verified validation passed **111/111 Direct Mode tests**, killed **73/73 actual-contract mutants**, passed **91/91 frontend tests** (including **11** `tx.test.ts` and **7** `ContractSubmit.test.tsx` tests), killed **24/24 frontend mutants**, and passed **7/7 gate tests**. ESLint, TypeScript, web/fixtures/gate builds, Python compile, contract-surface, repository-integrity, network-discipline, GenVM lint, revised live gate and package handoff all passed in final code CI [run 36786339583](https://github.com/Ifem1/cutover/actions/runs/36786339583) for frontend fix commit `2a7599af90d2533d848e06887c3917681847552a`. Vercel reported success for that commit.

## Revised-source Studionet deployment and live cases

Contract `0x2A19548ae8A86a6d678890095f9F25eddeC16DD3` is deployed on Studionet chain 61999. Transaction `0xc95764f9ac1e81b28941261662c46aae0a49cae14c0719e6059106190b5994de` finalized with `MAJORITY_AGREE` and leader execution `SUCCESS`. Retrieved deployed source SHA-256 equals the tracked source hash above. The deployment receipt poll first labeled `ACCEPTED` had already observed `FINALIZED`; the record explicitly does not claim a separately observed ACCEPTED phase. `get_config()` reported Studionet / 61999. Details: [`revised deployment record`](proof/live/revised-deployment.json).

On this deployment, migration 1 completed the positive lifecycle, resolved an independent challenge, and reached `AUTHORIZED` after the review deadline. An authorization attempt while the challenge was unresolved finalized with execution `ERROR` and rollback `challenge unresolved`; no authorization was granted. Migration 2 produced `INCONCLUSIVE` for a live HTTP 503, migration 3 for a live manifest release-ref mismatch, and migration 4 for a body SHA mismatch. A first challenge reassessment was canceled with `NO_MAJORITY` and no state change; a subsequent attempt succeeded. Every live transaction hash and case result is preserved in [`revised live cases`](proof/live/revised-live-cases.json). These revised cases do not establish a revised-source `BLOCKED` result or revised-source validator disagreement.

The canonical production frontend is [cutover-kappa.vercel.app](https://cutover-kappa.vercel.app/) and now targets `0x2A19548ae8A86a6d678890095f9F25eddeC16DD3` on Studionet 61999. Manual injected-wallet QA verified wrong-network handling, signature rejection, disconnect/reconnect, a real successful `create_migration` returning migration 5, and a real successful `add_route`. That run exposed a frontend-only Studionet execution-result normalization bug: Studio reported leader `execution_result: "SUCCESS"` while `txExecutionResultName` was absent, and the old UI falsely displayed `EXECUTION FAILURE ... UNKNOWN`. Commit `2a7599af90d2533d848e06887c3917681847552a` fixed the normalization, Vercel deployed it successfully, and a later real frontend write displayed `EXECUTION SUCCESS` and reread `LATEST_FINAL` state. Live account-change and pending-refresh recovery were not run. See [`revised browser QA`](proof/live/revised-browser-qa.json) and the [`manual runbook`](docs/MANUAL_QA_RUNBOOK.md). The isolated proof fixture at [cutover-live-proof-20260930.vercel.app](https://cutover-live-proof-20260930.vercel.app/) is not the production frontend and was intentionally changed between adversarial cases.

The prior contract at `0xB8B2157c9d4f19c66e241178A63A89B13EAB3237`, its source SHA `34018863567489cea352be045f16f6308b0a5c0ef8af668ad84551e10cf75834`, historical positive/negative cycles, and browser observations remain preserved in their original proof files. They are not presented as revised-source evidence. See the [`hostile final audit`](docs/FINAL_AUDIT.md). On the verified scope, CUTOVER is technically ready to submit; optional revised-source `BLOCKED`/prompt-injection live cases and live account-change/refresh-recovery QA remain explicitly unclaimed. The production dependency audit findings are documented rather than automatically upgraded.
