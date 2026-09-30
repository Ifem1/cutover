# Reproducible toolchain and commands

## Pinned versions

| Tool | Repository/CI version |
|---|---|
| Python | 3.12 (`.github/workflows/ci.yml`); local audit used 3.12.10 |
| Node.js | 22.x (`.nvmrc` and CI); local audit used 24.16.0 |
| Package manager | npm with committed `package-lock.json` (lockfile version 3); use `npm ci` |
| GenLayer CLI | 0.39.1, installed from the root npm lockfile |
| `genlayer-js` | 1.1.8 |
| `genlayer-py` | v0.16.3 |
| `genlayer-test` | v0.29.2 |
| GenVM bundle | v0.2.16, pinned in `tests/direct/conftest.py` and `GENVM_VERSION` for contract lint/validation |
| `genvm-linter` | v0.11.0 |
| pytest | 8.3.5 |

The GenLayer Python pins are in `requirements.txt`; JavaScript versions are in workspace manifests and `package-lock.json`. Node/npm versions printed above are the versions used for the local audit, not substitutes for the CI Node 22.x target. The repository-local CLI script is invoked rather than a global CLI.

## Network and configuration

- Network: `studionet`
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Explorer: `https://explorer-studio.genlayer.com`
- Local Direct Mode default: `http://127.0.0.1:4000/api` (`gltest.config.yaml`)
- Live proof may set `GENLAYER_RPC`; scripts default it to the Studionet RPC and reject any chain other than 61999.
- Wallet signing uses the locally unlocked GenLayer CLI keystore. Do not place private keys in an environment variable, proof plan, or repository file.
- Vercel frontend variable: `NEXT_PUBLIC_CUTOVER_CONTRACT_ADDRESS=0x2A19548ae8A86a6d678890095f9F25eddeC16DD3` (set on the canonical frontend project and redeploy to use the revised source-matched contract).
- Vercel proof-fixture variable: `CUTOVER_CANDIDATE_MANIFEST_JSON` (fixture project only).
- GitHub gate variables: `CUTOVER_CONTRACT_ADDRESS` and `CUTOVER_MIGRATION_ID`.

Studionet, chain ID, RPC and explorer are also pinned in frontend source. Studio-dev / chain 61997 is not a supported runtime target.

## Clean install and offline validation

From the repository root:

```powershell
npm ci
python -m pip install -r requirements.txt
python -m compileall -q contracts tests scripts
python scripts/check_contract_surface.py
python scripts/repository_integrity.py
node scripts/check-network.mjs
$env:GENVM_VERSION='v0.2.16'
genvm-lint check contracts/cutover.py
python -m pytest tests/direct -v
python scripts/contract_mutation.py
npm run lint
npm run typecheck
npm run test:web
npm run mutation:web
npm run test:gate
npm run build
```

The CI workflow additionally runs live-proof schema/offline checks, verifies committed generated gate bundles, builds each workspace, and runs the handoff packaging job. `npm run build` builds the web app, fixture app, and gate. Exact test/mutant counts must be taken from the completed command output or a specific CI run.

## Deployment and source verification

The deployment command is for the exact committed `contracts/cutover.py` after the owner has approved the deployment and the intended CLI-keystore account is unlocked:

```powershell
node node_modules/genlayer/dist/index.js deploy --contract contracts/cutover.py --rpc https://studio.genlayer.com/api
```

The repository's live proof runner is the preferred path for a complete recorded lifecycle; it defaults to dry-run and requires explicit `--execute` to write. After a finalized deployment, retrieve and compare the deployed source using the new address and expected local file:

```powershell
node scripts/live/verify_source.mjs --address 0xNEW_CONTRACT_ADDRESS --source contracts/cutover.py --rpc https://studio.genlayer.com/api
```

That script prints both SHA-256 values and exits nonzero unless exact source bytes match. Do not run a full live plan until the new source is approved, deployed, finalized, and verified.
