import { createHash } from 'node:crypto';
import { Types } from 'mongoose';
import { casinoCatalogRouter } from './CasinoCatalogRouter';
import { ExternalCasinoGame } from './models/ExternalCasinoGame';
import { ExternalCasinoSession } from './models/ExternalCasinoSession';
import { ExternalCasinoWager } from './models/ExternalCasinoWager';
import { reserveFunds, releaseReservation, settleReservation, createSystemAccount } from '../ledger/ledger.service';
import { getUnifiedBalance } from '../ledger/balance.service';
import { lamportsToSol, solToLamports } from '../ledger/casinoLedger.service';

export const CATALOG_STAKE_REVENUE = 'SYSTEM:SOL:CATALOG_STAKE_REVENUE';
export const CATALOG_PAYOUT_EXPENSE = 'SYSTEM:SOL:CATALOG_PAYOUT_EXPENSE';
const decimal = (value: bigint) => Types.Decimal128.fromString(value.toString());
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item)).digest('hex');

const ensureCatalogAccounts = () => Promise.all([
  createSystemAccount(CATALOG_STAKE_REVENUE, 'REVENUE', 'SOL', 'CATALOG_STAKES'),
  createSystemAccount(CATALOG_PAYOUT_EXPENSE, 'EXPENSE', 'SOL', 'CATALOG_PAYOUTS')
]);

export const syncCatalog = async () => {
  const games = await casinoCatalogRouter.execute(async provider => { const result = await provider.listGames(); return { provider: provider.name, games: result }; });
  for (const game of games.games) await ExternalCasinoGame.updateOne({ gameId: game.gameId }, { $set: { ...game, provider: games.provider, sourceHash: hash(game), lastSyncedAt: new Date() } }, { upsert: true });
  return games.games;
};

export const listCatalog = async () => { await syncCatalog(); return ExternalCasinoGame.find({ status: 'ACTIVE' }).sort({ kind: 1, name: 1 }).lean(); };

export const launchCatalogGame = async (ownerId: Types.ObjectId, gameId: string) => {
  const game: any = await ExternalCasinoGame.findOne({ gameId, status: 'ACTIVE' });
  if (!game) throw new Error('Catalog game is unavailable');
  const sessionId = `catalog-session:${crypto.randomUUID()}`;
  const launch = await casinoCatalogRouter.execute(provider => provider.launchGame({ gameId, userId: ownerId.toString(), sessionId }));
  await ExternalCasinoSession.create({ sessionId, provider: game.provider, providerSessionId: launch.providerSessionId, gameId, userId: ownerId, expiresAt: launch.expiresAt, status: 'ACTIVE' });
  return launch;
};

export const placeCatalogWager = async (ownerId: Types.ObjectId, input: { wagerId: string; sessionId: string; stakeSol: number }) => {
  if (!/^[A-Za-z0-9:_-]{16,128}$/.test(input.wagerId)) throw new Error('Invalid catalog wager ID');
  const session: any = await ExternalCasinoSession.findOne({ sessionId: input.sessionId, userId: ownerId, status: 'ACTIVE', expiresAt: { $gt: new Date() } });
  if (!session) throw new Error('Catalog session is expired or invalid');
  const stakeMinor = solToLamports(input.stakeSol); if (stakeMinor <= 0n) throw new Error('Stake must be positive');
  const payloadHash = hash({ sessionId: input.sessionId, stakeMinor, gameId: session.gameId });
  let wager: any = await ExternalCasinoWager.findOne({ wagerId: input.wagerId });
  if (wager) { if (wager.userId.toString() !== ownerId.toString() || wager.payloadHash !== payloadHash) throw new Error('Catalog wager idempotency payload mismatch'); if (wager.status !== 'FUNDS_RESERVED') return { wager, newBalance: lamportsToSol((await getUnifiedBalance(ownerId.toString())).availableMinor) }; }
  else { await ensureCatalogAccounts(); await reserveFunds({ reservationId: `catalog:${input.wagerId}`, ownerId, currency: 'SOL', amountMinor: stakeMinor, referenceType: 'catalog_wager', referenceId: input.wagerId }); wager = await ExternalCasinoWager.create({ wagerId: input.wagerId, userId: ownerId, provider: session.provider, providerSessionId: session.providerSessionId, gameId: session.gameId, stakeMinor: decimal(stakeMinor), status: 'FUNDS_RESERVED', payloadHash }); }
  try {
    const accepted = await casinoCatalogRouter.execute(provider => provider.acceptWager({ wagerId: input.wagerId, providerSessionId: session.providerSessionId, gameId: session.gameId, stakeMinor, idempotencyKey: input.wagerId }));
    if (accepted.status !== 'ACCEPTED') throw new Error('Catalog provider rejected wager');
    await ExternalCasinoWager.updateOne({ _id: wager._id, status: 'FUNDS_RESERVED' }, { $set: { providerWagerId: accepted.providerWagerId, payoutMinor: decimal(accepted.payoutMinor), outcome: accepted.providerOutcome, status: 'ACCEPTED', acceptedAt: new Date() } });
    await settleReservation({ reservationId: `catalog:${input.wagerId}`, stakeDestinationAccountCode: CATALOG_STAKE_REVENUE, payoutSourceAccountCode: CATALOG_PAYOUT_EXPENSE, payoutMinor: accepted.payoutMinor });
    const settled = await ExternalCasinoWager.findOneAndUpdate({ _id: wager._id, status: 'ACCEPTED' }, { $set: { status: 'SETTLED', settledAt: new Date() } }, { returnDocument: 'after' });
    return { wager: settled, newBalance: lamportsToSol((await getUnifiedBalance(ownerId.toString())).availableMinor) };
  } catch (error) { await releaseReservation(`catalog:${input.wagerId}`).catch(() => undefined); await ExternalCasinoWager.updateOne({ _id: wager._id, status: 'FUNDS_RESERVED' }, { $set: { status: 'REJECTED' } }); throw error; }
};
