# Hostile final audit status

Audit scope: current revised-source live evidence, repository/workflow drift, and whether each claim is supported by observed evidence. This is a status report, not a submission-ready declaration.

## Contract identity and deployment

- Tracked source: `contracts/cutover.py`, SHA-256 `13bfc90c1c2aad4ae09c591dbc72af1c063f43e0c71640e70c521b66ed867c79`.
- Revised Studionet contract: `0x2A19548ae8A86a6d678890095f9F25eddeC16DD3`, chain `61999`.
- Deployment transaction: `0xc95764f9ac1e81b28941261662c46aae0a49cae14c0719e6059106190b5994de`; observed `FINALIZED`, `MAJORITY_AGREE`, leader `SUCCESS`.
- Deployed source retrieval returned the same SHA-256. Exact retrieval evidence is in [`revised-deployment.json`](../proof/live/revised-deployment.json).
- Caveat: the deployment's ACCEPTED-labeled receipt poll first returned after finalization; a separate deployment ACCEPTED observation is not claimed.
- Historical address `0xB8B2157c9d4f19c66e241178A63A89B13EAB3237` and SHA `34018863567489cea352be045f16f6308b0a5c0ef8af668ad84551e10cf75834` are retained and clearly scoped as historical.
- The current changes do not modify `contracts/cutover.py`; its SHA-256 still equals the deployed `13bfc90c1c2aad4ae09c591dbc72af1c063f43e0c71640e70c521b66ed867c79`, and `git diff` against source HEAD `c75641176acc263f9a35fab2d9b7c9f9bfb29c19` is empty.

## Nondeterministic payload audit

[`docs/CONSENSUS.md`](CONSENSUS.md) inventories all four `run_nondet_unsafe` sites and classifies the leader return fields, validator recomputation/comparison, deliberately unbound explanatory prose, and Direct Mode attack tests. A fresh source scan found the same four sites and no additional nondeterministic call. Consequential payloads are validator-bound; bounded explanations are explicitly excluded from consensus/evidence commitments and are presentation-only.

## Revised live outcomes

The tracked evidence record [`revised-live-cases.json`](../proof/live/revised-live-cases.json) contains transaction hashes and explicit ACCEPTED/FINALIZED semantics for the revised positive lifecycle and fail-closed cases:

- Migration 1 reached `AUTHORIZED` only after challenge resolution, re-derivation, and expiration of its review deadline.
- Owner authorization while the challenge was unresolved finalized with execution `ERROR`, rollback `challenge unresolved`, and no authorization.
- Migration 2 (HTTP 503), migration 3 (manifest ref mismatch), and migration 4 (body SHA mismatch) ended `INCONCLUSIVE`.
- An initial challenge reassessment was `CANCELED` / `NO_MAJORITY` and made no state change; a later retry resolved the challenge.
- These revised live runs did not prove a revised-source `BLOCKED` outcome, validator disagreement, or prompt-injection behavior. Historical proof for those cases is not promoted to revised-source evidence.

## Workflow, frontend, and finality

- `.github/workflows/ci.yml` now queries the revised contract and migration 1 exact ref, wrong ref, and migration 2's non-AUTHORIZED state. This is configuration only until its actual GitHub Actions run passes; run and job URLs must be recorded after execution.
- The canonical frontend is `https://cutover-kappa.vercel.app/`, but its deployed configuration still reads the historical contract. Current browser observations are therefore not revised-pair wallet proof. Required Vercel value: `NEXT_PUBLIC_CUTOVER_CONTRACT_ADDRESS=0x2A19548ae8A86a6d678890095f9F25eddeC16DD3`.
- Do not conflate `ACCEPTED` with `FINALIZED`. Each successful lifecycle write observed both phases. The unresolved-challenge authorization finalized with execution failure, not success. Deployment has the phase-observation caveat above.
- Real injected-wallet account change, wrong network, switch to 61999, revised-pair refresh recovery, revised migration views, and revised-pair explorer lifecycle remain unverified. Current and historical browser records are separate.

## Release decision

**Not submission-ready.** Required remaining evidence: green final CI with the revised live gate and its preserved run/job URLs, plus the user's production frontend redeploy and real injected-wallet QA against the revised contract. Do not infer that a passing CI configuration, local wallet-control UI, or historical browser record satisfies either requirement.
