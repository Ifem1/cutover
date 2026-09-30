# CUTOVER — audit and release handoff

## Repository and current deployment

- Repository: [Ifem1/cutover](https://github.com/Ifem1/cutover)
- Branch: `main`
- Network: GenLayer Studionet, chain ID `61999`
- Canonical frontend: [https://cutover-kappa.vercel.app/](https://cutover-kappa.vercel.app/)
- Revised contract: `0x2A19548ae8A86a6d678890095f9F25eddeC16DD3`
- Revised source SHA-256: `13bfc90c1c2aad4ae09c591dbc72af1c063f43e0c71640e70c521b66ed867c79`
- Contract Git blob: `7ec2ac24b38653e0588f6ce699ee5d6282f473b6`
- Deployment transaction: `0xc95764f9ac1e81b28941261662c46aae0a49cae14c0719e6059106190b5994de`
- Deployment result: `FINALIZED`, `MAJORITY_AGREE`, leader `SUCCESS`; retrieved contract source exactly matches tracked source.
- No contract edit or redeployment is part of the final evidence cleanup.

The deployment receipt's ACCEPTED-labeled poll first returned after the transaction had already finalized. The evidence therefore does not claim that the deployment's ACCEPTED phase was separately observed. See [`proof/live/revised-deployment.json`](proof/live/revised-deployment.json).

## Revised-source live evidence

Migration 1 completed the positive lifecycle, accepted and resolved an independent challenge, was re-derived, waited past its review deadline, then reached `AUTHORIZED`. An authorization attempt while the challenge was unresolved finalized with execution `ERROR` and rollback `challenge unresolved`; authorization was not granted. Migration 2 (source HTTP 503), migration 3 (manifest release-ref mismatch), and migration 4 (body-SHA mismatch) finalized as `INCONCLUSIVE`. Every tracked transaction hash and case summary is in [`proof/live/revised-live-cases.json`](proof/live/revised-live-cases.json).

The revised-source GitHub gate passed and remains covered by the final CI workflow. Historical gate evidence is retained separately.

## Production frontend and wallet QA

The production frontend now targets the revised contract on Studionet 61999. Manual injected-wallet QA verified wrong-network handling, wallet rejection, disconnect/reconnect, a real successful `create_migration` returning migration 5, and a real successful `add_route`.

That manual run caught a frontend interpretation bug: Studio exposed `leader_receipt.execution_result = "SUCCESS"` while `txExecutionResultName` was absent, so the old UI incorrectly displayed `EXECUTION FAILURE ... UNKNOWN`. Commit `2a7599af90d2533d848e06887c3917681847552a` normalized both SDK representations. Vercel deployed that commit successfully, and a subsequent real frontend write displayed `EXECUTION SUCCESS` plus `Finalized successfully; contract state re-read from LATEST_FINAL.`

The manual transaction hashes were observed but are not yet recorded in repository evidence; no hash is invented. See [`proof/live/revised-browser-qa.json`](proof/live/revised-browser-qa.json).

Live account-change QA and live pending-transaction refresh recovery were not run.

## Final validation

Final code CI for commit `2a7599af90d2533d848e06887c3917681847552a` is [run 36786339583](https://github.com/Ifem1/cutover/actions/runs/36786339583), completed successfully.

Verified totals:

- Direct Mode: **111/111**
- actual-contract mutants: **73/73 killed**
- frontend tests: **91/91**
- `tx.test.ts`: **11**
- `ContractSubmit.test.tsx`: **7**
- frontend mutants: **24/24 killed**
- gate tests: **7/7**

Vercel also reported success for the same commit.

A production-only `npm audit --omit=dev --json` evidence run reported 4 production-tree findings (2 moderate, 2 high, 0 critical): Next/PostCSS in the web/fixture tree and `@actions/http-client`/Undici in the GitHub gate tree. No automatic or SemVer-major upgrade was applied; details are in [`docs/FINAL_AUDIT.md`](docs/FINAL_AUDIT.md).

## Historical deployment and remaining optional gaps

Contract `0xB8B2157c9d4f19c66e241178A63A89B13EAB3237`, its source SHA `34018863567489cea352be045f16f6308b0a5c0ef8af668ad84551e10cf75834`, prior cycles, and historical browser records remain preserved and are not presented as revised-source proof.

Optional evidence gaps that remain explicitly unclaimed:

- revised-source live `BLOCKED`;
- revised-source live prompt injection;
- live account-change QA;
- live pending-transaction refresh recovery.
