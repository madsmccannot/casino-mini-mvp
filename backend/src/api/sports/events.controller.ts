import { Request, Response } from 'express';
import { sportsbookRouter } from '../../sportsbook/SportsbookRouter';
import { SportsEvent } from '../../sportsbook/models/SportsEvent';
import { SportsMarket } from '../../sportsbook/models/SportsMarket';

const marketJson = (market: any) => ({
  marketId: market.marketId, eventId: market.eventId, type: market.type, name: market.name, line: market.line,
  isLive: market.isLive, status: market.status, version: market.version, updatedAt: market.providerUpdatedAt,
  selections: market.selections.map((selection: any) => ({ selectionId: selection.selectionId, name: selection.name, oddsMillionths: selection.oddsMillionths.toString(), status: selection.status, participant: selection.participant, boostId: selection.boostId, boostLabel: selection.boostLabel, originalOddsMillionths: selection.originalOddsMillionths?.toString() }))
});

export const listSportsEvents = async (req: Request, res: Response) => {
  try {
    sportsbookRouter.selected();
    const query: any = {};
    if (req.query.sport) query.sport = String(req.query.sport);
    if (req.query.live === 'true') query.status = 'LIVE';
    else query.status = { $in: ['SCHEDULED', 'LIVE'] };
    const events = await SportsEvent.find(query).sort({ startsAt: 1 }).limit(200).lean();
    const markets = await SportsMarket.find({ eventId: { $in: events.map(event => event.eventId) } }).lean();
    const byEvent = new Map<string, any[]>();
    markets.forEach(market => byEvent.set(market.eventId, [...(byEvent.get(market.eventId) || []), marketJson(market)]));
    return res.json({ events: events.map(event => ({ ...event, markets: byEvent.get(event.eventId) || [] })) });
  } catch (error: any) { return res.status(503).json({ error: error.message }); }
};

export const getSportsEvent = async (req: Request, res: Response) => {
  try {
    sportsbookRouter.selected();
    const event = await SportsEvent.findOne({ eventId: req.params.eventId }).lean();
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const markets = await SportsMarket.find({ eventId: event.eventId }).lean();
    return res.json({ event: { ...event, markets: markets.map(marketJson) } });
  } catch (error: any) { return res.status(503).json({ error: error.message }); }
};
