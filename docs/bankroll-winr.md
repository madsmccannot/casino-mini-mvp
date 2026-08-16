# Phase 2 bankroll and WINR boundary

## Safety state

Gameplay is fail-closed unless `BANKROLL_PROVIDER` selects a configured, healthy provider. The default is `disabled`. There is no automatic fallback between providers, and the internal provider is rejected in production even if selected accidentally.

The legacy casino wallet is not a bankroll provider. Direct house-wallet funding and withdrawals are retired. `CUSTODY_MODE=disabled` remains the required default and undocumented wallet material must not be reused.

## Provider lifecycle

Every initial bet follows this ordering:

1. Read fresh provider health and dynamic limits.
2. Reserve the maximum possible payout with the provider.
3. Reserve the player's stake in the double-entry ledger.
4. Persist and execute the game.
5. Submit the result to the same provider.
6. Credit/settle the local ledger only after provider confirmation.

Provider, bet, exposure and settlement identifiers are stable. Changed idempotency payloads, payouts above the reservation, expired limits and provider changes are rejected. Pending/rejected settlements are not presented as paid.

The MongoDB-backed circuit breaker opens after three operational provider failures. Limit rejections caused by an invalid/oversized player bet do not count as provider outages. Active exposure is persisted and can be aggregated by provider, game and currency.

## WINR mapping verified on 2026-08-16

The public WINR documentation describes an on-chain bankroll on Arbitrum, USDC deposits converted to WINR accounting, deterministic settlement, a normal maximum payout of 2% of the pool, reduction to 1% at 3% daily drawdown, and gameplay halt at 10% drawdown.

These are protocol constraints, not application constants. `WinrProvider` therefore consumes authoritative health and limits through a `WinrTransport` contract. The repository does not contain a guessed ABI, endpoint, contract address, signer or wallet. The default transport reports `DISABLED` and rejects all operations.

There is also an intentional currency gate: the existing game/ledger flow is denominated in SOL, whereas the current public WINR material describes USDC/WINR. No implicit exchange rate or asset substitution is permitted. A production WINR transport requires all of the following from an approved/operator source:

- current chain ID and audited contract addresses;
- current ABI or authenticated API schema and settlement semantics;
- supported game registration/identifiers and currency mapping;
- authoritative limit, drawdown, health and finality behavior;
- idempotency/replay rules and recovery queries;
- approved MPC/HSM/provider signing design, never legacy keys;
- testnet or operator sandbox credentials and fixtures.

Until those inputs are supplied and independently reviewed, WINR integration is correctly unavailable rather than partially live.

## Local integration environment

Use the pinned MongoDB replica-set environment in `docker-compose.ledger.yml`. The internal provider is only for deterministic local tests:

```text
NODE_ENV=test
BANKROLL_PROVIDER=internal
BANKROLL_INTERNAL_TEST_MODE=enabled
```

Amounts are integer minor units internally. The test provider defaults to 100 SOL liquidity, 1 SOL max stake and 1% maximum payout exposure. These defaults are test fixtures and must not be treated as production policy.

Run `npm test` and `npm run test:integration` from `backend/`. Integration tests cover exposure idempotency, changed payload rejection, payout caps, settlement retry, release, aggregation and circuit-breaker behavior against a real replica set.
