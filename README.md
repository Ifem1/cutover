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

Offline/static checks and GitHub Actions support only the source and paths they actually execute. Historical and prior revised deployments remain preserved separately. The active assurance deployment and terminal proof are in [`proof/live/assurance-deployment.json`](proof/live/assurance-deployment.json) and [`proof/live/assurance-live-cases.json`](proof/live/assurance-live-cases.json). Active source SHA-256 is `ea9d62b76d5009a67ed0aa60237fd2ad9846a5e6fe0944eead78235cca29bd3f`; active Studionet contract is `0x60FD8fC7012f3b5B42A79B868ecd23451cccf2D4`.

## Previous baseline validation (historical)

The earlier deployment commit `548cb04a79166a3fa59778c4214f7d3cc56b3059` passed **92/92 Direct Mode cases**, killed **65/65 actual-contract mutants**, passed **62/62 frontend tests**, killed **20/20 frontend mutants**, and passed **7/7 GitHub gate tests**. ESLint, TypeScript, builds, repository integrity and contract-surface checks passed in [CI run 36688808069](https://github.com/Ifem1/cutover/actions/runs/36688808069). These results are historical and do not cover the revised source. Direct Mode on Windows needs a local-only workaround for the pinned helper's tempfile cleanup; no workaround is tracked in the repository.

## Active assurance-source validation

The prior source validation remains historical in CI run [36786339583](https://github.com/Ifem1/cutover/actions/runs/36786339583). The active assurance validator patch was linted and deployed with exact source retrieval; a fresh CI run for the final source is still required.

## Active assurance-source Studionet deployment and live cases

Contract `0x60FD8fC7012f3b5B42A79B868ecd23451cccf2D4` is deployed on Studionet chain 61999. Transaction `0xd9c484f17619f4dbd513755174edc3b27c569f34e63d832071882e540f792aeb` finalized with `MAJORITY_AGREE` and leader execution `SUCCESS`. Retrieved deployed source SHA-256 exactly equals the tracked source hash above; `get_config()` reports Studionet / 61999 and assurance bounds. Details: [`assurance deployment record`](proof/live/assurance-deployment.json).

On the active deployment, migration 1 completed the baseline, candidate, semantic assessment and review-deadline lifecycle, reached `AUTHORIZED`, entered `OBSERVING`, committed a verified pricing checkpoint, and finalized `VERIFIED`. Every transaction hash and checkpoint digest is preserved in [`assurance live cases`](proof/live/assurance-live-cases.json). Two rejected checkpoint attempts on earlier assurance deployments are preserved as fail-closed evidence. Final-source `DEVIATED`, final-source `INCONCLUSIVE`, final-source GitHub gate, and final frontend redeployment are not claimed.

The canonical production frontend remains [cutover-kappa.vercel.app](https://cutover-kappa.vercel.app/). This run did not replace it because the handoff instructs the owner to deploy the frontend. Set `NEXT_PUBLIC_CUTOVER_CONTRACT_ADDRESS=0x60FD8fC7012f3b5B42A79B868ecd23451cccf2D4` in the Vercel production build, then repeat injected-wallet QA against the active contract. The controlled assurance fixture is [fixtures-bice.vercel.app](https://fixtures-bice.vercel.app/).

The prior contracts and their historical cycles remain preserved in their original proof files and are not presented as active assurance evidence. See the [`hostile final audit`](docs/FINAL_AUDIT.md). The active contract has a real terminal `VERIFIED` assurance, but the milestone is not submission-ready until final-source negative assurance cases, final-source GitHub gate, frontend redeployment, and browser QA are complete.
