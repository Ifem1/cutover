# Mutation testing

`scripts/contract_mutation.py` creates temporary copies of the deterministic contract model and applies consequential mutants: removing MATERIAL_CHANGE blocking, allowing UNREADABLE to pass, ignoring challenge/deadline/generation/ref checks. The unit suite must fail for every mutant.

`mutations/frontend/run.mjs` guards the action-policy layer against authorize-while-challenged, stale generation, wrong network and READY-vs-AUTHORIZED mistakes. An uncovered guard fails CI.

Equivalent/noise mutants are intentionally excluded.
