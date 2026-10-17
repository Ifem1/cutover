# Hostile final audit status

## Active assurance milestone audit (2026-10-16)

The active source is audited at `c1f49b0b6f29df0f32e801ce8c29c9c2d290a31d`, with contract SHA-256 `ea9d62b76d5009a67ed0aa60237fd2ad9846a5e6fe0944eead78235cca29bd3f`, deployed at `0x60FD8fC7012f3b5B42A79B868ecd23451cccf2D4` on Studionet 61999. The deployment receipt finalized with majority agreement and leader success, and retrieved source bytes match exactly. Migration 1 has a real terminal `VERIFIED` assurance checkpoint with matching manifest and body digests; migrations 3 and 4 independently finalized `DEVIATED` and `INCONCLUSIVE`. Evidence is in [`proof/live/assurance-live-cases.json`](../proof/live/assurance-live-cases.json) and [`proof/live/assurance-negative-live-cases.json`](../proof/live/assurance-negative-live-cases.json).

The active-source negative lifecycles are complete. The production frontend deployment `dpl_621cwHSb1pn3bknUGwGQs1WxQ4pe` is aliased at [`https://cutover-kappa.vercel.app/`](https://cutover-kappa.vercel.app/) and was built with `NEXT_PUBLIC_CUTOVER_CONTRACT_ADDRESS=0x60FD8fC7012f3b5B42A79B868ecd23451cccf2D4`; the live migrations page rendered the active on-chain records and frontend QA is accepted. The active-source gate baseline passed in [run 38901682370](https://github.com/Ifem1/cutover/actions/runs/38901682370), with [live-gate job 116975585789](https://github.com/Ifem1/cutover/actions/runs/38901682370/job/116975585789) recording exact-ref PASS, wrong-ref FAIL and DRAFT-state FAIL. Prior-source mismatch and unresolved-authorization receipts remain explicitly historical.

The assurance proof scope is complete for VERIFIED, DEVIATED and INCONCLUSIVE. Submission is clear after the final CI rerun for this documentation commit.

Audit scope: revised-source deployment/live evidence, production frontend/wallet evidence, final CI, dependency-audit findings, and preservation of the historical/revised evidence boundary.

## Historical revised-source identity and deployment

The following section is retained as historical evidence for the earlier revised-source deployment. It is not the active assurance deployment described above.

- Tracked contract source: `contracts/cutover.py`, SHA-256 `13bfc90c1c2aad4ae09c591dbc72af1c063f43e0c71640e70c521b66ed867c79`.
- Contract Git blob: `7ec2ac24b38653e0588f6ce699ee5d6282f473b6`.
- Revised Studionet contract: `0x2A19548ae8A86a6d678890095f9F25eddeC16DD3`, chain `61999`.
- Deployment transaction: `0xc95764f9ac1e81b28941261662c46aae0a49cae14c0719e6059106190b5994de`; observed `FINALIZED`, `MAJORITY_AGREE`, leader `SUCCESS`.
- Deployed source retrieval returned the same SHA-256. Exact retrieval evidence is in [`revised-deployment.json`](../proof/live/revised-deployment.json).
- Caveat: the deployment's ACCEPTED-labeled receipt poll first returned after finalization; a separate deployment ACCEPTED observation is not claimed.
- Historical address `0xB8B2157c9d4f19c66e241178A63A89B13EAB3237` and SHA `34018863567489cea352be045f16f6308b0a5c0ef8af668ad84551e10cf75834` remain historical-only evidence.

The evidence/documentation cleanup does not modify `contracts/cutover.py` and does not create or redeploy a contract.

## Nondeterministic payload audit

[`docs/CONSENSUS.md`](CONSENSUS.md) inventories all four `run_nondet_unsafe` sites and classifies leader return fields, validator recomputation/comparison, deliberately unbound explanatory prose, and Direct Mode attack tests. Consequential payloads are validator-bound; bounded explanations are presentation-only.

## Revised live outcomes

The tracked record [`revised-live-cases.json`](../proof/live/revised-live-cases.json) contains revised-source transaction hashes and outcome evidence:

- Migration 1 reached `AUTHORIZED` only after challenge resolution, re-derivation, and expiration of its review deadline.
- Owner authorization while the challenge was unresolved finalized with execution `ERROR`, rollback `challenge unresolved`, and no authorization.
- Migration 2 (HTTP 503), migration 3 (manifest ref mismatch), and migration 4 (body SHA mismatch) ended `INCONCLUSIVE`.
- An initial challenge reassessment was `CANCELED` / `NO_MAJORITY` and made no state change; a later retry resolved the challenge.
- The revised-source live GitHub gate passed exact-ref, wrong-ref, and non-AUTHORIZED-state assertions.
- These revised runs do **not** establish a revised-source `BLOCKED` case or revised-source prompt-injection case. Historical cases remain explicitly separate.

## Active production frontend QA

The active frontend deployment is `dpl_621cwHSb1pn3bknUGwGQs1WxQ4pe`, aliased at [`https://cutover-kappa.vercel.app/`](https://cutover-kappa.vercel.app/), with `NEXT_PUBLIC_CUTOVER_CONTRACT_ADDRESS=0x60FD8fC7012f3b5B42A79B868ecd23451cccf2D4`. Read-only browser QA on `/migrations` and `/migrations/1` and `/migrations/3` confirmed Studionet 61999, the active contract address, the preserved `VERIFIED` assurance record and the active migration 3 control room. The production page also exposed the route matrix, checkpoint/finalization status and explorer links from finalized on-chain state.

Frontend browser QA is accepted for the deployed production UI, including wallet interaction coverage supplied by the owner. CLI-wallet transactions remain recorded separately as contract evidence.

## Historical production frontend and manual wallet QA

The following browser record is historical evidence for the earlier revised contract and is kept separate from the active production deployment.

Manual production QA with a real injected wallet verified:

- wrong-network handling;
- wallet signature rejection;
- disconnect/reconnect;
- a real `create_migration` write that finalized successfully and returned migration 5;
- a subsequent real `add_route` write that finalized successfully.

The first manual run exposed a frontend-only transaction-result normalization defect. Studionet Studio reported successful execution in `consensus_data.leader_receipt.execution_result = "SUCCESS"`, while `txExecutionResultName` was absent. The old frontend therefore displayed `EXECUTION FAILURE` and `... UNKNOWN` even though the transaction was finalized, accepted by consensus, executed successfully, and its state reread showed the write.

Commit `2a7599af90d2533d848e06887c3917681847552a` fixed that interpretation by normalizing both supported SDK representations:

- normalized SDK `FINISHED_WITH_RETURN` / `FINISHED_WITH_ERROR`;
- Studio leader receipt `SUCCESS` / `ERROR`;
- genuinely missing execution evidence is reported as unavailable rather than a proven contract failure.

Regression coverage for the fix is included in `tx.test.ts` and `ContractSubmit.test.tsx`. Vercel reported success for the fix commit. After that production deployment, another real frontend write finalized successfully and the UI correctly displayed `EXECUTION SUCCESS` and `Finalized successfully; contract state re-read from LATEST_FINAL.`

Manual transaction hashes from this browser QA were observed by the operator but are not yet stored in repository evidence; none are invented here. Full browser evidence is in [`revised-browser-qa.json`](../proof/live/revised-browser-qa.json).

Live account-change QA and live pending-transaction refresh recovery were **not run** and are not claimed.

## Historical revised-source validation and CI

For commit `2a7599af90d2533d848e06887c3917681847552a`, final CI [run 36786339583](https://github.com/Ifem1/cutover/actions/runs/36786339583) completed successfully.

Verified totals from that run:

- Direct Mode: **111/111**.
- Actual-contract mutation sweep: **73/73** killed.
- Frontend tests: **91/91** across 12 test files.
- `tx.test.ts`: **11** tests.
- `ContractSubmit.test.tsx`: **7** tests.
- Frontend mutation sweep: **24/24** killed.
- Gate tests: **7/7**.
- ESLint, TypeScript, web/fixture/gate builds, repository integrity, contract surface, network discipline, GenVM lint, revised live gate, and package handoff all passed.

Vercel reported `success` for the same frontend fix commit.

## Production dependency audit

The exact command `npm audit --omit=dev --json` was run on a temporary **unmerged** GitHub Actions evidence branch/PR so the audit did not alter `main`. It reported **4 production-tree findings: 2 moderate, 2 high, 0 critical**:

- `next@15.5.26` — direct production dependency, reported moderate through its PostCSS dependency; present in the web and fixture production dependency trees.
- `postcss@8.4.31` — transitive production dependency of Next, reported high because current audit data includes path-traversal/information-disclosure advisories as well as moderate XSS-related advisories.
- `@actions/http-client@2.2.3` — transitive production dependency of `@actions/core` in the GitHub gate, reported moderate through Undici.
- `undici@5.29.0` — transitive production dependency of `@actions/http-client` in the GitHub gate, reported high.

The Next/PostCSS findings belong to the production web/fixture dependency graph; the Actions/Undici findings belong to the GitHub gate dependency graph rather than the Vercel UI. This cleanup does not claim exploitability or non-exploitability for CUTOVER-specific paths. No automatic fix or breaking upgrade was applied. The audit offered a Next remediation through `16.3.8`, which is a SemVer-major upgrade and is intentionally outside this evidence-only task.

## Remaining optional evidence gaps

These are evidence gaps, not promoted as contract defects:

- no revised-source live `BLOCKED` case;
- no revised-source live prompt-injection case;
- no live account-change QA;
- no live pending-transaction refresh-recovery QA.

Historical evidence remains clearly separated from revised-source evidence.

## Release decision for the active assurance milestone

**Assurance milestone complete.** The active source has source-matched `VERIFIED`, `DEVIATED` and `INCONCLUSIVE` terminal assurances, an accepted production frontend pointed at the active contract, and a passing active GitHub gate. Historical evidence remains clearly separated.
