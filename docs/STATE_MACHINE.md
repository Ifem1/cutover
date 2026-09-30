# State machine

- **DRAFT** — migration owner may register routes and authenticate/freeze baseline snapshots.
- **BASELINED** — every required route is frozen and the baseline is sealed.
- **CANDIDATE** — exact candidate origin + immutable candidate ref is current. Setting either creates a new candidate generation.
- **BLOCKED** — at least one current-generation route contains a definite consequential failure.
- **INCONCLUSIVE** — no stronger failure exists, but evidence/judgement/completeness is insufficient.
- **READY** — all required current-generation routes are READY. The contract records `ready_at` from GenVM transaction time and derives `review_deadline`.
- **CHALLENGED** — one admitted challenge is open for the current candidate generation; authorization is impossible until reassessment resolves it.
- **AUTHORIZED** — terminal authorization bound to exact candidate origin, candidate ref, candidate generation, baseline generation and route count.
- **CANCELLED** — owner cancellation before authorization; terminal.

## Invalidation rules

`set_candidate` increments `candidate_generation`, clears current aggregate/readiness/deadline/challenge-open state, and sets `assessed_generation=0`. Old assessment keys include their old generation and cannot satisfy current completeness.

A current READY candidate may be challenged only **before** `review_deadline`. Each generation allows at most three admitted attempts total and each route at most two. An admitted challenge must pass independent retrieval and relevance checks; rejected evidence consumes nothing. A READY-preserving reassessment does not permanently close the route. All attempts retain their evidence digests and outcomes. Reassessment includes the current challenge evidence. Authorization requires current READY state, no open challenge, current assessed generation, and transaction time at/after the deadline.

No public API accepts a timestamp for `derive_candidate` or `authorize`; callers cannot advance the review clock by argument. There is no admin force-ready/force-authorize path.
