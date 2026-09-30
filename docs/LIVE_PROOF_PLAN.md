# Live proof plan and results

The deployed contract is source-verified on Studionet 61999; see [`proof/live/deployment.json`](../proof/live/deployment.json). The canonical frontend is [https://cutover-kappa.vercel.app/](https://cutover-kappa.vercel.app/). Historical positive/negative cases preserve their original fixture URLs; new adversarial checks use the isolated fixture origin [`https://cutover-live-proof-20260930.vercel.app`](https://cutover-live-proof-20260930.vercel.app/).

Recorded live results:

1. Migration 3: exact and cosmetic routes `READY`, resolved challenge, review deadline passed, final state `AUTHORIZED`.
2. Migration 3: cosmetic redesign preserved the relevant meaning and was `READY`.
3. Migration 4: pricing change `BLOCKED`.
4. Migration 4: unrelated destination was left `NOT ASSESSED` after validator disagreement; it was not described as `BLOCKED`.
5. Migration 4: missing legal text `BLOCKED`.
6. Migration 4: missing signup form `BLOCKED`.
7. Migration 5: candidate endpoint returned HTTP 503; route and migration were `INCONCLUSIVE`.
8. Migration 4: prompt-injection fixture `BLOCKED`.
9. Migration 4: unrelated-route validator disagreement did not create `READY`.
10. Migration 3's independent challenge was resolved and re-derived; migration 7's relevant challenge remains open in `CHALLENGED` state after a single rejected authorization attempt.
11. Migration 3 was authorized after its review deadline.
12–13. The committed GitHub workflow ran against Studionet in [successful full CI run 36735999116](https://github.com/Ifem1/cutover/actions/runs/36735999116). Exact migration 3 candidate ref passed; the wrong ref failed at the exact-ref guard; migration 4 failed at the `BLOCKED` state guard. The [live-gate-proof job](https://github.com/Ifem1/cutover/actions/runs/36735999116/job/109958145534) preserved both expected failure annotations and passed its assertions.

Migration 6 also records a live manifest ref mismatch and a live body SHA mismatch; both finalized assessments were `INCONCLUSIVE`. The challenge-lock authorization receipt finalized with execution `ERROR` and rollback payload `candidate not ready`; the migration remained `CHALLENGED` with `challenge_open=true`. The guard-order detail is stated explicitly in [`proof/live/adversarial-cases.json`](../proof/live/adversarial-cases.json).

Injected-wallet checks confirmed connect/disconnect, the wallet menu, correct-chain state, refresh recovery, migration 3/4 views and a finalized explorer transaction. Account change, wrong-network display and switching to 61999 were not tested because the browser policy blocked access to wallet extension controls. See [`proof/live/browser-qa.json`](../proof/live/browser-qa.json). The current workflow run was all-green, but CUTOVER must not be described as submission-ready while those wallet cases remain incomplete.
