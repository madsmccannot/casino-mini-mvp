import { Response } from 'express';
import { AuthRequest } from '../bets/validateBet.middleware';
import { getSportsHistory, getSportsUserBalanceSol, placeSportsTicket, serializeSportsTicket } from '../../sportsbook/tickets/ticket.service';

export const createSportsTicket = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const ticket = await placeSportsTicket({ ...req.body, ownerId: req.user._id });
    return res.status(ticket?.status === 'ACCEPTED' ? 201 : 200).json({ ticket: serializeSportsTicket(ticket), newBalance: await getSportsUserBalanceSol(req.user._id.toString()) });
  } catch (error: any) { return res.status(400).json({ error: error.message }); }
};

export const listMySportsTickets = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  return res.json({ tickets: await getSportsHistory(req.user._id, Number(req.query.limit) || 50) });
};
