# GitHub gate

`packages/gate` is a read-only deployment consumer. Inputs are contract address, migration ID, expected candidate ref and optional chain ID fixed to 61999 by default.

It reads **finalized** migration and authorization records and fails unless:
- state is `AUTHORIZED`;
- authorization generation equals the current candidate generation;
- assessed generation is current;
- authorization ref equals the current candidate ref;
- authorization ref exactly equals the caller's expected ref.

The action uses GitHub's Node 24 JavaScript-action runtime and `@vercel/ncc`; the committed runtime includes `dist/index.js` and its generated `dist/338.index.js` chunk.

## Source-repository usage

The repository commits both generated action runtime files and the lockfile. CI verifies that the generated files match the action source; local consumers can invoke the repository action directly:

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: '24'
- uses: ./packages/gate
  with:
    contract-address: ${{ vars.CUTOVER_CONTRACT }}
    migration-id: '12'
    expected-candidate-ref: ${{ github.sha }}
```

The live gate is configured to use the revised, source-verified Studionet contract at `0x2A19548ae8A86a6d678890095f9F25eddeC16DD3`. Migration 1 is `AUTHORIZED` for exact candidate ref `c75641176acc263f9a35fab2d9b7c9f9bfb29c19`; migration 2 is `INCONCLUSIVE`. [CI run 36769705489](https://github.com/Ifem1/cutover/actions/runs/36769705489) passed. Its [revised live-gate job](https://github.com/Ifem1/cutover/actions/runs/36769705489/job/110073021673) passed the exact-ref candidate, then asserted the wrong-ref error (`does not equal expected cutover-live-proof-wrong-ref`) and non-AUTHORIZED state error (`CUTOVER state is INCONCLUSIVE, expected AUTHORIZED`). The full CI run also passed the repository integrity, contract lint/Direct Mode, actual-contract mutation, web lint/types/tests/builds, frontend mutation, gate tests/build, generated artifacts and handoff packaging jobs.

Historical gate evidence is retained: [run 36735999116](https://github.com/Ifem1/cutover/actions/runs/36735999116) and [run 36753618050](https://github.com/Ifem1/cutover/actions/runs/36753618050) checked the prior deployment at `0xB8B2157c9d4f19c66e241178A63A89B13EAB3237`, source SHA-256 `34018863567489cea352be045f16f6308b0a5c0ef8af668ad84551e10cf75834`. Their successful gate assertions do not count as revised-source gate evidence.

It signs nothing, stores no private key and cannot authorize or bypass CUTOVER.
