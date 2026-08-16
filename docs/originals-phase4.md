# Phase 4 Originals operations

## Crash recovery

The realtime worker advances rounds every 100 ms and runs recovery every five seconds. Round transitions and wager settlement are claimed atomically in MongoDB, so multiple application instances may tick without paying twice.

`PREPARING` wagers older than one minute are either activated when their financial reservations exist and betting remains open, or refunded and removed. Stale `SETTLING` wagers return to `ACTIVE`; once the associated round is crashed, settlement is retried with the correct win/loss classification.

A settlement/provider outage does not change the predetermined crash point and must never convert a qualifying auto-cashout into a loss. Operator alerts for repeated recovery errors are still required before launch.

## Fairness boundaries

Limbo and Blackjack consume the standard user-bound, one-time pre-wager commitment. Crash creates a round commitment before accepting wagers and uses the public round ID as its client seed. Winning bets may be financially settled during a running round, but public bet details remain redacted until the round crashes. The final server seed replays the crash point for every participant.

## Blackjack scope

Phase 4 intentionally implements a single-player dealer game. Split, double-down, insurance, surrender, side bets and live-dealer functionality are not silently approximated. Adding any of them requires new exposure rules, lifecycle states, UI and statistical tests.
