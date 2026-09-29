# GitHub gate

`packages/gate` is a read-only deployment consumer. Inputs are contract address, migration ID, expected candidate ref and optional chain ID fixed to 61999 by default.

It reads **finalized** migration and authorization records and fails unless:
- state is `AUTHORIZED`;
- authorization generation equals the current candidate generation;
- assessed generation is current;
- authorization ref equals the current candidate ref;
- authorization ref exactly equals the caller's expected ref.

The action uses GitHub's Node 24 JavaScript-action runtime and `@vercel/ncc` to produce a self-contained `dist/index.js` bundle. The distributable bundle is committed with the repository so consumers do not need to install CUTOVER's dependencies at action runtime.

It signs nothing, stores no private key and cannot authorize or bypass CUTOVER.
