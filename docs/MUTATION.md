# Mutation testing

The mutation jobs target consequences that could create an unsafe release if accidentally inverted.

## Contract model

`scripts/contract_mutation.py` creates a fresh temporary copy for each mutation and runs the normal unit suite. A mutant counts as killed only when the tests fail. The harness also fails if its source pattern disappears, preventing silent mutation drift.

Current consequential mutants cover:
- MATERIAL_CHANGE no longer blocking;
- UNREADABLE incorrectly passing;
- source/evidence failure incorrectly passing;
- a missing required route assessment being ignored;
- stale candidate generation being ignored;
- open challenge being ignored;
- review deadline being ignored;
- authorized/current candidate ref mismatch being ignored;
- a second challenge being allowed;
- a challenge after the window being allowed.

Equivalent/noise mutants are excluded rather than inflating a count.

## Frontend policy

`mutations/frontend/run.mjs` now performs actual source mutations against `apps/web/lib/policy.ts`. For every mutant it runs the real Vitest policy suite, requires a failure, then restores the original file. Mutants cover authorize-while-challenged, READY-as-authorized, stale generation, premature authorization, wrong network, late challenge, second challenge and non-owner cancellation.

The transaction lifecycle has separate tests ensuring an accepted decision is not displayed as finalized execution success.
