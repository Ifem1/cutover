# Live proof plan and results

This document separates proof on the revised source from the retained historical deployment. The revised contract is `0x2A19548ae8A86a6d678890095f9F25eddeC16DD3` on Studionet (`61999`), with source SHA-256 `13bfc90c1c2aad4ae09c591dbc72af1c063f43e0c71640e70c521b66ed867c79`. Deployment and source retrieval match are documented in [`proof/live/revised-deployment.json`](../proof/live/revised-deployment.json). The canonical frontend is [https://cutover-kappa.vercel.app/](https://cutover-kappa.vercel.app/); it has not yet been redeployed with the revised contract address.

## Revised-source live evidence

The new deployment was exercised using a funded Studionet test wallet. Transaction records distinguish ACCEPTED from FINALIZED. The initial deployment receipt poll labeled ACCEPTED returned only after the status was already FINALIZED, so no separate ACCEPTED observation is claimed for deployment itself.

| Migration | Case | Final observed result |
|---:|---|---|
| 1 | Exact candidate ref; authenticated baseline; preserved rule; independent challenge; challenge resolved and candidate re-derived; review window elapsed | `AUTHORIZED` |
| 1 | Owner attempts authorization while an admitted challenge is unresolved | Finalized `MAJORITY_AGREE`, execution `ERROR`, rollback `challenge unresolved`; no authorization |
| 2 | Candidate endpoint returns HTTP 503 | Route and migration `INCONCLUSIVE` |
| 3 | Candidate A registered, then live manifest release ref changes to candidate B while body hash remains the same | `manifest_match=false`, `content_match=true`; route and migration `INCONCLUSIVE` |
| 4 | Manifest identity matches but declared body SHA is all zeroes while observed candidate body differs | `manifest_match=true`, `content_match=false`; route and migration `INCONCLUSIVE` |

An initial `reassess_challenge` attempt was `CANCELED` / `NO_MAJORITY` with no state change; a later retry finalized successfully, resolved the challenge, and allowed re-derivation. All transaction hashes, final states, digests, receipt notes, and local raw-artifact paths are in [`proof/live/revised-live-cases.json`](../proof/live/revised-live-cases.json). This revised-source run did not establish a `BLOCKED` result, validator disagreement, or prompt-injection outcome.

## Revised-source GitHub gate

The committed CI workflow now targets the revised deployment and will assert:

1. migration 1 with candidate ref `c75641176acc263f9a35fab2d9b7c9f9bfb29c19` passes;
2. migration 1 with an incorrect expected ref fails at the exact-ref guard;
3. migration 2, whose finalized state is `INCONCLUSIVE`, fails at the authorization-state guard.

The revised-source assertions passed in [GitHub Actions run 36769705489](https://github.com/Ifem1/cutover/actions/runs/36769705489), with the [live-gate job](https://github.com/Ifem1/cutover/actions/runs/36769705489/job/110073021673) confirming the exact-ref PASS and the two asserted FAIL cases. The full workflow run finished green, including package handoff. The prior [run 36753618050](https://github.com/Ifem1/cutover/actions/runs/36753618050) and its [live-gate job](https://github.com/Ifem1/cutover/actions/runs/36753618050/job/110018493960) used the previous contract and remain historical only.

## Production frontend and wallet QA

The canonical frontend currently renders migration records from the previous contract. It must be configured in Vercel with:

```text
NEXT_PUBLIC_CUTOVER_CONTRACT_ADDRESS=0x2A19548ae8A86a6d678890095f9F25eddeC16DD3
```

Then redeploy the frontend and run [`docs/MANUAL_QA_RUNBOOK.md`](MANUAL_QA_RUNBOOK.md) with a real injected wallet. The revised contract has migrations 1–4, so the historical `/migrations/3` AUTHORIZED and `/migrations/4` BLOCKED views do not describe the new deployment: revised migration 1 is `AUTHORIZED`, and revised migrations 2–4 are `INCONCLUSIVE`. The historical browser report remains in [`proof/live/browser-qa.json`](../proof/live/browser-qa.json); current revised-pair browser limitations are in [`proof/live/revised-browser-qa.json`](../proof/live/revised-browser-qa.json).

Do not call the release submission-ready until the revised-source GitHub live gate passes and the production frontend is configured and verified with injected-wallet QA. Wrong-network switching, account changes, and revised-pair transaction lifecycle remain unverified.

## Historical deployment

The previous contract `0xB8B2157c9d4f19c66e241178A63A89B13EAB3237` with source SHA-256 `34018863567489cea352be045f16f6308b0a5c0ef8af668ad84551e10cf75834`, its old migrations, and its old gate/browser results are retained in the existing versioned proof files. None of those historical outcomes are attributed to the revised contract.
