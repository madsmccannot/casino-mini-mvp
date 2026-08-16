import assert from 'node:assert/strict'; import test, { after, before, beforeEach } from 'node:test'; import mongoose from 'mongoose';
import { User } from '../models/User'; import { migrateLegacyTestBalances } from '../ledger/migrateLegacyBalances.service'; import { getUnifiedBalance } from '../ledger/balance.service';
import { ingestSportsFeed, markStaleMarkets } from './feeds/eventFeed.service'; import { sandboxFeed } from './providers/SandboxFeed'; import { SportsMarket } from './models/SportsMarket'; import { placeSportsTicket } from './tickets/ticket.service'; import { SandboxSportsbookProvider } from './providers/SandboxSportsbookProvider'; import { applySportsSettlement, pollSportsSettlements } from './tickets/settlement.service'; import { SportsTicket } from './models/SportsTicket';
import { app } from '../server'; import jwt from 'jsonwebtoken'; import { getJwtSecret } from '../config/env'; import { AddressInfo } from 'node:net'; import WebSocket from 'ws'; import { attachSportsOddsStream } from './feeds/liveOdds.service';
import { acceptSportsCashout, quoteSportsCashout } from './tickets/cashout.service';
import { SportsCashoutQuote } from './models/SportsCashoutQuote';
import { launchCatalogGame, listCatalog, placeCatalogWager } from '../casinoCatalog/catalog.service';

const uri = process.env.LEDGER_TEST_MONGO_URI; if (!uri) throw new Error('LEDGER_TEST_MONGO_URI is required'); let user: any;
before(async () => { process.env.NODE_ENV = 'test'; process.env.SPORTSBOOK_PROVIDER = 'sandbox'; process.env.SPORTSBOOK_SANDBOX_MODE = 'enabled'; process.env.CASINO_CATALOG_PROVIDER = 'sandbox'; process.env.CASINO_CATALOG_SANDBOX_MODE = 'enabled'; await mongoose.connect(uri.replace('/casino_ledger_test?', '/casino_sportsbook_test?')); await mongoose.connection.dropDatabase(); user = await User.create({ walletAddress: 'sportsbook-test-user', balance: 10 }); const migration = await migrateLegacyTestBalances(); assert.equal(migration.errors.length, 0); });
beforeEach(async () => { await ingestSportsFeed(); }); after(async () => mongoose.disconnect());
const quote = (market: any, index = 0) => ({ selectionId: market.selections[index].selectionId, displayedMarketVersion: market.version, displayedOddsMillionths: market.selections[index].oddsMillionths.toString() });

test('odds race rejects unless explicitly accepted and always releases rejected funds', async () => {
  const market: any = await SportsMarket.findOne({ status: 'ACTIVE' }); const shown = quote(market);
  sandboxFeed.updateOdds(shown.selectionId, BigInt(shown.displayedOddsMillionths) + 100_000n); await ingestSportsFeed();
  await assert.rejects(() => placeSportsTicket({ ticketId: 'sports:race:reject:01', ownerId: user._id, stakeSol: 0.01, acceptOddsChange: false, legs: [shown] }), /Odds changed/);
  assert.equal((await getUnifiedBalance(user._id.toString())).availableMinor, 10_000_000_000n);
  const rejected = await SportsTicket.findOne({ ticketId: 'sports:race:reject:01' }); assert.equal(rejected?.status, 'REJECTED');
});

test('single ticket acceptance and WIN settlement are idempotent in the ledger', async () => {
  const market: any = await SportsMarket.findOne({ status: 'ACTIVE' }); const leg = quote(market);
  const ticket: any = await placeSportsTicket({ ticketId: 'sports:single:win:001', ownerId: user._id, stakeSol: 0.01, acceptOddsChange: false, legs: [leg] });
  assert.equal(ticket.status, 'ACCEPTED');
  await SandboxSportsbookProvider.publishSettlement(ticket.providerTicketId, [{ selectionId: leg.selectionId, result: 'WIN' }]);
  await pollSportsSettlements(); const once = (await getUnifiedBalance(user._id.toString())).availableMinor;
  await pollSportsSettlements(); const twice = (await getUnifiedBalance(user._id.toString())).availableMinor;
  const settled = await SportsTicket.findOne({ ticketId: ticket.ticketId });
  assert.equal(once, twice); assert.equal(settled?.status, 'SETTLED');
  await assert.rejects(() => applySportsSettlement({ providerSettlementId: settled!.providerSettlementIds[0], providerTicketId: ticket.providerTicketId, legs: [{ selectionId: leg.selectionId, result: 'LOSS' }] }), /reused settlement ID/);
});

