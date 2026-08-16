import { Response } from 'express';
import { AuthRequest } from './validateBet.middleware';
import { Bet } from '../../models/Bet';
import { playCoinflip } from '../../games/coinflip.service';
import { playDice } from '../../games/dice.service';
import { playPlinko } from '../../games/plinko.service';
import { playRoulette } from '../../games/roulette.service';
import { minesService } from '../../games/mines.service';
import { riskEngine } from '../../bankroll/riskEngine';
import { getUserBalanceSol, refundCasinoBet, reserveCasinoBet, settleCasinoBet } from '../../ledger/casinoLedger.service';
import { GameSession } from '../../models/GameSession';

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9:_-]{16,128}$/;

const completedResponse = async (userId: string, game: string, result: any) => ({
  success: true,
  game,
  result,
  newBalance: await getUserBalanceSol(userId)
});

const createPendingBet = async (userId: any, betId: string, game: string, wager: number) => {
  try {
    return await Bet.create({
      betId,
      userId,
      game,
      wager,
      payout: 0,
      multiplier: 0,
      profit: -wager,
      outcome: 'pending',
      status: 'FUNDS_RESERVED',
      details: null,
      timestamp: new Date()
    });
  } catch (error: any) {
    if (error?.code === 11000) return Bet.findOne({ betId, userId });
    throw error;
  }
};

const markResultReady = async (betId: string, result: any) => Bet.findOneAndUpdate(
  { betId, status: 'FUNDS_RESERVED' },
  {
    $set: {
      payout: result.payout,
      multiplier: result.multiplier,
      profit: result.payout - result.wager,
      outcome: result.payout > 0 ? 'win' : 'loss',
      details: result,
      status: 'RESULT_READY'
    }
  },
  { returnDocument: 'after' }
);

const finishBet = async (betId: string) => Bet.findOneAndUpdate(
  { betId, status: 'RESULT_READY' },
  { $set: { status: 'SETTLED' } },
  { returnDocument: 'after' }
);

export const placeBet = async (req: AuthRequest, res: Response) => {
  const { game, betAmount, params, action = 'bet', idempotencyKey } = req.body;
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  if (typeof idempotencyKey !== 'string' || !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    return res.status(400).json({ success: false, error: 'A valid idempotencyKey is required' });
  }

  try {
    const existing = await Bet.findOne({ betId: idempotencyKey, userId });
    if (existing?.status === 'SETTLED') {
      return res.status(200).json(await completedResponse(userId.toString(), existing.game, existing.details));
    }
    if (existing?.status === 'RESULT_READY') {
      await settleCasinoBet(existing.betId, existing.payout);
      await finishBet(existing.betId);
      return res.status(200).json(await completedResponse(userId.toString(), existing.game, existing.details));
    }
    if (existing && existing.game !== game) {
      return res.status(409).json({ success: false, error: 'Idempotency key already belongs to another game' });
    }

    if (game !== 'mines') {
      const potentialMultiplier = params?.multiplier || 2;
      const riskValidation = await riskEngine.validateBet(game, betAmount, potentialMultiplier);
      if (riskValidation !== true) return res.status(400).json({ success: false, error: riskValidation });

      await reserveCasinoBet(userId, idempotencyKey, betAmount);
      await createPendingBet(userId, idempotencyKey, game, betAmount);
      let result: any;
      try {
        switch (game) {
          case 'coinflip': result = await playCoinflip(betAmount, params); break;
          case 'dice': result = await playDice(betAmount, params); break;
          case 'plinko': result = await playPlinko(betAmount, params); break;
          case 'roulette': result = await playRoulette(betAmount, params); break;
          default: throw new Error('Game not supported');
        }
        await markResultReady(idempotencyKey, result);
        await settleCasinoBet(idempotencyKey, result.payout);
        await finishBet(idempotencyKey);
        return res.status(200).json(await completedResponse(userId.toString(), game, result));
      } catch (error) {
        const pending = await Bet.findOne({ betId: idempotencyKey, status: 'FUNDS_RESERVED' });
        if (pending) {
          await refundCasinoBet(idempotencyKey).catch(() => undefined);
          await Bet.updateOne({ _id: pending._id, status: 'FUNDS_RESERVED' }, { $set: { status: 'REFUNDED' } });
        }
        throw error;
      }
    }

    if (action === 'bet') {
      if (existing?.status === 'FUNDS_RESERVED') {
        const session = await GameSession.findOne({ betId: idempotencyKey, userId, active: true });
        if (session) {
          const result = {
            success: true,
            game: 'mines',
            wager: session.wager,
            payout: 0,
            multiplier: 1,
            profit: 0,
            outcome: { status: 'active', revealed: session.state.revealed },
            sessionId: session.sessionId,
            betId: session.betId,
            clientSeed: 'mines-session',
            serverSeed: 'hidden',
            commitHash: session.commitHash
          };
          return res.status(200).json(await completedResponse(userId.toString(), game, result));
        }
      }
      await reserveCasinoBet(userId, idempotencyKey, betAmount);
      await createPendingBet(userId, idempotencyKey, game, betAmount);
      try {
        const result = await minesService.startGame(userId.toString(), idempotencyKey, betAmount, params);
        return res.status(200).json(await completedResponse(userId.toString(), game, result));
      } catch (error) {
        await refundCasinoBet(idempotencyKey).catch(() => undefined);
        await Bet.updateOne({ betId: idempotencyKey }, { $set: { status: 'REFUNDED' } });
        throw error;
      }
    }

    if (action === 'reveal') {
      const result = await minesService.reveal(userId.toString(), params);
      if (result.outcome?.status === 'boom') {
        await markResultReady(result.betId, result);
        await settleCasinoBet(result.betId, 0);
        await finishBet(result.betId);
      }
      return res.status(200).json(await completedResponse(userId.toString(), game, result));
    }

    if (action === 'cashout') {
      const result = await minesService.cashout(userId.toString(), params);
      await markResultReady(result.betId, result);
      await settleCasinoBet(result.betId, result.payout);
      await finishBet(result.betId);
      return res.status(200).json(await completedResponse(userId.toString(), game, result));
    }

    return res.status(400).json({ success: false, error: 'Invalid Mines action' });
  } catch (error: any) {
    console.error(`Error processing ${game}:`, error.message);
    return res.status(400).json({ success: false, error: error.message || 'Error processing bet' });
  }
};
