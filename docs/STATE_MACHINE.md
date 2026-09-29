# State machine

- `DRAFT`: owner may add and freeze baseline routes.
- `BASELINED`: every required route is frozen and the baseline is sealed.
- `CANDIDATE`: exact candidate origin + immutable candidate ref submitted; generation increments.
- `BLOCKED`: at least one definite consequential failure.
- `INCONCLUSIVE`: required evidence is unavailable/conflicting/unreadable/incomplete and no stronger failure exists.
- `READY`: all required current-generation routes pass. Review deadline starts.
- `CHALLENGED`: the single bounded challenge opportunity for this generation is open.
- `AUTHORIZED`: terminal authorization for the exact candidate generation/ref.
- `CANCELLED`: owner cancellation before authorization.

A new candidate generation clears READY/review/challenge state and cannot inherit prior authorization.