test('accumulator supports partial updates and VOID legs without early payout', async () => {
  const first: any = await SportsMarket.findOne({ status: 'ACTIVE' }); const second: any = await SportsMarket.findOne({ status: 'ACTIVE', eventId: { $ne: first.eventId } }); const markets = [first, second]; assert.notEqual(markets[0].eventId, markets[1].eventId);
  const legs = [quote(markets[0]), quote(markets[1])];
  const ticket: any = await placeSportsTicket({ ticketId: 'sports:acca:void:001', ownerId: user._id, stakeSol: 0.01, acceptOddsChange: false, legs });
  await SandboxSportsbookProvider.publishSettlement(ticket.providerTicketId, [{ selectionId: legs[0].selectionId, result: 'WIN' }]); await pollSportsSettlements();
  assert.equal((await SportsTicket.findOne({ ticketId: ticket.ticketId }))?.status, 'ACCEPTED');
  await SandboxSportsbookProvider.publishSettlement(ticket.providerTicketId, [{ selectionId: legs[1].selectionId, result: 'VOID' }]); await pollSportsSettlements();
  const settled = await SportsTicket.findOne({ ticketId: ticket.ticketId }); assert.equal(settled?.status, 'SETTLED'); assert.ok(BigInt(settled!.payoutMinor!.toString()) > 10_000_000n);
});

test('stale markets are suspended from acceptance', async () => {
  const market: any = await SportsMarket.findOne({ status: 'ACTIVE', isLive: false }); const leg = quote(market);
  await SportsMarket.updateOne({ _id: market._id }, { $set: { providerUpdatedAt: new Date(0) } }); await markStaleMarkets();
  await assert.rejects(() => placeSportsTicket({ ticketId: 'sports:stale:reject1', ownerId: user._id, stakeSol: 0.01, acceptOddsChange: false, legs: [leg] }), /unavailable, suspended, or stale/);
  sandboxFeed.updateOdds(leg.selectionId, BigInt(leg.displayedOddsMillionths)); await ingestSportsFeed();
});

test('live tickets are accepted with provider-authoritative live context', async () => {
  const market: any = await SportsMarket.findOne({ isLive: true, status: 'ACTIVE' }); assert.ok(market);
  const ticket: any = await placeSportsTicket({ ticketId: 'sports:live:ticket:001', ownerId: user._id, stakeSol: 0.01, acceptOddsChange: false, legs: [quote(market)] });
  assert.equal(ticket.status, 'ACCEPTED'); assert.equal(ticket.context, 'LIVE');
});

test('Bet Builder accepts same-event correlations only as an explicit provider product', async () => {
  const event: any = await SportsMarket.findOne({ status: 'ACTIVE' });
  const markets: any[] = await SportsMarket.find({ eventId: event.eventId, status: 'ACTIVE' }).limit(2); assert.equal(markets.length, 2);
  const legs = markets.map(market => quote(market));
  await assert.rejects(() => placeSportsTicket({ ticketId: 'sports:builder:standard:01', ownerId: user._id, stakeSol: 0.01, acceptOddsChange: false, product: 'STANDARD', legs }), /require Bet Builder/);
  const ticket: any = await placeSportsTicket({ ticketId: 'sports:builder:accepted:01', ownerId: user._id, stakeSol: 0.01, acceptOddsChange: false, product: 'BET_BUILDER', legs });
  assert.equal(ticket.status, 'ACCEPTED'); assert.equal(ticket.type, 'BET_BUILDER'); assert.ok(BigInt(ticket.maxPayoutMinor.toString()) > 0n);
  await SandboxSportsbookProvider.publishSettlement(ticket.providerTicketId, legs.map(leg => ({ selectionId: leg.selectionId, result: 'WIN' as const }))); await pollSportsSettlements();
  const settled: any = await SportsTicket.findOne({ ticketId: ticket.ticketId }); assert.equal(settled.status, 'SETTLED'); assert.equal(settled.payoutMinor.toString(), ticket.maxPayoutMinor.toString());
});

