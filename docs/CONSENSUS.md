# Consensus design

`freeze_route` and `assess_route` are the consequential nondeterministic writes. Each uses stable GenLayer nondeterministic execution: a leader performs the evidence work and validators independently repeat it. Validators compare consequential structured fields rather than accepting arbitrary prose.

Baseline freeze independently renders the public baseline and checks whether the proposed bounded snapshot is faithful. Candidate assessment renders the candidate and asks only for per-rule statuses from a closed enum. Source failure yields `INCONCLUSIVE`; malformed findings cannot become READY.

Website text is fenced as untrusted data and closing delimiters/backticks are defused. This reduces prompt-injection authority but does not prove every model is immune to adversarial text.

Limitations remain: validators can receive personalized content, pages can mutate during a round, render engines can differ, and model/provider failures can be correlated. CUTOVER fails closed on disagreement/unavailability rather than claiming those risks disappear.
