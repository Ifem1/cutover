# Live proof tooling

Nothing in this directory fabricates live evidence and nothing runs automatically.

`proof_runner.mjs` is the repeatable executor for the later funded-wallet phase. It refuses any plan/network other than Studionet chain 61999, hashes the exact tracked `contracts/cutover.py`, and defaults to **dry-run**. `--execute` is required before it invokes the pinned repository CLI.

The GenLayer CLI wallet/account must be configured externally; CUTOVER never stores a private key or seed. With `contract_address: null`, the runner deploys the exact tracked contract, parses the real address/transaction from CLI output, waits for ACCEPTED and FINALIZED receipts, and runs `verify_source.py`. If required metadata cannot be parsed or source equality fails, the run stops instead of inventing evidence.

Each planned write then records the real transaction hash plus separate ACCEPTED and FINALIZED receipt output. Read steps use `genlayer call`. Structured output is written only during `--execute` under `artifacts/live/<timestamp>/run.json`.

Workflow for Codex/local funded-wallet execution later:

1. Deploy the fixture app with `CUTOVER_CANDIDATE_MANIFEST_JSON` populated for the exact immutable candidate deployment.
2. Copy `proof/live-plan.example.json` to an ignored/local plan and fill real baseline/candidate URLs and bounded snapshot/manifest digests.
3. `node scripts/live/proof_runner.mjs <plan.json>` to review the dry-run.
4. Configure a funded Studionet account in the official CLI externally.
5. Run the same command with `--execute`.
6. Use the recorded contract address with the repository GitHub Action/gate and preserve both the exact-ref pass and deliberate wrong-ref failure.
7. Update `proof/matrix.json` only from the produced real evidence.

Do not use Studio-dev/61997. Do not paste private keys into plans, repository files, CI variables committed to Git, or proof output.
