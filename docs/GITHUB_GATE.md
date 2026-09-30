# GitHub gate

`packages/gate` is a read-only deployment consumer. Inputs are contract address, migration ID, expected candidate ref and optional chain ID fixed to 61999 by default.

It reads **finalized** migration and authorization records and fails unless:
- state is `AUTHORIZED`;
- authorization generation equals the current candidate generation;
- assessed generation is current;
- authorization ref equals the current candidate ref;
- authorization ref exactly equals the caller's expected ref.

The action uses GitHub's Node 24 JavaScript-action runtime and `@vercel/ncc` to produce a self-contained `dist/index.js` bundle.

## Source-repository usage

The repository commits the generated `dist/index.js` and lockfile. CI verifies the bundle against the action source; local consumers can invoke the repository action directly:

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

CUTOVER CI rebuilds the gate and verifies that the committed `packages/gate/dist/index.js` is reproducible from source. The lockfile and bundled action are included in the repository.

It signs nothing, stores no private key and cannot authorize or bypass CUTOVER.
