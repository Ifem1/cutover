# Live proof tooling

These files prepare the later funded-wallet phase without fabricating evidence.

1. `node scripts/live/check_network.mjs` refuses any RPC whose `eth_chainId` is not 61999.
2. Deploy the **tracked source** with the repository CLI, e.g. `npm exec -- genlayer deploy --contract contracts/cutover.py --rpc https://studio.genlayer.com/api`. Record the real address and deployment transaction from the command output; do not edit proof files with invented values.
3. Deploy `apps/fixtures` publicly and record its immutable deployment reference.
4. Execute the 13 cases in `proof/cases.json`, recording accepted/decision/finalization/execution separately.
5. Run `python scripts/live/verify_source.py --address 0x...` against finalized state. It calls the official `gen_getContractCode` RPC, base64-decodes the deployed source, and requires exact bytes/SHA-256 equality.
6. Update `proof/matrix.json` only with real transaction hashes/explorer evidence.

The scripts never create a wallet or store a private key. Browser writes stay injected-wallet-only; any CLI account configuration is external to the repository.
