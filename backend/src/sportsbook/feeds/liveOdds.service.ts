import { Server } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { SportsMarket } from '../models/SportsMarket';
import { ingestSportsFeed, markStaleMarkets } from './eventFeed.service';
import { pollSportsSettlements } from '../tickets/settlement.service';
import { recoverReservedSportsTickets } from '../tickets/ticket.service';

export const attachSportsOddsStream = (server: Server) => {
  const sockets = new WebSocketServer({ server, path: '/api/sports/stream', maxPayload: 1024, perMessageDeflate: false });
  sockets.on('connection', client => { if (sockets.clients.size > 1000) client.close(1013, 'Realtime capacity reached'); });
  let cursor = new Date(0); let running = false; let lastIngest = 0; let lastSettlement = 0;
  const timer = setInterval(async () => {
    if (running) return; running = true;
    try {
      if (Date.now() - lastIngest >= 1_000) {
        await ingestSportsFeed(); await markStaleMarkets(); lastIngest = Date.now();
      }
      if (Date.now() - lastSettlement >= 2_000) { await recoverReservedSportsTickets(); await pollSportsSettlements(); lastSettlement = Date.now(); }
      const changed = await SportsMarket.find({ updatedAt: { $gt: cursor } }).sort({ updatedAt: 1 }).limit(1000).lean();
      if (changed.length) {
        cursor = changed[changed.length - 1].updatedAt;
        const payload = JSON.stringify({ type: 'odds', markets: changed.map(market => ({ marketId: market.marketId, eventId: market.eventId, status: market.status, version: market.version, updatedAt: market.providerUpdatedAt, selections: market.selections.map(selection => ({ selectionId: selection.selectionId, name: selection.name, oddsMillionths: selection.oddsMillionths.toString(), status: selection.status })) })) });
        for (const client of sockets.clients) if (client.readyState === WebSocket.OPEN) client.send(payload);
      }
    } catch { /* disabled/unconfigured providers remain quietly fail-closed */ }
    finally { running = false; }
  }, 250);
  timer.unref(); sockets.on('close', () => clearInterval(timer)); return sockets;
};
