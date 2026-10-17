# Live proof plan and results

This document separates active assurance proof from retained historical deployments. The active contract is `0x60FD8fC7012f3b5B42A79B868ecd23451cccf2D4` on Studionet (`61999`), with source SHA-256 `ea9d62b76d5009a67ed0aa60237fd2ad9846a5e6fe0944eead78235cca29bd3f`. Deployment and source retrieval match, plus the production Vercel deployment, are documented in [`proof/live/assurance-deployment.json`](../proof/live/assurance-deployment.json). The canonical frontend is [https://cutover-kappa.vercel.app/](https://cutover-kappa.vercel.app/) and is configured for the active address.

## Active assurance live evidence

The active deployment was exercised using a funded Studionet test wallet. Transaction records distinguish ACCEPTED from FINALIZED. The active migration reached AUTHORIZED after its review deadline, then entered a 300-second assurance window.

| Migration | Case | Final observed result |
|---:|---|---|
| 1 | Authenticated baseline, exact manifest/ref/body, semantic assessment, review deadline | `AUTHORIZED` |
| 1 | Bounded post-authorization checkpoint for `pricing` | `VERIFIED` |
| 1 | Assurance finalization after the 300-second window | terminal `VERIFIED` |

All active transaction hashes, final states, digests and checkpoint evidence are in [`proof/live/assurance-live-cases.json`](../proof/live/assurance-live-cases.json) and [`proof/live/assurance-negative-live-cases.json`](../proof/live/assurance-negative-live-cases.json). The active source has independent VERIFIED, DEVIATED and INCONCLUSIVE terminal assurances. Failed checkpoint attempts on earlier deployments remain preserved as no-state-change historical receipts.

## Active-source GitHub gate

The committed CI workflow is now configured for the active deployment. Its intended assertions are:

1. migration 1 with candidate ref `assurance-fixture-preserved-20261015` passes;
2. migration 1 with an incorrect expected ref fails at the exact-ref guard;
3. a non-`AUTHORIZED` migration fails at the authorization-state guard.

The active-source gate passed in [CI run 38899780957](https://github.com/Ifem1/cutover/actions/runs/38899780957), with the [live-gate job](https://github.com/Ifem1/cutover/actions/runs/38899780957/job/116969196725) showing exact-ref PASS, wrong-ref FAIL and DRAFT-state FAIL. Prior-source gate runs remain historical and are not active-source evidence.

## Production frontend and wallet QA

The canonical frontend must be configured in Vercel with:

```text
NEXT_PUBLIC_CUTOVER_CONTRACT_ADDRESS=0x60FD8fC7012f3b5B42A79B868ecd23451cccf2D4
```

Then redeploy the frontend and run [`docs/MANUAL_QA_RUNBOOK.md`](MANUAL_QA_RUNBOOK.md) with a real injected wallet. Active migration 1 is `AUTHORIZED` with a terminal `VERIFIED` assurance. The historical browser reports remain separate.

The active-source GitHub live gate and production frontend deployment are complete. Frontend browser QA, including wallet interaction coverage supplied by the owner, is accepted separately from CLI-wallet contract evidence.

## Historical deployment

The previous contract `0xB8B2157c9d4f19c66e241178A63A89B13EAB3237` with source SHA-256 `34018863567489cea352be045f16f6308b0a5c0ef8af668ad84551e10cf75834`, its old migrations, and its old gate/browser results are retained in the existing versioned proof files. None of those historical outcomes are attributed to the revised contract.
