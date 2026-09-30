# Security model

CUTOVER is designed to fail closed, but it is not a proof that websites or language models are perfectly stable.

## Implemented controls

**Mutable baseline site.** Baseline material is authenticated once, bounded, canonicalized, SHA-256 committed, and stored in the frozen route record. Later candidate comparisons use that frozen material, not today's mutable old site.

**Snapshot tampering.** Freeze recomputes canonical SHA-256; assessment recomputes the stored snapshot digest again before use. Frozen routes cannot be overwritten in place.

**Mutable candidate / substitution.** Every assessment key binds migration, candidate generation, route, candidate ref and baseline digest. Changing candidate origin/ref increments generation and invalidates readiness. Authorization stores the exact ref; the GitHub gate requires an exact expected-ref match.

**Prompt injection.** Baseline/candidate/challenge content is labelled untrusted data, closing delimiters/backticks are defused, input is bounded, output schemas are exact, statuses are a closed enum, and malformed output fails closed. This reduces authority; it does not establish universal prompt-injection immunity.

**Expectation bias.** Candidate observation happens before the baseline/rules are introduced. Only the second stage compares.

**Source unavailable / malformed model output.** Freeze fails; candidate assessment becomes `INCONCLUSIVE`. Neither path can create READY from missing evidence.

**Review-clock forgery.** Deadlines use GenVM-patched transaction datetime. The write surface has no caller timestamp for derivation or authorization.

**Challenge griefing.** A non-owner may open no more than three admitted attempts per candidate generation, with no more than two attempts on any route. Attempts are admitted only after the evidence is independently retrieved and found relevant; invalid, unavailable or irrelevant evidence consumes no attempt. Every admitted attempt stores its evidence digest and result. An unresolved challenge blocks authorization. A READY-preserving reassessment does not permanently close the route, so stronger later evidence may still be submitted within the bounds. A consequential BLOCKED or INCONCLUSIVE result changes candidate readiness and must be resolved through the normal assessment/derivation rules. A new candidate generation scopes old records out and marks an open old challenge superseded.

**Owner bypass.** The owner can define the migration, routes, baseline proposal, candidate and cancel pre-authorization, but has no force-ready, force-authorize, hidden override, replace-frozen-baseline, or backend signer path.

**Accepted vs successful.** The browser distinguishes submitted, accepted/decision, finalizing, finalized and execution success/failure. After successful finalization it re-reads contract state before reporting the state change.

**Network substitution.** Runtime config is centralized on stable Studionet chain 61999; CI scans for forbidden Studio-dev/61997 runtime contamination and the UI refuses wrong-network writes.

## Residual limitations

Validators may receive personalized/geographic/A-B-tested content. Candidate pages can change during a consensus round. JavaScript/rendering can differ by runtime. Redirect chains can be ambiguous. Models can hallucinate or share correlated provider failures. RPC outages can prevent evidence retrieval. Public fixture behavior does not prove arbitrary production sites will render identically. SHA-256 authenticates the stored artefact identity, not the truth of its contents; freeze-time consensus supplies that semantic authentication.

Live Studionet validator behavior, fees, browser-wallet recovery, and deployed-source equality are explicitly **NOT YET RUN** until the funded-wallet phase.
