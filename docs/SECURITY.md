# Security model

CUTOVER defends against candidate substitution, stale-generation assessments, frozen-baseline overwrite, malformed model enums, prompt delimiter escape, premature authorization, authorization during a challenge, exact-ref mismatch and wrong-network configuration.

Prompt-injection defence is bounded, not magical: website text is explicitly labelled untrusted data, closing delimiters/backticks are defused, text is bounded, output is JSON-only, statuses are enum-validated and malformed output fails closed.

Known limitations include validator-visible personalization, transient source availability, page mutation during consensus, JavaScript/render differences, redirect ambiguity, hallucination, correlated model/provider behaviour, RPC outages and transactions that become ACCEPTED but later fail execution.

The UI therefore distinguishes accepted, finalized and execution-success states and must re-read affected contract state after finalization before presenting completion.
