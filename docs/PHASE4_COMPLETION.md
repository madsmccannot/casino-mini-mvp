# Phase 4 completion

Phase 4 is complete locally: Crash, Limbo and Blackjack have been added to the existing five Originals and integrated with the Phase 1–3 safety boundaries.

## Crash

- durable shared rounds with a unique active-round lease;
- five-second betting window, persisted running/crashed states and deterministic exponential multiplier;
- public WebSocket stream at `/api/crash/stream`;
- manual cashout, auto-cashout and opt-in frontend auto-bet;
- per-bet provider exposure and ledger reservations;
- atomic wager claims preventing duplicate settlement;
- no server-seed/crash-point disclosure while a round is running;
- complete proof revelation only after the crash;
- idempotent recovery for interrupted preparation and settlement states;
- multi-instance-safe round transitions and settlement claims.

## Limbo

- target range 1.01x–1000x;
- 1% mathematical house edge;
- unbiased deterministic result generation;
- authoritative target-based exposure and public proof verification.

## Blackjack

- single-player versus dealer, as scoped by the roadmap;
- deterministic 52-card shuffle;
- hit and stand actions, dealer stand on 17, ace handling, bust, push and natural Blackjack paying 3:2;
- dealer hole card and server seed hidden until terminal state;
- optimistic concurrency protection;
- durable terminal results so a process interruption can resume settlement without dealing again.

## Validation

Unit tests cover game mathematics, deterministic decks, hand scoring, proof tampering, registry limits and Crash multiplier progression. The MongoDB replica-set E2E traverses authentication, bankroll exposure, ledger reservation, all eight games, terminal settlement, public proof replay and the Crash WebSocket stream.

Production bankroll/custody remains disabled. Independent audit, compliance, monitoring, load/chaos testing and launch controls remain Phase 9 gates rather than Phase 4 functionality.
