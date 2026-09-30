# CUTOVER — audit and release handoff

## Repository and current deployment

- Repository: [Ifem1/cutover](https://github.com/Ifem1/cutover)
- Branch: `main`
- Network: GenLayer Studionet, chain ID `61999`
- Canonical frontend: [https://cutover-kappa.vercel.app/](https://cutover-kappa.vercel.app/)
- Revised contract: `0x2A19548ae8A86a6d678890095f9F25eddeC16DD3`
- Revised source SHA-256: `13bfc90c1c2aad4ae09c591dbc72af1c063f43e0c71640e70c521b66ed867c79`
- Deployment transaction: `0xc95764f9ac1e81b28941261662c46aae0a49cae14c0719e6059106190b5994de`
- Deployment result: `FINALIZED`, `MAJORITY_AGREE`, leader `SUCCESS`; retrieved contract source exactly matches the tracked source.
- `contracts/cutover.py` remains byte-identical to the deployed source. It was not redeployed during the current live-proof pass.

The deployment receipt's ACCEPTED-labeled poll first returned after the transaction had already finalized. The evidence therefore does not claim that the deployment's ACCEPTED phase was separately observed. See [`proof/live/revised-deployment.json`](proof/live/revised-deployment.json).

## Revised-source live evidence

Migration 1 completed the positive lifecycle, accepted and resolved an independent challenge, was re-derived, waited past its review deadline, then reached `AUTHORIZED`. An authorization attempt while the challenge was unresolved finalized with execution `ERROR` and rollback `challenge unresolved`; authorization was not granted. Migration 2 (source HTTP 503), migration 3 (manifest release-ref mismatch), and migration 4 (body-SHA mismatch) finalized as `INCONCLUSIVE`. Every transaction hash and case summary is in [`proof/live/revised-live-cases.json`](proof/live/revised-live-cases.json).

The revised-source GitHub gate workflow now targets the new deployment and will test exact ref PASS, wrong ref FAIL, and non-AUTHORIZED migration 2 FAIL. The updated workflow has not yet completed in GitHub Actions; record its run/job URLs in [`docs/GITHUB_GATE.md`](docs/GITHUB_GATE.md) after the push.

## Frontend deployment and wallet QA

The canonical frontend still reads the previous contract and migration dataset. Set the Vercel project variable below and redeploy the frontend:

```text
NEXT_PUBLIC_CUTOVER_CONTRACT_ADDRESS=0x2A19548ae8A86a6d678890095f9F25eddeC16DD3
```

Then follow [`docs/MANUAL_QA_RUNBOOK.md`](docs/MANUAL_QA_RUNBOOK.md) using a real injected wallet. The revised contract has migration 1 `AUTHORIZED` and migrations 2–4 `INCONCLUSIVE`; historical migration 3 `AUTHORIZED` and migration 4 `BLOCKED` belong to the old contract only. Wrong-network/switch, account-change and revised-pair transaction UI behavior remain unverified. Do not describe CUTOVER as submission-ready yet.

## Historical deployment (preserved)

Contract `0xB8B2157c9d4f19c66e241178A63A89B13EAB3237`, its deployment/source proof, old migration cycles, prior gate runs and old browser QA remain preserved in their original files. They use source SHA-256 `34018863567489cea352be045f16f6308b0a5c0ef8af668ad84551e10cf75834` and are not evidence for the revised deployment.

## CI baseline

The previously recorded CI run [36753618050](https://github.com/Ifem1/cutover/actions/runs/36753618050) passed on commit `df47e9e1728a51afe51d8d6a25e0efbd29204741`; its live-gate job checked the historical contract. The final CI run for the revised live-gate configuration is pending the updated push.
