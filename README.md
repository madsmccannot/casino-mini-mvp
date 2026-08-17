# Casino Mini MVP

Security-first casino Originals platform with a double-entry ledger, external-bankroll abstraction and eight implemented games:

- Coinflip, Dice, Mines, Plinko and European Roulette;
- Crash, Limbo and single-player Blackjack.

It also includes a provider-independent Sportsbook foundation with normalized/versioned odds, singles and accumulators, WebSocket updates, provider acceptance and idempotent settlement. The only bundled sports feed is an explicit non-production sandbox; professional integrations remain disabled until contracted and certified.

The canonical wallet flow is EVM + WalletConnect/RainbowKit. Arbitrum is the initial settlement chain, but it is intentionally hidden from the player-facing experience; accounts and balances are presented in USDC/USD through an internal Account ID and unified ledger. Solana is not part of the current authentication or betting path.

## Safety status

This repository is not enabled for real-money production. `BANKROLL_PROVIDER=disabled` and `CUSTODY_MODE=disabled` are the safe defaults. The internal bankroll is test-only and is rejected in production. Legacy casino-wallet custody is retired.

Every game uses authoritative server-side limits, durable fund/exposure reservations and pre-wager fairness commitments. Completed bets can be independently replayed through `GET /api/fairness/:betId`.

Phase 8 adds the authenticated account area at `/account`: profile display name, safe bet history, Originals favourites and a retention-status surface. Referral codes are generated for account continuity, while cashback, VIP, missions, leaderboard, promotions and referral rewards remain explicitly disabled and non-financial until separately implemented, reviewed and approved for production.

Phase 9 technical hardening is tracked in `docs/PHASE9_STATUS.md`. The service exposes `/health/live` and `/health/ready`, applies production security headers and fails readiness while licensing, KYC/AML, geofencing, responsible-gaming, custody/provider, audit, monitoring and disaster-recovery evidence is incomplete. Wallet authentication is EVM + WalletConnect/RainbowKit; deposits and withdrawals remain fail-closed.

## Stack

- Backend: Node.js, TypeScript, Express, Mongoose and WebSocket (`ws`).
- Frontend: Next.js, React, Zustand, wagmi, viem and RainbowKit.
- Local financial tests: MongoDB 8 replica set pinned by digest.

## WalletConnect / Reown configuration

Create a project in Reown and place its Project ID only in the frontend environment:

```bash
# frontend/.env.local
NEXT_PUBLIC_WC_PROJECT_ID=your-reown-project-id
```

Do not commit `.env.local` or expose server secrets in this value. Without a Project ID the app still supports injected/Coinbase connectors for local development, but WalletConnect mobile/deep-link flows are unavailable.

The account API is protected by the same EVM challenge/login session:

- `GET/PATCH /api/account/profile`
- `GET /api/account/bets`
- `GET/POST /api/account/favorites`
- `POST /api/account/favorites/remove`
- `GET /api/account/retention`

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
npx tsc --noEmit
npm audit --omit=dev
npm run build
```

The integration suite uses only explicit test balances and `InternalProvider`. See `docs/SECURITY_BASELINE.md`, `docs/EVM_WALLET_MIGRATION.md`, `docs/ledger.md`, `docs/bankroll-winr.md`, `docs/provably-fair.md` and the phase completion reports before making deployment decisions.

### Local frontend access

Start the frontend from `frontend/` with `npm run dev`; the repository script binds explicitly to IPv4 `127.0.0.1` to avoid the common `localhost`/IPv6 mismatch. Open `http://127.0.0.1:3000`. When running across a VM/WSL boundary, use `npm run dev -- --hostname 0.0.0.0` and keep the development terminal running; `0.0.0.0` is a bind address, not the browser URL.

Before starting the backend locally, start MongoDB as well:

```bash
docker-compose -f docker-compose.ledger.yml up -d
cd backend
npm run dev
```

If the backend reports `ECONNREFUSED 127.0.0.1:27017`, MongoDB is not running or has not finished its replica-set health check yet.
