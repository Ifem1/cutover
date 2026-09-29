# Frozen toolchain

Target network: `studionet`; chain ID `61999`; currency `GEN`; RPC `https://studio.genlayer.com/api`; explorer `https://explorer-studio.genlayer.com`.

Pinned repository tooling:
- GenLayer CLI `0.39.1`
- `genlayer-js` `1.1.8`
- stable `genlayer-py` v0.18 line
- `genlayer-test` v0.29
- contract dependency header uses the stable py-genlayer artefact used by GenLayer's stable project examples

The separate release-candidate Studio-dev environment uses chain 61997 and matching RC SDK/CLI families. Those values may be mentioned in documentation only to explain the exclusion; they are not runtime paths in CUTOVER.
