# Baseline model

A baseline route is frozen from a bounded JSON snapshot with schema `cutover.baseline.v1`. Fields are limited to route/source identity, capture metadata, title, canonical URL, headings, bounded visible text, important links, form/action descriptions and important claims.

The snapshot is untrusted input. `freeze_route` verifies schema, route/source identity, bounds and canonical JSON SHA-256. Validators then independently retrieve the public baseline and assess whether the proposed snapshot faithfully represents the review-relevant content.

Once frozen, a baseline route cannot be replaced in place. Candidate changes create new candidate generations without changing the frozen baseline provenance.
