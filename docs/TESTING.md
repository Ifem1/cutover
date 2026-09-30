# Testing

CUTOVER separates deterministic invariant tests, Direct Mode contract tests, frontend behavior tests, integration/gate tests and mutation sweeps.

## GenLayer Direct Mode

`tests/direct/test_cutover_direct.py` deploys the real Intelligent Contract with stable `genlayer-test` mocks. It covers migration/owner/route guards, digest mismatch, baseline source failure, frozen-baseline immutability, candidate generations, structured observe→compare assessment, blocking and uncertain outcomes, stale assessment invalidation, malformed observations, hostile prompt-injection text, validator disagreement replay, bounded challenge/reassessment, transaction-time review deadlines, exact-ref authorization, cancellation and bounded views. The leader-substitution cases use Direct Mode's `run_validator(leader_result=...)` hook against the actual captured validator closures to alter manifest, baseline probe, challenge text and assessment payloads while preserving digest claims, including JSON boolean/integer type changes. No separate test model stands in for the contract.

Challenge prose is tested as audit-only input: the semantic reassessment mock refuses to match if the original challenge text appears in its prompt. A paired assessment test changes bounded display explanations and checks that the assessment and authorization evidence commitments stay unchanged. Ordinary retry griefing is tested with a non-owner caller and with the UI's disabled owner-only action.

Direct Mode is offline evidence. The complete result must be read from a successful run because parametrized tests affect the executed count. It does not substitute for real Studionet validators.

## Frontend

Vitest covers the action policy, network/config invariants, contract-surface parity and write arity, injected-wallet-safe defaults, and transaction lifecycle/recovery. `apps/web/lib/tx.ts` polls real GenLayer transaction records and distinguishes a returned submission hash, consensus states, `ACCEPTED`, `FINALIZED`, execution outcomes, RPC errors, and timeouts. `ContractSubmit` preserves the public transaction hash in tab session storage, can resume status tracking after refresh without resubmitting, and rereads `LATEST_FINAL` state after finalization including execution failure. The current local frontend suite passed **73/73** tests; gate tests passed **7/7**. The frontend mutation sweep passed its unmodified control and killed **20/20** mutants. `scripts/contract_mutation.py` mutates `contracts/cutover.py` itself, requires a passing full Direct Mode control run, and in the current revised-source run passed **111/111** Direct Mode tests and killed **73/73** actual-contract mutants.

## GitHub gate

The gate suite verifies current `AUTHORIZED` state, current generation, exact current candidate ref, caller `expected_candidate_ref`, and Studionet identity. It performs no writes and requires no private key.

## CI integrity

CI runs Python compile checks, AST contract-surface parity, repository/network/security integrity, exact stable Python pins, GenVM lint, Direct Mode, contract mutants, ESLint, TypeScript, Vitest, frontend mutants, production builds, gate build/tests, and packaging. Counts/statuses are reported only from the actual final GitHub Actions run.
