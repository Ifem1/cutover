# CUTOVER — ChatGPT Pro handoff

## Repository

- Target repository: `Ifem1/cutover`
- Branch: `main`
- Network: stable Studionet only (chain `61999`)
- Source state: complete offline implementation; exact final commit and CI run are filled in the final report after GitHub Actions validation.

## Implemented in this phase

- single CUTOVER Intelligent Contract with frozen baseline provenance, candidate generations, two-stage semantic assessment, deterministic aggregation, bounded challenge and exact-ref authorization;
- complete Next.js control-room frontend with injected-wallet-only writes, finalized reads, state-aware actions and explicit transaction lifecycle;
- deterministic proof fixture lab covering preservation, cosmetic change, pricing change, redirect mismatch, missing legal content, broken journey, prompt injection and unavailable source;
- read-only GitHub deployment gate;
- Direct Mode tests, state-machine/invariant coverage, contract mutation sweep, frontend tests and frontend mutation sweep;
- repository/network/schema integrity checks;
- CI and source packaging;
- architecture, consensus, baseline, security, testing, frontend, gate and live-proof documentation.

## Validation status

Do not infer a pass from this handoff file. The final ChatGPT report records the exact completed GitHub Actions jobs and counts. Live rows in `proof/matrix.json` remain `NOT YET RUN` until real Studionet evidence exists.

## Remaining local/live work

1. Clone/unzip and independently reproduce green offline checks.
2. Connect/use a funded wallet/account appropriate for stable Studionet 61999.
3. Deploy the exact tracked `contracts/cutover.py` source with repository-local CLI 0.39.1.
4. Record the real deployment transaction and contract address.
5. Fetch deployed source back where supported and compare exact bytes/SHA-256 using `scripts/live/verify_source.py`.
6. Populate the single canonical deployment environment/config; do not duplicate the address in source.
7. Deploy `apps/fixtures` publicly and record its immutable deployment reference.
8. Deploy the CUTOVER frontend with the canonical contract address.
9. Execute live proof cases 1–13 from `docs/LIVE_PROOF_PLAN.md`; record accepted/decision/finalization/execution separately.
10. Exercise the real challenge/finality path and collect real validator/disagreement evidence where feasible.
11. Verify every UI write against the deployed schema and perform real injected-wallet QA, wrong-network switching, refresh/recovery and responsive/browser checks.
12. Run the CUTOVER GitHub gate against a real `AUTHORIZED` exact candidate ref and preserve both pass and deliberate wrong-ref failure runs.
13. Measure fees/consensus behavior only if actually observable; never invent measurements.
14. Update `proof/matrix.json` / `docs/PROOF_MATRIX.md` with real transaction hashes and evidence.
15. Perform a hostile final audit before submission.

No ordinary implementation task is intentionally deferred here; the remaining list is deployment/environment/live-proof work.
