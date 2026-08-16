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
