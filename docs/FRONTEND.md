# Frontend

The Next.js App Router UI is the CUTOVER release-control surface: warm neutral canvas, deep ink, orange operational accent, hot-pink emphasis, yellow attention, route matrices and baseline→candidate relationships rather than a generic crypto/admin dashboard. Status is conveyed in text/shape as well as colour; focus and reduced-motion rules live in the global stylesheet.

Reads use a wallet-free stable `genlayer-js` Studionet client. Writes use an injected EIP-1193 provider only. There is no private-key generation, wallet snap, backend signer or fake-chain fallback.

Until `NEXT_PUBLIC_CUTOVER_CONTRACT_ADDRESS` contains a valid address, chain-backed pages show **Contract not configured yet** rather than fabricated migrations.

## Contract parity and actions

`contracts/surface.json` is the tracked public method schema. `scripts/check_contract_surface.py` AST-checks it against the Python contract, while `apps/web/lib/surface.ts` and Vitest verify every required write name and exact argument count. In particular, `derive_candidate` and `authorize` accept only `migration_id`; review time is contract-derived.

`ActionConsole` makes every public write reachable with explicit connect/disconnect controls, a chain-61999 guard, exact-arity checking, state/account-aware enablement and finalized post-state re-read. The migration register, control room, route evidence and verifier all read finalized contract state; they do not substitute demo objects once a contract address is configured.

## Transaction semantics

The UI reports `awaiting_signature → submitted → accepted → finalizing → finalized → execution_success|execution_failure`. `accepted` is never treated as completion. A failed decision stops before finalization; a finalized execution failure remains a failure.

Responsive matrices use bounded scrolling/wrapping for long URLs, hashes, candidate refs and route names. Real browser-wallet, refresh/recovery and device QA remain live-phase work rather than fabricated evidence.
