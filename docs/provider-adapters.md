# Provider adapters

`SportsbookProvider` defines health, normalized event snapshots, ticket acceptance/cancellation, cashout quote/acceptance and incremental settlement updates. A production adapter must additionally satisfy the operational semantics already assumed by the foundation:

- acceptance is idempotent by platform ticket ID;
- event, market and price versions are monotonic;
- suspension takes effect immediately;
- accepted odds and maximum payout are authoritative;
- settlement updates have immutable unique IDs and terminal results cannot change;
- provider ticket status can be safely reconstructed after timeouts;
- Bet Builder correlation and combined pricing are provider-authoritative;
- cashout quotes are opaque, short-lived and idempotently accepted, with documented settlement-race semantics;
- player props and boosts carry immutable provider identifiers and versioned prices;
- credentials use an approved secrets system, never repository or ordinary environment-file material;
- documented rate limits, retry rules, finality, retention and reconciliation are available;
- sandbox certification and failure drills pass before enabling production.

`SportradarProvider` remains disabled until an agreement and verified integration package supply these facts. Additional providers can implement the same contract without changing tickets or the ledger.
