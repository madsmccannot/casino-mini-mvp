# Ledger architecture

Status: Phase 1 implementation complete; not approved for real money.

## Invariants

- All amounts are positive integer minor units. For SOL, the minor unit is one lamport.
- Every posted journal transaction has at least two postings and total debits equal total credits.
- A journal transaction is immutable after posting and cannot be updated or deleted through the model.
- Every operation has a globally unique idempotency key and a payload hash. Reusing a key with different data is rejected.
- Journal creation, materialized balance updates, and reservation transitions happen in one MongoDB transaction with majority write concern.
- User available, reserved, and pending balances cannot become negative.
- The journal is the accounting source of truth. Materialized balances are an atomic concurrency control and read optimization, checked by reconciliation.

MongoDB must run as a replica set or sharded cluster because standalone MongoDB does not support the required multi-document transactions.

## Account model

User account codes follow:

`USER:<account-id>:<currency>:AVAILABLE`

`USER:<account-id>:<currency>:RESERVED`

`USER:<account-id>:<currency>:PENDING`

System accounts are created explicitly with an accounting type: asset, liability, equity, revenue, or expense. Provider clearing/payable accounts will be introduced with the Phase 2 provider adapters.

## Reservation lifecycle

Reserve funds:

- debit user available;
- credit user reserved;
- create an `ACTIVE` reservation linked to the journal transaction.

Release funds:

- debit user reserved;
- credit user available;
- transition the reservation to `RELEASED`.

Commit funds:

- debit user reserved;
- credit the explicit settlement/clearing destination;
- transition the reservation to `COMMITTED`.

Terminal reservation operations are idempotent. A reservation cannot be released after commit or committed after release.

## Unified balance API

- `GET /api/account/balance`
- `GET /api/account/transactions?limit=50`

Amounts are returned as decimal strings in minor units, never JSON floating-point values.

The current casino bet controller uses ledger reservations and atomic settlement. The legacy `User.balance` field is only read and cleared by the explicit test-balance migration.

## Reconciliation

The reconciliation service checks:

- debit/credit equality for every journal;
- referenced account existence;
- journal-derived balances against materialized balances;
- reservation links to reserve and terminal journals.

Provider/chain reconciliation cannot be completed until a new custody/bankroll provider is selected. `CUSTODY_MODE=disabled` remains mandatory in the meantime.

## Phase 1 operational commands

- Start the local transactional database: `docker-compose -f docker-compose.ledger.yml up -d --wait`.
- Run unit tests: `npm test` in `backend/`.
- Run transaction/concurrency/recovery tests: `npm run test:integration` in `backend/`.
- Migrate confirmed test balances: set `MONGO_URI`, set `CONFIRM_TEST_BALANCE_MIGRATION=yes`, then run `npm run migrate:test-balances`.
- Reconcile the ledger: set `MONGO_URI`, then run `npm run ledger:reconcile`.
- Recover persisted results awaiting settlement: set `MONGO_URI`, then run `npm run ledger:recover`.

The migration must be run once in each actual deployment database. No deployment database was configured in this workspace, so only the isolated integration database was migrated and verified.

## Deferred to provider/production work

- Chain/provider reconciliation and idempotent external withdrawal submission require the Phase 2 custody/bankroll provider.
- Database credentials, encryption, backups, restore drills, retention, and least-privilege roles depend on the selected production infrastructure.
- Independent security review, penetration testing, compliance, and launch approval remain mandatory production gates.
