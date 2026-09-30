# CUTOVER human browser and wallet QA runbook

Run these checks against the revised contract after it has been deployed, source-verified, and configured on the canonical frontend. The previous browser record applies to the earlier contract source and does not satisfy this runbook. Do not report a row as verified until an operator records the observed result.

## Before starting

- Frontend: <https://cutover-kappa.vercel.app/>
- Expected network: Studionet, chain ID `61999`
- Expected contract: `0x2A19548ae8A86a6d678890095f9F25eddeC16DD3` (not the previous `0xB8B2157c9d4f19c66e241178A63A89B13EAB3237` address)
- Wallet: injected wallet with an account intended for the specific test; do not paste or record private keys.
- Vercel environment: `NEXT_PUBLIC_CUTOVER_CONTRACT_ADDRESS=0x2A19548ae8A86a6d678890095f9F25eddeC16DD3`; deploy the frontend after setting it.
- Use the browser at 100% zoom and record browser size/device. Test only after the canonical frontend points at the revised contract.

## Tests

1. **Load the production frontend.** Open the URL above. Confirm the app renders, shows contract `0x2A19548ae8A86a6d678890095f9F25eddeC16DD3`, and identifies Studionet / `61999`. Confirm migration 1 is `AUTHORIZED` and migrations 2–4 are `INCONCLUSIVE` for this deployment. Confirm no fabricated migration appears when the address is unset or a chain read fails. The earlier deployment's migration 3 `AUTHORIZED` and migration 4 `BLOCKED` do not apply to this new address.

2. **Connect wallet.** Select Connect wallet. Confirm the injected wallet prompt names the expected account and the navbar shows the connected shortened address. Open the wallet menu, verify the full shortened address, copy-address action, network label, explorer/account link where applicable, and Disconnect.

3. **Wrong network and switch back.** Change the wallet to another chain. Confirm the navbar says Wrong network, writes are disabled, and the primary wallet action offers Switch to Studionet. Switch back and confirm writes enable only after chain ID `61999` is observed.

4. **Reject a safe transaction.** Start a harmless test write such as creating a clearly named test migration, then reject it in the wallet. Confirm the UI reports rejection, has no submitted/finalized success state, and no migration was created.

5. **Successful write lifecycle.** Submit one explicitly approved safe test write. Record method and arguments, transaction hash, and observed phases from `awaiting_signature`, `submitted`, `pending`, `consensus_processing`, `accepted`, `finalizing`, `finalized`, and `execution_success`; also verify the relevant rejection, decision-failure, RPC-error, timeout, or execution-failure label when safely reproducible. Confirm accepted alone is never shown as completion.

6. **Refresh while pending.** Submit a safe test write and refresh after its transaction hash appears but before finality. Confirm the same hash and method are restored, choose Resume status tracking, and verify no second wallet prompt or write is created. Confirm a successful result rereads finalized state; RPC error/timeout must keep the same hash available for retry.

7. **Refresh after finalization.** Refresh after a successful write. Confirm the resulting migration/state is recovered from finalized chain reads and the navbar reconnects or accurately reports disconnected state.

8. **Account change.** Change the injected wallet account while the page is open. Confirm the navbar updates, ownership controls change to match the new account, and no stale owner action remains enabled. Confirm ordinary assessment controls are owner-only.

9. **Disconnect and reconnect.** Disconnect from the wallet menu, confirm disconnected state and that protected writes are disabled, then reconnect and verify the same provider/session state updates across the navbar and transaction workflow.

10. **Non-owner challenge.** Using a non-owner wallet, open a challenge on a READY migration during the review window. Confirm the evidence relevance/retrieval step is clear, that challenge prose is described as audit evidence only, and that the write reaches finalized state before the challenge is shown as open.

11. **Responsive/mobile viewport.** Check at a tablet viewport and a narrow mobile viewport. Verify the wallet control stays accessible beside/inside the mobile navigation, forms remain operable, route matrices scroll or wrap intentionally, and no page-level horizontal overflow hides controls.

12. **Keyboard and basic accessibility.** Navigate without a mouse. Verify logical focus order, visible focus, usable labels, buttons/menus operable from keyboard, status changes announced where expected, and focus is not trapped or lost after wallet/transaction dialogs.

13. **Browser console.** Open developer tools and inspect console/network errors during the above flow. Record material errors, failed contract reads, wrong-chain requests, uncaught exceptions, and warnings that affect wallet or finality state.

## Result template

Copy one block for every test and keep hashes/observations free of private wallet data.

```text
Test number and name:
Result: NOT RUN / PASS / FAIL
Frontend URL and build/deployment:
Contract address:
Network and chain ID:
Transaction hash if applicable:
Observed state/phases:
Unexpected behavior:
Screenshot needed: YES / NO
Operator and date:
```

Current status: all 13 rows are **NOT RUN for the revised contract/frontend pair**. The canonical frontend has not yet been deployed with the revised address. Historical observations are preserved in `proof/live/browser-qa.json` and are scoped to the earlier contract source hash; the current visit limitation is in `proof/live/revised-browser-qa.json`.
