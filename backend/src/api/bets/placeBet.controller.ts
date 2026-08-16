import { Response } from 'express';
import { AuthRequest } from './validateBet.middleware';
import { Bet } from '../../models/Bet';
import { minesService } from '../../games/mines.service';
import { riskEngine } from '../../bankroll/riskEngine';
import { getUserBalanceUsdc, refundCasinoBet, reserveCasinoBet, settleCasinoBet } from '../../ledger/casinoLedger.service';
import { GameSession } from '../../models/GameSession';
import { authorizeBetBankroll, releaseBetBankroll, settleBetBankroll } from '../../bankroll/betBankroll.service';
import { maxMultiplierFor } from '../../games/gameRegistry';
import { executeInstantGame, standardizedStats } from '../../games/gameExecutor';
import { consumeFairnessCommit } from '../../games/fairnessCommit.service';
import { blackjackService } from '../../games/blackjack.service';

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9:_-]{16,128}$/;

const completedResponse = async (userId: string, game: string, result: any) => ({
  success: true,
  game,
  result,
  newBalance: await getUserBalanceUsdc(userId),
  currency: 'USDC'
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
      stats: standardizedStats(result),
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

const reserveBet = async (userId: any, betId: string, game: string, wager: number, maxMultiplier: number) => {
  await authorizeBetBankroll(betId, game, wager, maxMultiplier);
  try {
    await reserveCasinoBet(userId, betId, wager);
    return await createPendingBet(userId, betId, game, wager);
  } catch (error) {
    await releaseBetBankroll(betId).catch(() => undefined);
    throw error;
  }
};

const settleBet = async (betId: string, payout: number, result: any) => {
  await settleBetBankroll(betId, payout, result);
  await settleCasinoBet(betId, payout);
  await finishBet(betId);
};

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
      await settleBet(existing.betId, existing.payout, existing.details);
      return res.status(200).json(await completedResponse(userId.toString(), existing.game, existing.details));
    }
    if (existing?.status === 'FUNDS_RESERVED' && existing.game === 'blackjack') {
      const resumed = await blackjackService.resume(userId.toString(), existing.betId);
      if (resumed) {
        if (resumed.outcome.status !== 'active') {
          await markResultReady(existing.betId, resumed);
          await settleBet(existing.betId, resumed.payout, resumed);
        }
        return res.status(200).json(await completedResponse(userId.toString(), existing.game, resumed));
      }
    }
    if (existing && existing.game !== game) {
      return res.status(409).json({ success: false, error: 'Idempotency key already belongs to another game' });
    }

    if (game !== 'mines' && game !== 'blackjack') {
      const potentialMultiplier = maxMultiplierFor(game, params);
      const riskValidation = await riskEngine.validateBet(game, betAmount, potentialMultiplier);
      if (riskValidation !== true) return res.status(400).json({ success: false, error: riskValidation });

      await reserveBet(userId, idempotencyKey, game, betAmount, potentialMultiplier);
      let result: any;
      try {
        const commitment = await consumeFairnessCommit(userId, params?.fairnessCommitId, params?.clientSeed, params?.nonce);
        result = await executeInstantGame(game, betAmount, params, commitment);
        await markResultReady(idempotencyKey, result);
        await settleBet(idempotencyKey, result.payout, result);
        return res.status(200).json(await completedResponse(userId.toString(), game, result));
      } catch (error) {
        const pending = await Bet.findOne({ betId: idempotencyKey, status: 'FUNDS_RESERVED' });
        if (pending) {
          await refundCasinoBet(idempotencyKey).catch(() => undefined);
          await releaseBetBankroll(idempotencyKey).catch(() => undefined);
          await Bet.updateOne({ _id: pending._id, status: 'FUNDS_RESERVED' }, { $set: { status: 'REFUNDED' } });
        }
        throw error;
      }
    }

    if (game === 'blackjack') {
      if (action === 'bet') {
        const maxMultiplier = maxMultiplierFor('blackjack', params);
        const validation = await riskEngine.validateBet('blackjack', betAmount, maxMultiplier);
        if (validation !== true) return res.status(400).json({ success: false, error: validation });
        await reserveBet(userId, idempotencyKey, game, betAmount, maxMultiplier);
        try {
          const commitment = await consumeFairnessCommit(userId, params?.fairnessCommitId, params?.clientSeed, params?.nonce);
          const result = await blackjackService.start(userId.toString(), idempotencyKey, betAmount, params, commitment);
          if (result.outcome.status !== 'active') {
            await markResultReady(idempotencyKey, result);
            await settleBet(idempotencyKey, result.payout, result);
          }
          return res.status(200).json(await completedResponse(userId.toString(), game, result));
        } catch (error) {
          await refundCasinoBet(idempotencyKey).catch(() => undefined);
          await releaseBetBankroll(idempotencyKey).catch(() => undefined);
          await Bet.updateOne({ betId: idempotencyKey }, { $set: { status: 'REFUNDED' } });
          throw error;
        }
      }
      if (action === 'hit' || action === 'stand') {
        const result = action === 'hit'
          ? await blackjackService.hit(userId.toString(), params?.sessionId)
          : await blackjackService.stand(userId.toString(), params?.sessionId);
        if (result.outcome.status !== 'active') {
          await markResultReady(result.betId, result);
          await settleBet(result.betId, result.payout, result);
        }
        return res.status(200).json(await completedResponse(userId.toString(), game, result));
      }
      return res.status(400).json({ success: false, error: 'Invalid Blackjack action' });
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
      const maxMultiplier = maxMultiplierFor('mines', params);
      const riskValidation = await riskEngine.validateBet('mines', betAmount, maxMultiplier);
      if (riskValidation !== true) return res.status(400).json({ success: false, error: riskValidation });
      await reserveBet(userId, idempotencyKey, game, betAmount, maxMultiplier);
      try {
        const commitment = await consumeFairnessCommit(userId, params?.fairnessCommitId, params?.clientSeed, params?.nonce);
        const result = await minesService.startGame(userId.toString(), idempotencyKey, betAmount, params, commitment);
        return res.status(200).json(await completedResponse(userId.toString(), game, result));
      } catch (error) {
        await refundCasinoBet(idempotencyKey).catch(() => undefined);
        await releaseBetBankroll(idempotencyKey).catch(() => undefined);
        await Bet.updateOne({ betId: idempotencyKey }, { $set: { status: 'REFUNDED' } });
        throw error;
      }
    }

    if (action === 'reveal') {
      const result = await minesService.reveal(userId.toString(), params);
      if (result.outcome?.status === 'boom') {
        await markResultReady(result.betId, result);
        await settleBet(result.betId, 0, result);
      }
      return res.status(200).json(await completedResponse(userId.toString(), game, result));
    }

    if (action === 'cashout') {
      const result = await minesService.cashout(userId.toString(), params);
      await markResultReady(result.betId, result);
      await settleBet(result.betId, result.payout, result);
      return res.status(200).json(await completedResponse(userId.toString(), game, result));
    }

    return res.status(400).json({ success: false, error: 'Invalid Mines action' });
  } catch (error: any) {
    console.error(`Error processing ${game}:`, error.message);
    return res.status(400).json({ success: false, error: error.message || 'Error processing bet' });
  }
};
