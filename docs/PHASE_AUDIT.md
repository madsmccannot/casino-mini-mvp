# Project phase audit

Updated: 2026-08-17

This is the release-oriented view of the roadmap. “Complete” below means
implemented and verified in the local sandbox; it does not mean that the
external production launch gates have been satisfied.

| Phase | Status | Remaining work |
| --- | --- | --- |
| 0 — recovery and baseline | Complete | Keep the documented security baseline current. |
| 1 — ledger and money safety | Complete locally | Run the migration against the real deployment database, then perform production reconciliation and restore drills. |
| 2 — bankroll abstraction | Complete as a fail-closed abstraction | Obtain an approved WINR/iBankroll operator package, currency/custody terms, credentials and settlement/reconciliation specifications. |
| 3 — Originals hardening | Complete locally | Independent fairness/security review, load testing and production bankroll certification. |
| 4 — Originals expansion | Complete locally | Same production gates as Phase 3; do not enable real money until the provider and audit gates pass. |
| 5 — sportsbook foundation | Complete with sandbox | Contract and certify a production odds/trading provider; configure feed, settlement and operational reconciliation. |
| 6 — sportsbook parity | Complete with sandbox | Production provider certification, cashout/Bet Builder liability approval and operational monitoring. |
| 7 — external casino catalog | Complete with sandbox | Contract and certify an aggregator/provider; validate launch, wager, payout and responsible-gaming boundaries. |
| 8 — account and retention | Complete for safe MVP | Compliance-approved limits, self-exclusion and rewards design before enabling any financial promotion. |
| 9 — production readiness | Technical hardening in progress | Licensing, KYC/AML, age/geofence, responsible gaming, approved custody/bankroll, chain reconciliation, independent audit, observability, backups and disaster recovery. |

## Wallet status

The canonical user flow is EVM authentication through RainbowKit/WalletConnect
with a short-lived challenge and an internal account ID. The Reown project ID
is supplied through `frontend/.env.local` (see `frontend/.env.example`).
Arbitrum is settlement infrastructure, not a user-facing requirement.

Legacy Solana custody and undocumented wallet transfers are retired and remain
fail-closed. Deposits and withdrawals cannot be safely completed until an
approved custody or external-bankroll provider supplies the current EVM
transaction, finality, reconciliation and manual-review specifications.

## Release blockers that cannot be implemented locally

The following require decisions, contracts, credentials or evidence outside
this repository and are therefore not fabricated:

- jurisdiction/licence and age/KYC/AML/geofence approvals;
- self-exclusion, deposit/loss/session limits and responsible-gaming policy;
- custody/HSM/MPC or external-bankroll approval and treasury controls;
- finalized-chain deposit/withdrawal reconciliation and reorg procedures;
- independent penetration, smart-contract and fairness review;
- production odds/catalog schemas and provider certification;
- load/chaos evidence, monitoring/alerts, backup restore and incident drills.

The application now exposes `/health/live` and `/health/ready`; readiness is
intentionally non-ready in production while these gates or financial providers
are disabled.
