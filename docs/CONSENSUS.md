# Consensus design

CUTOVER uses GenLayer only for questions that require interpretation. Deterministic Python owns identities, hashes, bounds, generations, route completeness, precedence, challenge limits, transaction-time deadlines, and authorization.

## Baseline authentication

`freeze_route` independently renders the public baseline inside leader and validator execution. The proposed snapshot and rendered page are fenced as untrusted data. Consequential consensus fields are `ok`, `code`, and the baseline digest; explanatory text is not consensus-critical.

## Candidate assessment: observe, then compare

`assess_route` is intentionally two-stage inside each leader/validator execution:

1. **Observe** — independently render the candidate and extract an exact bounded observation schema: title, canonical URL, headings, visible text, links, forms, and claims. The observation prompt does not receive the baseline and is told not to decide readiness.
2. **Compare** — supply the authenticated frozen baseline, route rules/allowed changes, exact candidate identity/generation, the candidate observation, and matching bounded challenge evidence if one is open. The model must emit exactly one closed-enum finding per rule.

Allowed statuses are `PRESERVED`, `ALLOWED_CHANGE`, `MATERIAL_CHANGE`, `MISSING`, `BROKEN`, `CONFLICTING`, and `UNREADABLE`. Models never answer whether the migration should be authorized.

The validator reruns the consequential work and compares generation, route, candidate ref, baseline digest, evidence availability, route consequence, and the rule/status signature. Free-form reason wording is deliberately non-critical.

## Fail closed

A candidate source failure or malformed observation becomes `INCONCLUSIVE`. Malformed findings become `INCONCLUSIVE`. A definite blocking status retains precedence over uncertainty. Validator disagreement rejects the nondeterministic write.

Prompt-injection controls—explicit data fencing, closing-delimiter defusing, text bounds, exact JSON schemas, enum validation, and output bounds—reduce authority of hostile page text but cannot prove that every model/provider is immune to adversarial content.
