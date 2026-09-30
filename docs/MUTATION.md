# Mutation testing

CUTOVER mutation testing targets the real implementation paths that could turn a bad migration into an accepted one. Equivalent/noise mutations are excluded rather than used to inflate the score.

## Actual contract mutation sweep

`scripts/contract_mutation.py` mutates **`contracts/cutover.py` itself**. Before any mutant is accepted, the harness runs the complete unmodified Direct Mode suite as a mandatory control. Each mutant is written to a fresh temporary contract file, compiled, then exercised by the Direct Mode test that proves the changed invariant. The job fails if:

- the unmodified control suite fails;
- a mutation source pattern disappears or becomes ambiguous;
- a generated mutant is syntactically invalid; or
- a meaningful mutant survives its targeted Direct Mode test.

The current sweep defines **73 actual-contract mutants** covering route/rule bounds, ownership, same-origin routing, snapshot schema and authenticated artefacts, baseline-source availability and probe binding, candidate manifest identity and response-body digests, candidate-generation binding, immutable assessment attempts, retry limits, blocking/uncertain semantic outcomes, validator disagreement, READY aggregation, review-window stability, anti-self-challenge and anti-griefing rules, per-route and per-generation challenge bounds, verified challenge evidence and exact evidence-text binding, authorization timing/evidence roots, candidate-probe revalidation, terminal states, event-ring retention, owner pagination, and assessment-history pagination. The completed local run against the revised source passed the full unmodified Direct Mode control at **111/111** and killed **73/73** meaningful mutants. The earlier 92/92 and 65/65 counts belong to the previous source and are historical only. CI is run for the pushed final commit.

The three final gaps found by the hostile audit were closed explicitly:
- the snapshot HTTP-status mutant is isolated from unrelated baseline-source failure;
- an equivalent uncertainty mutant was replaced with a behavioral mutant that incorrectly treats uncertain findings as passing; and
- the READY aggregation mutant is tested through `derive_candidate`, not only the per-route assessment.

## Frontend workflow mutation sweep

`mutations/frontend/run.mjs` performs real source mutations across the frontend policy/workflow surface and runs the real Vitest tests for every mutant. The latest local run passed its unmodified control and killed **20/20** mutants. The suite covers, among other cases, challenge-on-wrong-network, non-owner cancellation, premature/stale authorization, challenged authorization, late/repeated challenge behavior, and terminal-state restrictions.

A mutant counts as killed only when the normal product test fails under the mutated source. The original file is restored after each attempt.

## CI acceptance

The handoff package job depends on both mutation jobs. A ZIP cannot be produced from a run in which either the actual-contract mutation sweep or frontend mutation sweep fails.
