# Sportsbook foundation

## Safety state

`SPORTSBOOK_PROVIDER=disabled` is the default. The sandbox is available only when `SPORTSBOOK_SANDBOX_MODE=enabled` outside production. `SportradarProvider` is a fail-closed candidate boundary; it contains no invented endpoint, credential, schema, odds or settlement behavior.

The platform never calculates production odds. A provider owns fixtures, trading, prices, suspension, ticket acceptance and result feeds. MongoDB stores a normalized, versioned operational copy. The local ledger remains the authority for player funds.

## Odds lifecycle

Provider event and market identifiers are mapped to stable internal IDs. Odds are integer millionths (`1.90` is `1900000`) and payouts use integer minor units. Incoming versions must increase whenever content changes. A provider payload that mutates an existing version is rejected and recorded as a feed failure.

Prematch markets become stale after 120 seconds without a provider update; live markets after 10 seconds. ACTIVE, STALE, SUSPENDED and CLOSED states are enforced at ticket acceptance. `/api/sports/stream` broadcasts versioned changes over WebSocket; clients still submit the exact displayed version and odds.

## Ticket lifecycle

1. Client submits 1–20 unique selection snapshots and an idempotency key.
2. Player stake is reserved in the double-entry ledger.
3. Provider revalidates availability, correlation, version and odds.
4. Changed odds require explicit `acceptOddsChange=true`.
5. Provider acceptance and maximum payout are persisted.
6. Provider settlement updates legs as WIN, LOSS or VOID.
7. Accumulators remain open until every leg is terminal. A LOSS pays zero; VOID contributes 1.0; an all-VOID ticket releases the original stake.
8. Ledger settlement is idempotent and interrupted `SETTLEMENT_PENDING` tickets are recovered.

Same-event correlated accumulators are rejected because Bet Builder belongs to Phase 6. Cashout and live ticket placement are likewise Phase 6; this prevents unsupported risk behavior from being silently approximated.

## Sandbox

The explicit test sandbox supplies deterministic fixtures covering all eleven Sports V1 categories. It exists for integration tests, odds-race tests and UI development only. Its generated fixtures and prices are not trading advice and cannot be selected in production.
