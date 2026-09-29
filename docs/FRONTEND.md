# Frontend

The Next.js App Router UI uses a warm release-control visual system: warm white canvas, deep ink, orange operational accent, hot-pink emphasis and yellow attention. Status is always written as text rather than color alone. Responsive tables scroll safely; focus visibility and reduced-motion behaviour are defined globally.

Reads use a wallet-free `genlayer-js` Studionet client. Writes use an injected EIP-1193 provider only. The repository contains no private key generation, wallet snap, backend signer or fake-chain fallback.

Until a canonical contract address exists, chain pages show **Contract not configured yet**. Production data must never silently fall back to fixture/demo data.

Transaction logic distinguishes submitted, accepted, finalizing, finalized and execution result.
