# Proof matrix

The machine-readable source of truth is `proof/matrix.json`. Live transaction fields remain exactly **NOT YET RUN** until real Studionet evidence exists.

| Invariant | Boundary | Offline evidence | Mutation / guard | Live case | Live transaction | Status |
|---|---|---|---|---:|---|---|
| frozen baseline digest mismatch fails closed | deterministic + consensus | Direct Mode digest and freeze tests | integrity guards | 1 | NOT YET RUN | OFFLINE COVERED |
| definite material failure blocks | deterministic | unit + Direct Mode | `material_change_passes` | 3–6 | NOT YET RUN | OFFLINE COVERED |
| unavailable evidence cannot READY | consensus + deterministic | Direct Mode unavailable-source test | `source_failure_passes` | 7 | NOT YET RUN | OFFLINE COVERED |
| every current-generation route is required | deterministic | stale/new-generation Direct Mode test | `missing_route_assessment_passes` | 1 | NOT YET RUN | OFFLINE COVERED |
| candidate change invalidates stale assessment | deterministic | Direct Mode generation test | `ignore_generation` | 13 | NOT YET RUN | OFFLINE COVERED |
| challenge blocks authorization; one per generation | deterministic + consensus | Direct Mode challenge lifecycle | challenge mutants + UI policy | 10 | NOT YET RUN | OFFLINE COVERED |
| review deadline cannot be caller-forged | deterministic runtime context | Direct Mode warp + schema arity test | deadline mutants | 11 | NOT YET RUN | OFFLINE COVERED |
| exact candidate ref is authorization/gate identity | deterministic + gate | unit + gate tests | `ignore_ref` | 12/13 | NOT YET RUN | OFFLINE COVERED |
| prompt injection cannot redefine task | consensus hardening | hostile Direct Mode fixture + fence test | strict schema/fencing | 8 | NOT YET RUN | OFFLINE COVERED |
| validator disagreement is rejected | consensus | Direct Mode validator replay | independent validator replay | 9 | NOT YET RUN | OFFLINE COVERED |
| ACCEPTED is not FINALIZED | client lifecycle | transaction lifecycle unit tests | explicit phase assertions | 1 | NOT YET RUN | OFFLINE COVERED; LIVE FINALITY NOT YET RUN |
| wrong network cannot write | configuration + UI | config/policy/integrity tests | wrong-network frontend mutant | 1 | NOT YET RUN | OFFLINE COVERED |
