# Casino Mini MVP

Security-first casino Originals platform with a double-entry ledger, external-bankroll abstraction and eight implemented games:

- Coinflip, Dice, Mines, Plinko and European Roulette;
- Crash, Limbo and single-player Blackjack.

It also includes a provider-independent Sportsbook foundation with normalized/versioned odds, singles and accumulators, WebSocket updates, provider acceptance and idempotent settlement. The only bundled sports feed is an explicit non-production sandbox; professional integrations remain disabled until contracted and certified.

## Safety status

This repository is not enabled for real-money production. `BANKROLL_PROVIDER=disabled` and `CUSTODY_MODE=disabled` are the safe defaults. The internal bankroll is test-only and is rejected in production. Legacy casino-wallet custody is retired.

Every game uses authoritative server-side limits, durable fund/exposure reservations and pre-wager fairness commitments. Completed bets can be independently replayed through `GET /api/fairness/:betId`.

## Stack

- Backend: Node.js, TypeScript, Express, Mongoose and WebSocket (`ws`).
- Frontend: Next.js, React and Zustand.
- Local financial tests: MongoDB 8 replica set pinned by digest.

## Local verification

Copy `.env.example` to `.env` and keep all custody/provider production modes disabled. Start the test database from the repository root:

```bash
docker-compose -f docker-compose.ledger.yml up -d
```

Then run:

```bash
cd backend
npm test
npm run test:integration

cd ../frontend
npm run build
```

The integration suite uses only explicit test balances and `InternalProvider`. See `docs/SECURITY_BASELINE.md`, `docs/ledger.md`, `docs/bankroll-winr.md`, `docs/provably-fair.md` and the phase completion reports before making deployment decisions.
