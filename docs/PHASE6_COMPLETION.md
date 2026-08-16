# Phase 6 completion

Phase 6 is complete locally against the explicit non-production sportsbook sandbox.

Delivered:

- live ticket placement using versioned live markets and provider revalidation;
- provider-priced Bet Builder for same-event correlated selections;
- existing cross-event accumulators preserved as the standard product;
- player-prop markets and provider-owned boosted selections;
- expiring cashout quotes and explicit acceptance;
- cashout ledger settlement through the original reservation;
- idempotent cashout retry and crash recovery;
- settlement/cashout race protection that prevents cursor advancement while acceptance is unresolved;
- advanced live filtering, market state, prop/boost presentation and ticket context;
- ticket history with cashout offer confirmation.

Safety boundaries:

- `SPORTSBOOK_PROVIDER=disabled` remains the default.
- The sandbox remains forbidden in production.
- Sportradar remains fail-closed until commercial schemas, credentials and certification exist.
- The platform does not calculate production correlations, boosts, cashout values or maximum payouts.
- Production activation requires provider conformance tests, operational reconciliation and Phase 9 release approval.
