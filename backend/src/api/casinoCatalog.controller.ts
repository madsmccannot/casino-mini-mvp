import { Response, Request } from 'express';
import { AuthRequest } from './bets/validateBet.middleware';
import { launchCatalogGame, listCatalog, placeCatalogWager } from '../casinoCatalog/catalog.service';
export const getCatalog = async (_req: Request, res: Response) => { try { return res.json({ games: await listCatalog() }); } catch (error: any) { return res.status(503).json({ error: error.message }); } };
export const launchCatalog = async (req: AuthRequest, res: Response) => { if (!req.user) return res.status(401).json({ error: 'Unauthorized' }); try { return res.json({ launch: await launchCatalogGame(req.user._id, req.body.gameId) }); } catch (error: any) { return res.status(400).json({ error: error.message }); } };
export const wagerCatalog = async (req: AuthRequest, res: Response) => { if (!req.user) return res.status(401).json({ error: 'Unauthorized' }); try { const result = await placeCatalogWager(req.user._id, req.body); return res.status(201).json({ wager: result.wager, newBalance: result.newBalance }); } catch (error: any) { return res.status(400).json({ error: error.message }); } };
