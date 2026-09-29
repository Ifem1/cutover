# Frozen toolchain

Target network: `studionet`; chain ID `61999`; currency `GEN`; RPC `https://studio.genlayer.com/api`; explorer `https://explorer-studio.genlayer.com`.

Pinned repository tooling:
- GenLayer CLI `0.39.1`
- `genlayer-js` `1.1.8`
- `genlayer-py` `v0.16.3`, the newest stable release satisfying `genlayer-test v0.29.2`'s declared `<0.17` compatibility
- `genlayer-test` `v0.29.2`, the latest non-prerelease 0.29 release
- `genvm-linter` `v0.11.0`, the latest non-prerelease linter release
- contract dependency header uses the stable py-genlayer artefact used by GenLayer's stable project examples

`genlayer-py v0.18.0` is a stable client release but is not used in the offline test environment because `genlayer-test v0.29.2` declares `genlayer-py>=0.13,<0.17`. The September 2026 `genlayer-test v0.30.0-rc.*` and `genvm-linter v0.11.1-rc.*` releases are intentionally excluded. The separate release-candidate Studio-dev environment uses chain 61997 and matching RC SDK/CLI families. Those values may be mentioned in documentation only to explain the exclusion; they are not runtime paths in CUTOVER.

The repository package scripts invoke the local `genlayer` dependency, so a globally installed CLI cannot silently replace the pinned `0.39.1` binary.