test('cashout uses an expiring provider quote and settles the reservation exactly once', async () => {
  const market: any = await SportsMarket.findOne({ status: 'ACTIVE' }); const before = (await getUnifiedBalance(user._id.toString())).availableMinor;
  const ticket: any = await placeSportsTicket({ ticketId: 'sports:cashout:accepted:01', ownerId: user._id, stakeSol: 0.01, acceptOddsChange: false, legs: [quote(market)] });
  const offered = await quoteSportsCashout(user._id, ticket.ticketId); assert.equal(offered.amountMinor, '8500000');
  const cashed: any = await acceptSportsCashout(user._id, ticket.ticketId, offered.quoteId); assert.equal(cashed.status, 'CASHED_OUT');
  await acceptSportsCashout(user._id, ticket.ticketId, offered.quoteId);
  assert.equal((await getUnifiedBalance(user._id.toString())).availableMinor, before - 1_500_000n);
  const another: any = await placeSportsTicket({ ticketId: 'sports:cashout:expired:01', ownerId: user._id, stakeSol: 0.01, acceptOddsChange: false, legs: [quote(market)] });
  const expired = await quoteSportsCashout(user._id, another.ticketId); await SportsCashoutQuote.collection.updateOne({ quoteId: expired.quoteId }, { $set: { expiresAt: new Date(0) } });
  await assert.rejects(() => acceptSportsCashout(user._id, another.ticketId, expired.quoteId), /expired/);
  assert.equal((await SportsTicket.findOne({ ticketId: another.ticketId }))?.status, 'ACCEPTED');
});

test('Sports HTTP API and WebSocket stream expose versioned provider odds end to end', async () => {
  const stale: any = await SportsMarket.findOne();
  sandboxFeed.updateOdds(stale.selections[0].selectionId, BigInt(stale.selections[0].oddsMillionths.toString()) + 10_000n);
  await ingestSportsFeed();
  const market: any = await SportsMarket.findOne({ status: 'ACTIVE' });
  const token = jwt.sign({ id: user._id.toString(), walletAddress: user.walletAddress }, getJwtSecret(), { expiresIn: '5m', algorithm: 'HS256', issuer: 'casino-mini-mvp', audience: 'casino-mini-mvp-web' });
  const server = app.listen(0); await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  const port = (server.address() as AddressInfo).port; const origin = `http://127.0.0.1:${port}`;
  const eventsResponse = await fetch(`${origin}/api/sports/events`); const events: any = await eventsResponse.json();
  assert.equal(eventsResponse.status, 200); assert.ok(events.events.length >= 11); assert.equal(typeof events.events[0].markets[0].selections[0].oddsMillionths, 'string');
  const ticketResponse = await fetch(`${origin}/api/sports/tickets`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ ticketId: 'sports:http:e2e:001', stakeSol: 0.01, acceptOddsChange: false, legs: [quote(market)] }) });
  const ticket: any = await ticketResponse.json(); assert.equal(ticketResponse.status, 201, JSON.stringify(ticket)); assert.equal(ticket.ticket.status, 'ACCEPTED');
  const sockets = attachSportsOddsStream(server);
  const streamed: any = await new Promise((resolve, reject) => { const client = new WebSocket(`ws://127.0.0.1:${port}/api/sports/stream`); const timeout = setTimeout(() => reject(new Error('Sports odds WebSocket timed out')), 4_000); client.once('message', data => { clearTimeout(timeout); client.close(); resolve(JSON.parse(data.toString())); }); client.once('error', reject); });
  assert.equal(streamed.type, 'odds'); assert.ok(streamed.markets.every((value: any) => Number.isSafeInteger(value.version)));
  await new Promise<void>(resolve => sockets.close(() => resolve())); await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

test('external casino catalog settles provider outcome through the unified ledger', async () => {
  const games = await listCatalog(); assert.equal(games.length, 4); const launch = await launchCatalogGame(user._id, games[0].gameId);
  const first: any = await placeCatalogWager(user._id, { wagerId: 'catalog:wager:integration:001', sessionId: launch.sessionId, stakeSol: 0.001 });
  assert.equal(first.wager.status, 'SETTLED'); assert.ok(['WIN', 'LOSS'].includes(first.wager.outcome));
  const again: any = await placeCatalogWager(user._id, { wagerId: 'catalog:wager:integration:001', sessionId: launch.sessionId, stakeSol: 0.001 });
  assert.equal(again.wager.wagerId, first.wager.wagerId); assert.equal(again.newBalance, first.newBalance);
});
