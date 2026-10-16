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

**Accepted vs successful.** The browser distinguishes submitted, accepted/decision, finalizing, finalized, execution success/failure and execution-result-unavailable states. For finalized writes it normalizes both `txExecutionResultName` (`FINISHED_WITH_RETURN` / `FINISHED_WITH_ERROR`) and Studionet Studio leader-receipt `execution_result` (`SUCCESS` / `ERROR`). Missing execution evidence is not labelled a proven contract failure. After finalization it re-reads contract state before reporting the state change.

**Network substitution.** Runtime config is centralized on stable Studionet chain 61999; CI scans for forbidden Studio-dev/61997 runtime contamination and the UI refuses wrong-network writes.

## Residual limitations

Validators may receive personalized/geographic/A-B-tested content. Candidate pages can change during a consensus round. JavaScript/rendering can differ by runtime. Redirect chains can be ambiguous. Models can hallucinate or share correlated provider failures. RPC outages can prevent evidence retrieval. Public fixture behavior does not prove arbitrary production sites will render identically. SHA-256 authenticates the stored artefact identity, not the truth of its contents; freeze-time consensus supplies that semantic authentication.

Historical live behavior remains in the original proof files. The active source SHA-256 `ea9d62b76d5009a67ed0aa60237fd2ad9846a5e6fe0944eead78235cca29bd3f` is deployed at `0x60FD8fC7012f3b5B42A79B868ecd23451cccf2D4`; retrieved source matched exactly. The active terminal assurance is in [`assurance deployment`](../proof/live/assurance-deployment.json) and [`assurance live cases`](../proof/live/assurance-live-cases.json). Active-source negative assurance terminals, active live GitHub gate and frontend wallet QA remain unperformed. Fee values were unavailable from captured receipts.

A production-only `npm audit --omit=dev --json` evidence run reported 4 production-tree findings: 2 moderate and 2 high, with no critical findings. Next/PostCSS are in the web/fixture production dependency graph; `@actions/http-client`/Undici are in the GitHub gate production dependency graph. No automatic or SemVer-major dependency upgrade was applied in this evidence-only cleanup, and no CUTOVER-specific exploitability conclusion is claimed from the package-level audit alone.
