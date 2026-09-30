# Security model

CUTOVER is designed to fail closed, but it is not a proof that websites or language models are perfectly stable.

## Implemented controls

**Mutable baseline site.** Baseline material is authenticated once, bounded, canonicalized, SHA-256 committed, and stored in the frozen route record. Later candidate comparisons use that frozen material, not today's mutable old site.

**Snapshot tampering.** Freeze recomputes canonical SHA-256; assessment recomputes the stored snapshot digest again before use. Frozen routes cannot be overwritten in place.

**Mutable candidate / substitution.** The leader and validator must return the exact same complete manifest payload after independent retrieval and digest validation. Every assessment key binds generation, route, ref, manifest digest, baseline digest, candidate URL, exact body hash and candidate-probe digest. Changing candidate origin/ref increments generation and invalidates readiness. Authorization revalidates the stored assessment and probe before committing their provenance; the GitHub gate requires an exact expected-ref match.

**Prompt injection.** Baseline/candidate/challenge content is labelled untrusted data, closing delimiters/backticks are defused, input is bounded, output schemas are exact, statuses are a closed enum, and malformed output fails closed. This reduces authority; it does not establish universal prompt-injection immunity.

**Expectation bias.** Candidate observation happens before the baseline/rules are introduced. Only the second stage compares.

**Source unavailable / malformed model output.** Freeze fails; candidate assessment becomes `INCONCLUSIVE`. Neither path can create READY from missing evidence.

**Review-clock forgery.** Deadlines use GenVM-patched transaction datetime. The write surface has no caller timestamp for derivation or authorization.

**Challenge trust and griefing.** A non-owner may open no more than three admitted attempts per candidate generation, with no more than two attempts on any route. Challenge text is strictly decoded, independently retrieved and retained with a digest for audit. Relevance is only an admission filter; the text is not included in the semantic verdict prompt and cannot directly determine BLOCKED/READY. An admitted challenge triggers a fresh independent candidate probe and semantic comparison against frozen baseline/rules. Invalid, unavailable or irrelevant evidence consumes no attempt. An unresolved challenge blocks authorization. A READY-preserving reassessment does not permanently close the route, so later evidence can trigger another bounded check. Challenge caps bound the remaining possibility of repeated recheck/liveness griefing.

**Retry griefing.** Ordinary assessments are owner-only because source outages produce INCONCLUSIVE and consume one of a finite number of attempts. READY/BLOCKED results remain locked for the generation; owner retries remain bounded. Non-owners retain the separate bounded challenge path.

**Owner bypass.** The owner can define the migration, routes, baseline proposal, candidate, ordinary assessments and cancel pre-authorization, but has no force-ready, force-authorize, hidden override, replace-frozen-baseline, or backend signer path.

**Accepted vs successful.** The browser distinguishes submitted, accepted/decision, finalizing, finalized and execution success/failure. After successful finalization it re-reads contract state before reporting the state change.

**Network substitution.** Runtime config is centralized on stable Studionet chain 61999; CI scans for forbidden Studio-dev/61997 runtime contamination and the UI refuses wrong-network writes.

## Residual limitations

Validators may receive personalized/geographic/A-B-tested content. Candidate pages can change during a consensus round. JavaScript/rendering can differ by runtime. Redirect chains can be ambiguous. Models can hallucinate or share correlated provider failures. RPC outages can prevent evidence retrieval. Public fixture behavior does not prove arbitrary production sites will render identically. SHA-256 authenticates the stored artefact identity, not the truth of its contents; freeze-time consensus supplies that semantic authentication.

Historical live Studionet behavior for source SHA-256 `34018863567489cea352be045f16f6308b0a5c0ef8af668ad84551e10cf75834` remains in [`proof/live/deployment.json`](../proof/live/deployment.json), [`proof/live/adversarial-cases.json`](../proof/live/adversarial-cases.json), and [`proof/live/browser-qa.json`](../proof/live/browser-qa.json). Revised source SHA-256 `13bfc90c1c2aad4ae09c591dbc72af1c063f43e0c71640e70c521b66ed867c79` is deployed at `0x2A19548ae8A86a6d678890095f9F25eddeC16DD3`; retrieved source matched exactly. Its live positive/challenge and fail-closed cases are in [`revised deployment`](../proof/live/revised-deployment.json) and [`revised live cases`](../proof/live/revised-live-cases.json). The production frontend still needs the revised address and a fresh deploy; revised-pair wallet QA and the revised-source GitHub gate are incomplete. Fee values were unavailable from captured receipts.
