import { Response } from 'express';
import { AuthRequest } from '../bets/validateBet.middleware';
import { ingestSportsFeed, markStaleMarkets } from '../../sportsbook/feeds/eventFeed.service';
import { SportsProviderState } from '../../sportsbook/models/SportsProviderState';
import { getSportsLiability } from '../../sportsbook/risk/liability.service';
import { pollSportsSettlements } from '../../sportsbook/tickets/settlement.service';
import { SandboxSportsbookProvider } from '../../sportsbook/providers/SandboxSportsbookProvider';

const admin = (req: AuthRequest, res: Response) => {
  if (!req.user?.isAdmin) { res.status(403).json({ error: 'Access Denied' }); return false; }
  return true;
};
export const getSportsOperations = async (req: AuthRequest, res: Response) => {
  if (!admin(req, res)) return;
  return res.json({ providers: await SportsProviderState.find().lean(), liability: await getSportsLiability() });
};
export const runSportsIngest = async (req: AuthRequest, res: Response) => {
  if (!admin(req, res)) return;
  try { return res.json({ ingest: await ingestSportsFeed(), staleMarked: await markStaleMarkets() }); }
  catch (error: any) { return res.status(503).json({ error: error.message }); }
};
export const runSportsSettlement = async (req: AuthRequest, res: Response) => {
  if (!admin(req, res)) return;
  try { return res.json({ processed: await pollSportsSettlements() }); }
  catch (error: any) { return res.status(503).json({ error: error.message }); }
};
export const publishSandboxSettlement = async (req: AuthRequest, res: Response) => {
  if (!admin(req, res)) return;
  if (process.env.SPORTSBOOK_SANDBOX_MODE !== 'enabled' || process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Sandbox settlement endpoint is disabled' });
  try { return res.status(201).json(await SandboxSportsbookProvider.publishSettlement(req.body.providerTicketId, req.body.legs)); }
  catch (error: any) { return res.status(400).json({ error: error.message }); }
};
