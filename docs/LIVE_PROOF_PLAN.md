# Live proof plan and results

The deployment and all recorded cases below are historical: contract `0xB8B2157c9d4f19c66e241178A63A89B13EAB3237` on Studionet 61999 has source SHA-256 `34018863567489cea352be045f16f6308b0a5c0ef8af668ad84551e10cf75834`; see [`proof/live/deployment.json`](../proof/live/deployment.json). The revised contract currently hashes to `13bfc90c1c2aad4ae09c591dbc72af1c063f43e0c71640e70c521b66ed867c79` and is not deployed. None of the historical cycles prove the revised source. The canonical frontend is [https://cutover-kappa.vercel.app/](https://cutover-kappa.vercel.app/). Historical positive/negative cases preserve their original fixture URLs; future revised-source adversarial checks may use the isolated fixture origin [`https://cutover-live-proof-20260930.vercel.app`](https://cutover-live-proof-20260930.vercel.app/).

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
12–13. Historical proof: the committed GitHub workflow ran against Studionet in [successful full CI run 36735999116](https://github.com/Ifem1/cutover/actions/runs/36735999116). Exact migration 3 candidate ref passed; the wrong ref failed at the exact-ref guard; migration 4 failed at the `BLOCKED` state guard. The [live-gate-proof job](https://github.com/Ifem1/cutover/actions/runs/36735999116/job/109958145534) passed its assertions. Those results apply to source SHA-256 `34018863567489cea352be045f16f6308b0a5c0ef8af668ad84551e10cf75834`; repeat the full gate proof against an AUTHORIZED migration created by the revised contract after approval and redeployment.

Migration 6 also records a live manifest ref mismatch and a live body SHA mismatch; both finalized assessments were `INCONCLUSIVE`. The challenge-lock authorization receipt finalized with execution `ERROR` and rollback payload `candidate not ready`; the migration remained `CHALLENGED` with `challenge_open=true`. The guard-order detail is stated explicitly in [`proof/live/adversarial-cases.json`](../proof/live/adversarial-cases.json).

Historical injected-wallet checks confirmed connect/disconnect, the wallet menu, correct-chain state, refresh recovery, migration 3/4 views and a finalized explorer transaction. Account change, wrong-network display and switching to 61999 were not tested because the browser policy blocked access to wallet extension controls. See [`proof/live/browser-qa.json`](../proof/live/browser-qa.json). Historical workflow run 36735999116 was green, but it predates the revised source and is not the final audit CI run. Do not describe CUTOVER as submission-ready until revised-source deployment, live proof, fresh browser/wallet QA and the final pushed-source CI run are complete.
