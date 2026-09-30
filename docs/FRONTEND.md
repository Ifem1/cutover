# Frontend

The Next.js App Router UI is the CUTOVER release-control surface: warm neutral canvas, deep ink, orange operational accent, hot-pink emphasis, yellow attention, route matrices and baseline→candidate relationships rather than a generic crypto/admin dashboard. Status is conveyed in text/shape as well as colour; focus and reduced-motion rules live in the global stylesheet.

Reads use a wallet-free stable `genlayer-js` Studionet client. Writes use an injected EIP-1193 provider only. There is no private-key generation, wallet snap, backend signer or fake-chain fallback.

Until `NEXT_PUBLIC_CUTOVER_CONTRACT_ADDRESS` contains a valid address, chain-backed pages show **Contract not configured yet** rather than fabricated migrations.

## Contract parity and actions

`contracts/surface.json` is the tracked public method schema. `scripts/check_contract_surface.py` AST-checks it against the Python contract, while `apps/web/lib/surface.ts` and Vitest verify every required write name and exact argument count. In particular, `derive_candidate` and `authorize` accept only `migration_id`; review time is contract-derived.

`ActionConsole` makes every public write reachable with explicit connect/disconnect controls, a chain-61999 guard, exact-arity checking, state/account-aware enablement and finalized post-state re-read. Ordinary route assessments are owner-only in the guided UI, matching the contract's retry-griefing protection. The migration register, control room, route evidence and verifier all read finalized contract state; they do not substitute demo objects once a contract address is configured.

## Transaction semantics

The UI reports distinct `awaiting_signature`, `signature_rejected`, `submission_error`, `submitted`, `pending`, `consensus_processing`, `accepted`, `finalizing`, `finalized`, `decision_failure`, `execution_success`, `execution_failure`, `rpc_error`, and `timeout` phases. It polls transaction status through `genlayer-js`; `ACCEPTED` remains non-final, while `FINALIZED` is followed by an execution-result check and a `LATEST_FINAL` contract-state reread, including after finalized execution failure. Once a hash is returned, the tab stores its public hash, method and migration ID in session storage. After refresh the operator can resume status tracking for that same transaction; it does not resubmit the write. Tracking stops after five minutes with a retry action if the RPC is unavailable or finality has not arrived. Terminal decision/execution outcomes clear the pending record after any required state reread succeeds.

Challenge UX distinguishes relevance from authority: evidence is retained for audit and opens a bounded fresh candidate assessment; its prose does not decide the verdict. Responsive matrices use bounded scrolling/wrapping for long URLs, hashes, candidate refs and route names. Historical Chrome checks confirmed navbar connect/disconnect, the connected-wallet menu, refresh recovery on migration 4, migration 3 `AUTHORIZED`, migration 4 `BLOCKED`, and a finalized explorer transaction; see [`proof/live/browser-qa.json`](../proof/live/browser-qa.json). Those browser observations apply to the prior deployed contract/source. Account changes and wrong-network switching were not tested because the permitted browser controls could not operate the wallet extension UI. Tablet/mobile device QA is not part of that proof record. The canonical frontend still needs `NEXT_PUBLIC_CUTOVER_CONTRACT_ADDRESS=0x2A19548ae8A86a6d678890095f9F25eddeC16DD3` and a fresh deployment before revised-contract GUI QA; see [`proof/live/revised-browser-qa.json`](../proof/live/revised-browser-qa.json).
