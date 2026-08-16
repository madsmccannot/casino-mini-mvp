import assert from 'node:assert/strict';
import test from 'node:test';
import { SandboxCasinoCatalogProvider } from './providers/SandboxCasinoCatalogProvider';

test('catalog sandbox is fail-closed in production and exposes slots/live casino fixtures only when enabled', async () => {
  const provider = new SandboxCasinoCatalogProvider(); const previousNode = process.env.NODE_ENV; const previousMode = process.env.CASINO_CATALOG_SANDBOX_MODE;
  process.env.NODE_ENV = 'production'; process.env.CASINO_CATALOG_SANDBOX_MODE = 'enabled';
  assert.equal((await provider.getHealth()).state, 'DISABLED'); await assert.rejects(() => provider.listGames(), /restricted/);
  process.env.NODE_ENV = 'test'; process.env.CASINO_CATALOG_SANDBOX_MODE = 'enabled'; const games = await provider.listGames();
  assert.equal(games.length, 4); assert.ok(games.some(game => game.kind === 'SLOT')); assert.ok(games.some(game => game.kind === 'LIVE_CASINO'));
  if (previousNode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousNode;
  if (previousMode === undefined) delete process.env.CASINO_CATALOG_SANDBOX_MODE; else process.env.CASINO_CATALOG_SANDBOX_MODE = previousMode;
});
