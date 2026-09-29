# Baseline model

CUTOVER freezes a **bounded review artefact**, not a webpage archive. Each route uses schema `cutover.baseline.v1` with only route/source identity, capture metadata, title, canonical URL, bounded headings/visible text, important links, form/action descriptions, and important claims.

## Freeze path

`freeze_route` first treats the submitted JSON as hostile input. It requires the exact schema keys, route/source identity, per-field bounds, URL bounds, and a caller-supplied SHA-256 that must match CUTOVER's own canonical JSON digest. The digest is therefore a commitment to one exact bounded artefact, not a claim that the source website itself is immutable.

The consensus step then independently renders the public baseline route. The leader and validators separately judge only whether the proposed bounded snapshot faithfully represents the review-relevant public content. Source failure, malformed model output, or validator disagreement cannot freeze the route.

After consensus succeeds the contract stores:
- the snapshot artefact URL;
- the canonical SHA-256;
- the canonical bounded snapshot JSON itself;
- the baseline authentication result.

The stored snapshot is not replaceable in place. `seal_baseline` succeeds only after every required route is frozen.

## Candidate use

Candidate assessment never goes back to a mutable "old website" as its comparison source. It loads the stored frozen snapshot, recomputes the SHA-256 before assessment, and rejects an integrity mismatch. Stage B then compares the candidate observation against that authenticated frozen material and the route's rules.

This model does **not** claim stronger cryptographic provenance than the runtime provides. The SHA-256 protects identity/integrity of the accepted artefact; GenLayer consensus is what authenticates that artefact against the public baseline at freeze time.
