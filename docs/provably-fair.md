# Provably fair originals

All eight Originals use `hmac-sha256-v1`. No result is selected by `Math.random`, a disconnected RNG, or a client-supplied outcome. Crash uses a pre-betting round commitment shared by every participant; the other games use player-bound one-time commitments.

## Commitment flow

1. The authenticated client generates a client seed and nonce.
2. `POST /api/fairness/commit` returns a SHA-256 commitment and opaque commit ID before the wager is sent.
3. The commit is bound to the user, client seed and nonce, expires after five minutes and can be consumed exactly once.
4. The bet consumes the commitment atomically and derives its random stream with `HMAC-SHA256(serverSeed, clientSeed:nonce:cursor)`.
5. Completed results reveal the server seed, algorithm, commitment, commit ID and original commitment timestamp.
6. `GET /api/fairness/:betId` independently recomputes the outcome, multiplier and payout and rejects any tampering.

Modulo bias is prevented with rejection sampling. Mines derives a without-replacement bomb layout from the same stream. A Mines seed remains hidden while the session is active and is revealed only on boom or cashout.

Commit records are durable in MongoDB. The server seed is excluded from normal queries, although production database encryption, access control and secret-handling remain launch requirements under Phase 9.

## Authoritative game rules

The backend registry is authoritative for parameter validation and maximum exposure. The frontend cannot submit its own payout multiplier.

- Coinflip: 1.98x payout.
- Dice: target 1–99, over/under, `99 / win chance` payout.
- European Roulette: 0–36; red/black 2x and green 36x.
- Mines: 1–24 bombs, combinatorial 1% edge, no cashout before a safe reveal.
- Plinko: 8/12/16 rows, low/medium/high tables. Every table has a unit-tested RTP between 98.7% and 99.1%; High/16 is capped at 1000x.

## Verification

From `backend/`:

```text
npm test
npm run test:integration
```

The HTTP integration suite exercises authentication, one-time commitments, bankroll limits, exposure, ledger reserve/settlement, every game lifecycle, balance updates and the public verifier against a MongoDB replica set.
