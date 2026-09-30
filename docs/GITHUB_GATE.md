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

CUTOVER CI rebuilds the gate and verifies that the committed `packages/gate/dist/index.js` and `packages/gate/dist/338.index.js` are reproducible from source. The live-gate proof job read historical migration 3 using its exact authorized candidate ref, then asserted that a wrong ref and migration 4's `BLOCKED` state fail for the expected guard reasons. That proof passed in [full CI run 36735999116](https://github.com/Ifem1/cutover/actions/runs/36735999116), with the [live-gate-proof job](https://github.com/Ifem1/cutover/actions/runs/36735999116/job/109958145534) passing all three assertions. It applies to the contract source SHA recorded in `proof/live/deployment.json` (`34018863567489cea352be045f16f6308b0a5c0ef8af668ad84551e10cf75834`), not the revised source in this audit. Repeat the live proof after the revised source is deployed, source-verified and authorized through its own cycle.

The revised-source audit commit `df47e9e1728a51afe51d8d6a25e0efbd29204741` passed every CI job in [run 36753618050](https://github.com/Ifem1/cutover/actions/runs/36753618050). Its live-gate job repeated those three actual checks against the same historical migration 3/4 records; this confirms workflow behavior, not the revised contract's live state.

It signs nothing, stores no private key and cannot authorize or bypass CUTOVER.
