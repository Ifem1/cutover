# Proof matrix

| Invariant | Boundary | Offline evidence | Mutation/guard | Live case | Live transaction | Status |
|---|---|---|---|---|---|---|
| material change blocks | deterministic | unit test | material-change mutant | 3 | NOT YET RUN | OFFLINE |
| unavailable evidence cannot READY | consensus + deterministic | unit test | fail-closed design | 7 | NOT YET RUN | OFFLINE |
| stale generation cannot authorize | deterministic | unit test | generation mutant + gate | 11/12 | NOT YET RUN | OFFLINE |
| challenge blocks authorization | deterministic | unit test | challenge mutant + UI policy | 10 | NOT YET RUN | OFFLINE |
| review deadline enforced | deterministic | unit test | deadline mutant | 11 | NOT YET RUN | OFFLINE |
| exact candidate ref required | deterministic | unit/gate tests | ref mutant | 12/13 | NOT YET RUN | OFFLINE |
| prompt text cannot close evidence fence | consensus input hardening | unit test | frontend/security docs | 8 | NOT YET RUN | OFFLINE |
| ACCEPTED is not FINALIZED | client lifecycle | code path | transaction state machine | 1 | NOT YET RUN | NEEDS LIVE |
