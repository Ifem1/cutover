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

The active source-verified contract is `0x60FD8fC7012f3b5B42A79B868ecd23451cccf2D4` on Studionet 61999. Migration 1 is `AUTHORIZED` for exact candidate ref `assurance-fixture-preserved-20261015`; migration 2 is `DRAFT` for the non-AUTHORIZED negative case. The active assertions passed in [run 38901682370](https://github.com/Ifem1/cutover/actions/runs/38901682370), [live-gate job 116975585789](https://github.com/Ifem1/cutover/actions/runs/38901682370/job/116975585789). Prior gate runs are historical evidence only.

Historical gate evidence is retained: [run 36735999116](https://github.com/Ifem1/cutover/actions/runs/36735999116) and [run 36753618050](https://github.com/Ifem1/cutover/actions/runs/36753618050) checked the prior deployment at `0xB8B2157c9d4f19c66e241178A63A89B13EAB3237`, source SHA-256 `34018863567489cea352be045f16f6308b0a5c0ef8af668ad84551e10cf75834`. Their successful gate assertions do not count as revised-source gate evidence.

It signs nothing, stores no private key and cannot authorize or bypass CUTOVER.
