# Frozen toolchain

Target network: `studionet`; chain ID `61999`; currency `GEN`; RPC `https://studio.genlayer.com/api`; explorer `https://explorer-studio.genlayer.com`.

Pinned repository tooling:
- GenLayer CLI `0.39.1`
- `genlayer-js` `1.1.8`
- `genlayer-py` `v0.16.3`, the newest stable release satisfying `genlayer-test v0.29.2`'s declared `<0.17` compatibility
- `genlayer-test` `v0.29.2`, the latest non-prerelease 0.29 release
- `genvm-linter` `v0.11.0`, the latest non-prerelease linter release\n- Direct Mode GenVM bundle `v0.2.16` (exact pin; stable release with the `genvm-universal.tar.xz` layout required by `genlayer-test v0.29.2`)
- contract dependency header uses the stable py-genlayer artefact used by GenLayer's stable project examples

`genlayer-py v0.18.0` is a stable client release but is not used in the offline test environment because `genlayer-test v0.29.2` declares `genlayer-py>=0.13,<0.17`. The September 2026 `genlayer-test v0.30.0-rc.*` and `genvm-linter v0.11.1-rc.*` releases are intentionally excluded. The separate release-candidate Studio-dev environment uses chain 61997 and matching RC SDK/CLI families. Those values may be mentioned in documentation only to explain the exclusion; they are not runtime paths in CUTOVER.

The repository package scripts invoke the local `genlayer` dependency, so a globally installed CLI cannot silently replace the pinned `0.39.1` binary.

Direct Mode does not follow the GenVM `/latest` redirect. Stable `genlayer-test v0.29.2` still expects `genvm-universal.tar.xz`, while the June v0.3.0-rc* GenVM releases renamed the runner archive to `genvm-runners-all.tar.xz`. CUTOVER therefore pins `v0.2.16`, the stable March 10 release immediately preceding the official boilerplate's March 11 runner-hash pin, rather than silently depending on the renamed RC-family asset.
