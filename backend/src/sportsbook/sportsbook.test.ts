import assert from 'node:assert/strict'; import test from 'node:test';
import { sportsId, validateNormalizedEvents } from './markets/marketNormalizer'; import { SandboxFeed } from './providers/SandboxFeed'; import { SandboxSportsbookProvider } from './providers/SandboxSportsbookProvider'; import { SportradarProvider } from './providers/SportradarProvider';

test('sandbox normalizes every Sports V1 category with integer odds and stable IDs', async () => {
  const feed = new SandboxFeed(new Date('2026-01-01T00:00:00Z')); const events = await feed.snapshot();
  assert.equal(events.length, 11); assert.equal(new Set(events.map(event => event.sport)).size, 11);
  assert.doesNotThrow(() => validateNormalizedEvents('sandbox', events));
  assert.equal(events[0].eventId, sportsId('event', 'sandbox', events[0].providerEventId));
  assert.equal(typeof events[0].markets[0].selections[0].oddsMillionths, 'bigint');
});

test('invalid odds, duplicate IDs, and unconfigured professional provider fail closed', async () => {
  const feed = new SandboxFeed(); const events = await feed.snapshot();
  events[0].markets[0].selections[0].oddsMillionths = 1_000_000n;
  assert.throws(() => validateNormalizedEvents('sandbox', events), /Odds outside/);
  assert.equal((await new SportradarProvider().getHealth()).state, 'DISABLED');
  await assert.rejects(() => new SportradarProvider().fetchEvents(), /not configured/);
  const previous = process.env.NODE_ENV; const mode = process.env.SPORTSBOOK_SANDBOX_MODE;
  process.env.NODE_ENV = 'production'; process.env.SPORTSBOOK_SANDBOX_MODE = 'enabled';
  await assert.rejects(() => new SandboxSportsbookProvider(() => feed.snapshot()).fetchEvents(), /restricted/);
  if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous;
  if (mode === undefined) delete process.env.SPORTSBOOK_SANDBOX_MODE; else process.env.SPORTSBOOK_SANDBOX_MODE = mode;
});
