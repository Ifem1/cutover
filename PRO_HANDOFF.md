# CUTOVER — audit and release handoff

## Repository and exact source

- Repository: [Ifem1/cutover](https://github.com/Ifem1/cutover)
- Branch: `main`
- Network: GenLayer Studionet, chain ID `61999`
- Canonical frontend: [https://cutover-kappa.vercel.app/](https://cutover-kappa.vercel.app/)
- Revised contract SHA-256: `13bfc90c1c2aad4ae09c591dbc72af1c063f43e0c71640e70c521b66ed867c79`
- Revised contract deployment: **not deployed; waiting at the human wallet-signature boundary**

## Revised-source offline validation

The exact revised source passed **111/111 Direct Mode tests**, **73/73 meaningful contract mutants**, **73/73 frontend tests**, **20/20 frontend mutants**, and **7/7 gate tests**. Frontend lint and typecheck, web/fixture/gate production builds, Python compile, contract-surface parity, repository integrity, network discipline, pinned GenVM lint/validation, and the **118-entry handoff archive content audit** passed locally. All jobs passed for source commit `df47e9e1728a51afe51d8d6a25e0efbd29204741` in [GitHub Actions run 36753618050](https://github.com/Ifem1/cutover/actions/runs/36753618050). Its live-gate job still read the historical contract, so it is not revised-source live proof. The complete local run is recorded in [`proof/matrix.json`](proof/matrix.json).

## Live-evidence boundary

The address `0xB8B2157c9d4f19c66e241178A63A89B13EAB3237`, its deployment/source match, migrations, adversarial outcomes, browser observations and GitHub live-gate run all belong to historical source SHA-256 `34018863567489cea352be045f16f6308b0a5c0ef8af668ad84551e10cf75834`. Preserve those records. They do not verify or prove the revised source. The current wallet/manual browser checklist is [`docs/MANUAL_QA_RUNBOOK.md`](docs/MANUAL_QA_RUNBOOK.md); all its rows are NOT RUN for the revised contract/frontend pair.

## Remaining release sequence

1. Source commit `df47e9e1728a51afe51d8d6a25e0efbd29204741` is pushed to `main`; clean packaging passed and every job in [GitHub Actions run 36753618050](https://github.com/Ifem1/cutover/actions/runs/36753618050) succeeded. The live-gate job exercised the historical contract only.
2. Before any revised-contract deployment, review the final commit, contract SHA-256, Studionet chain ID `61999`, and command documented in [`docs/TOOLCHAIN.md`](docs/TOOLCHAIN.md). Deployment requires the operator's wallet signature; stop until that approval is supplied.
3. After approval, record deployment hash/address, accepted and finalized status, execution result, `get_config()`, and retrieved source equality. Stop if exact source equality fails.
4. Configure the revised address on the canonical frontend and execute the live positive, negative, challenge, inconclusive/failure, live gate, and manual browser cases in [`docs/LIVE_PROOF_PLAN.md`](docs/LIVE_PROOF_PLAN.md) and [`docs/MANUAL_QA_RUNBOOK.md`](docs/MANUAL_QA_RUNBOOK.md). Save only observed transaction and browser evidence as versioned records.
5. Perform the hostile re-audit and update the proof matrix without overwriting historical evidence.

No deployment, live revised-source cycle, revised-source gate proof, or revised-pair wallet QA is claimed complete in this handoff.
