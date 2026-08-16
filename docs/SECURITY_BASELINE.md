# Security baseline

Date: 2026-08-16

## Launch status

**Not approved for real-money or mainnet use.** This repository is still a proof of concept.

The application must remain in `CUSTODY_MODE=disabled` until a new custody/bankroll design, new credentials, reconciliation, and an independent security review are complete. Legacy or undocumented wallet keys must not be reused.

## Controls added in the first recovery pass

- Production configuration fails at startup when JWT, database, RPC, or CORS settings are missing.
- Wallet login uses a server-issued, single-use, five-minute challenge rather than a reusable arbitrary message.
- JWTs are restricted to HS256, issuer, audience, and a 15-minute lifetime.
- Solana addresses preserve their case and are validated canonically.
- CORS is an explicit allowlist and JSON request bodies are limited to 32 KiB.
- Emergency-state lookup failures block financial operations.
- Custody defaults to disabled; deposit and withdrawal endpoints fail closed without newly configured custody.
- Deposit signatures are uniquely recorded to reject straightforward replay credits.
- Bet and withdrawal amounts reject non-finite values and values that cannot be represented as whole lamports.
- Reproducible npm lockfiles are versioned.
- The frontend uses only the browser-injected Phantom/Solflare signing surface. The Solana wallet-adapter, React Native/mobile and web3 dependency chains are removed; the browser has no casino RPC or transaction-construction capability.

## Unresolved production blockers

1. Replace mutable floating-point balances with an integer-denominated, double-entry ledger.
2. Make deposits, reservations, settlements, payouts, and withdrawals transactional and idempotent across database and provider boundaries.
3. Replace direct hot-wallet signing with an approved custody/HSM/MPC or external bankroll provider design, with withdrawal policy and approval controls.
4. Require finalized chain state and implement deposit/withdrawal reconciliation, reorg handling, retry workers, and manual-review tooling.
5. Replace the current RNG/proof implementation. Several games generate their outcome independently from the seed returned as the alleged proof.
6. Add rate limiting, abuse controls, session revocation/rotation, audit events, and administrator step-up authentication.
7. Add schema validation for every API request and strict per-game parameter validation.
8. Add unit, integration, concurrency, and end-to-end tests for all five games and every money-state transition.
9. Upgrade or replace vulnerable frontend/backend dependencies. Builds currently pass, but dependency advisories remain.
10. Add CSP and remaining HTTP security headers, observability, alerting, backups, recovery drills, and external penetration testing.
11. Complete legal, licensing, KYC/AML, geofencing, age, and responsible-gaming gates before any real-money launch.

## Required release rule

No environment may enable custody or real-money betting merely by changing an environment variable. Enabling those capabilities requires a reviewed provider implementation, migration/reconciliation plan, automated test evidence, operational runbook, and explicit release approval.
