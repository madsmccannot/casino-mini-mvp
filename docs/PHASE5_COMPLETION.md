# Phase 5 completion

Phase 5 is complete locally as a provider-independent Sportsbook foundation.

Delivered:

- fail-closed provider router, professional-provider candidate and non-production sandbox;
- competitions, events, versioned markets and integer odds;
- prematch/live status, stale detection, suspension and WebSocket odds stream;
- coverage for all eleven Sports V1 categories in the sandbox;
- singles and cross-event accumulators with a 20-leg limit;
- version/price revalidation and explicit changed-odds acceptance;
- provider-authoritative acceptance and payout caps;
- double-entry stake reservation, settlement, VOID and recovery;
- immutable settlement identifiers and changed-result rejection;
- provider health/circuit state, liability aggregation, audit events and admin operations;
- Sports home, live, sport, competition, event, history and version-aware bet slip UI;
- odds-race, stale/suspension, partial accumulator, VOID, idempotency, HTTP and WebSocket tests.

The external commercial/provider gate is intentionally unresolved: no production provider can be enabled without an agreement, credentials, certified schemas and sandbox fixtures. This does not block subsequent software phases because the contract and fail-closed boundary are complete.

## Production gates

- `SPORTSBOOK_PROVIDER` remains `disabled` by default.
- The sandbox requires explicit enablement and is rejected when `NODE_ENV=production`.
- The professional provider remains fail-closed until authenticated commercial specifications and credentials are available.
- A production adapter must pass acceptance, settlement, replay and recovery certification before activation.
- The former Next.js 14 production gate is resolved: the frontend now targets Next.js 16.3.1 and React 19.2.8, with TypeScript, lint and production-build validation.
- The canonical wallet flow is RainbowKit/WalletConnect EVM authentication with a short-lived SIWE-style challenge. Solana is not part of the core identity path, and custody operations remain fail-closed.
