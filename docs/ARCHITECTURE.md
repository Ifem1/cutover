# Architecture

CUTOVER deliberately stays small: one Intelligent Contract, one browser dApp, one deterministic fixture lab, and one read-only CI consumer. There is no database, privileged backend, generated browser key, or server signer.

The contract stores migrations, bounded route definitions, baseline commitments, candidate generations, route assessments, at most three challenge attempts per candidate generation and at most two per route, authorization records and a bounded event journal. The frontend reads without a wallet and uses an injected EIP-1193 provider for writes. The GitHub gate only reads `get_migration` and `get_authorization`.

The critical boundary is **judgement vs consequence**. Consensus retrieves public evidence and produces structured rule statuses. Deterministic code owns route aggregation, migration aggregation, generation binding, challenge limits, review deadlines and authorization.
