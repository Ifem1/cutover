# Testing

CUTOVER separates deterministic invariant tests, Direct Mode contract tests, frontend behavior tests, integration/gate tests and mutation sweeps.

## GenLayer Direct Mode

`tests/direct/test_cutover_direct.py` deploys the real Intelligent Contract with stable `genlayer-test` mocks. It covers migration/owner/route guards, digest mismatch, baseline source failure, frozen-baseline immutability, candidate generations, structured observe→compare assessment, all blocking and uncertain outcomes, stale assessment invalidation, malformed observations, hostile prompt-injection text, validator disagreement replay, bounded challenge/reassessment, transaction-time review deadlines, exact-ref authorization, cancellation and bounded views.

Direct Mode is offline evidence. The complete result must be read from a successful run because parametrized tests affect the executed count. It does not substitute for real Studionet validators.

## Frontend

Vitest covers the action policy, network/config invariants, contract-surface parity and write arity, injected-wallet-safe defaults, and transaction phases. The frontend mutation job performs real temporary policy mutations. `scripts/contract_mutation.py` mutates `contracts/cutover.py` itself, requires a passing full Direct Mode control run, and reports exact killed/total counts.

## GitHub gate

The gate suite verifies current `AUTHORIZED` state, current generation, exact current candidate ref, caller `expected_candidate_ref`, and Studionet identity. It performs no writes and requires no private key.

## CI integrity

CI runs Python compile checks, AST contract-surface parity, repository/network/security integrity, exact stable Python pins, GenVM lint, Direct Mode, contract mutants, ESLint, TypeScript, Vitest, frontend mutants, production builds, gate build/tests, and packaging. Counts/statuses are reported only from the actual final GitHub Actions run.
