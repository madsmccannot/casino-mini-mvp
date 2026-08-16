# Phase 8 — Account, History and Retention Surface

Status: complete for the safe MVP scope.

Phase 8 delivers the authenticated account area without introducing custody or unapproved financial incentives:

- EVM-authenticated profile endpoint with a bounded display name;
- paginated, authenticated bet history exposing only player-safe fields and USDC amounts;
- per-account favourites for Originals and future catalogue/sports items;
- retention status endpoint with an account referral code for continuity;
- account UI at `/account`, linked from the sidebar;
- explicit disabled states for cashback, VIP, missions, leaderboard, promotions and referral rewards.

The retention structures are intentionally fail-closed. No reward balance, payout, bonus credit or promotional liability is created by Phase 8. Enabling any of these features requires separate compliance, abuse-prevention, accounting and funding approval.

Validation completed for this phase:

- backend TypeScript build;
- backend unit tests;
- frontend TypeScript check;
- frontend production build;
- dependency audit with development dependencies omitted;
- `git diff --check`.

The integration suite remains dependent on the local MongoDB replica set described in the root README and must be run before a production release.
