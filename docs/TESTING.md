# Testing

Offline tests focus on rules that would create an unsafe authorization if broken: blocking precedence, uncertainty handling, completeness, snapshot identity/bounds, review deadlines, challenge exclusion, generation binding, exact-ref binding, prompt delimiter defence and the GitHub gate.

`tests/unit` exercises the deterministic model without GenVM. `tests/direct` exercises the contract through stable gltest Direct Mode with bounded web/LLM mocks. Frontend tests cover action-policy and network invariants. Gate tests verify exact-ref/current-generation semantics.

CI also runs GenVM lint, TypeScript, ESLint, production builds, mutation sweeps and repository/network integrity checks. Passing counts are reported only from actual executed output.
