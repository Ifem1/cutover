# Live proof tooling

All live scripts are pinned to Studionet chain 61999 and use the repository-local GenLayer CLI 0.39.1 / `genlayer-js` 1.1.8. They refuse a different chain or tool version. Wallets stay in the local GenLayer CLI keystore and OS keychain; never put a private key in a plan or environment variable.

## Fixture deployment and manifest

Deploy `apps/fixtures` as a Vercel project. The proof pages are raw deterministic route-handler responses so Next build IDs do not enter the candidate-body digest. The `/.well-known/cutover.json` endpoint returns 503 until its manifest variable is set.

After the first fixture deployment, generate the manifest from fetched public response bytes. Repeat one `--route route_id=/path` per route that will be registered in the migration:

```powershell
node scripts/live/build_manifest.mjs --origin https://YOUR-FIXTURE.vercel.app --release-ref DEPLOYED_GIT_COMMIT_SHA --route pricing=/cases/preserved
```

The script fetches every page twice, refuses redirects or changing bytes, hashes the actual body, and prints the exact `CUTOVER_CANDIDATE_MANIFEST_JSON` value and canonical manifest digest. Set that value in the fixture project's Vercel environment, redeploy, then verify the published manifest and page digests:

```powershell
node scripts/live/build_manifest.mjs --verify --origin https://YOUR-FIXTURE.vercel.app --expected-release-ref DEPLOYED_GIT_COMMIT_SHA
```

For an authenticated baseline snapshot, use `/api/snapshot/<fixture>?route_id=<registered-id>&captured_at=<real-ISO-timestamp>` as both the snapshot URL and public artifact URL. It returns the contract's exact `cutover.baseline.v1` schema. The capture timestamp must be supplied by the live run; the endpoint does not invent one.

## Contract deployment and execution

`proof_runner.mjs` defaults to dry-run. It invokes `node_modules/genlayer/dist/index.js` directly, checks CLI 0.39.1, chain 61999 and the tracked contract SHA, and captures submitted CLI output plus ACCEPTED and FINALIZED receipts. It records consensus votes and leader execution separately, and refuses to call a write successful unless finalized status, majority agreement and leader execution success are all present. `verify_source.mjs` fetches the code through the pinned SDK after finalization and compares exact bytes.

The current `proof/live-plan.example.json` is only a schema/example smoke plan; it does not run the hostile live scenarios. A real plan must use the final fixture origin, fetched manifest digest and snapshot artifacts. `artifacts/live/` raw captures are local and ignored; reviewed summaries belong in `proof/live/`.

## Vercel environment

- `apps/web`: `NEXT_PUBLIC_CUTOVER_CONTRACT_ADDRESS` = the deployed contract address.
- `apps/fixtures`: `CUTOVER_CANDIDATE_MANIFEST_JSON` = the generated one-line manifest JSON.

Studionet, chain ID, RPC and explorer are pinned in frontend source. No fixture or fake-chain fallback is used.
