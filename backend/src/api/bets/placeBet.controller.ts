import { Response } from 'express';
import { AuthRequest } from './validateBet.middleware';
import { User } from '../../models/User'; 
import { Bet } from '../../models/Bet'; // <--- IMPORTAR O MODELO

// Importar os serviços
import { playCoinflip } from '../../games/coinflip.service';
import { playDice } from '../../games/dice.service';
import { playPlinko } from '../../games/plinko.service';
import { playRoulette } from '../../games/roulette.service';
import { minesService } from '../../games/mines.service';
import { riskEngine } from '../../bankroll/riskEngine'; 

// Helper para gravar histórico
const logBetHistory = async (userId: any, game: string, wager: number, result: any) => {
    try {
        await Bet.create({
            userId,
            game,
            wager,
            payout: result.payout,
            multiplier: result.multiplier,
            profit: result.payout - wager,
            outcome: result.payout > 0 ? 'win' : 'loss',
            details: result.outcome || result, // Guarda detalhes (ex: qual bomba explodiu)
            timestamp: new Date()
        });
    } catch (err) {
        console.error("Failed to log bet history:", err);
        // Não paramos o request se o log falhar, mas registamos o erro
    }
};

export const placeBet = async (req: AuthRequest, res: Response) => {
  const { game, betAmount, params, action } = req.body; 
  
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

  let gameResult;
  let newBalance = 0;

  try {
    // --- JOGOS INSTANTÂNEOS ---
    if (game !== 'mines') {
      
      // 1. Validação Risco
      const potentialMultiplier = params?.multiplier || 2; 
      const riskValidation = await riskEngine.validateBet(game, betAmount, potentialMultiplier);
      if (riskValidation !== true) return res.status(400).json({ success: false, error: riskValidation });

      // 2. Dedução
      const userAfterBet = await User.findOneAndUpdate(
        { _id: userId, balance: { $gte: betAmount } },
        { $inc: { balance: -betAmount, totalWagered: betAmount } },
        { new: true }
      );
      if (!userAfterBet) return res.status(400).json({ success: false, error: "Insufficient funds" });

      // 3. Execução
      try {
        switch (game) {
          case 'coinflip': gameResult = await playCoinflip(betAmount, params); break;
          case 'dice': gameResult = await playDice(betAmount, params); break;
          case 'plinko': gameResult = await playPlinko(betAmount, params); break;
          case 'roulette': gameResult = await playRoulette(betAmount, params); break;
          default: throw new Error('Game not supported');
        }
      } catch (gameError: any) {
        // Reembolso
        await User.findByIdAndUpdate(userId, { $inc: { balance: betAmount, totalWagered: -betAmount } });
        throw new Error(gameError.message || "Game failed, bet refunded.");
      }

      // 4. Pagamento e Histórico
      newBalance = userAfterBet.balance;

      if (gameResult.payout > 0) {
        const userAfterPayout = await User.findByIdAndUpdate(
          userId,
          { $inc: { balance: gameResult.payout } },
          { new: true }
        );
        if (userAfterPayout) newBalance = userAfterPayout.balance;
      }

      // GRAVAR HISTÓRICO
      await logBetHistory(userId, game, betAmount, gameResult);
    } 
    
    // --- MINES (Stateful) ---
    else {
      
      if (action === 'bet') {
        const userAfterBet = await User.findOneAndUpdate(
          { _id: userId, balance: { $gte: betAmount } },
          { $inc: { balance: -betAmount, totalWagered: betAmount } },
          { new: true }
        );
        if (!userAfterBet) return res.status(400).json({ success: false, error: "Insufficient funds" });

        try {
          gameResult = await minesService.startGame(userId, betAmount, params); 
          newBalance = userAfterBet.balance;
          // Nota: Não gravamos histórico no 'bet' do Mines, só quando o jogo acaba.
        } catch (err) {
          await User.findByIdAndUpdate(userId, { $inc: { balance: betAmount, totalWagered: -betAmount } });
          throw err;
        }
      } 
      else if (action === 'reveal') {
        gameResult = await minesService.reveal(userId, params); 
        const currentUser = await User.findById(userId);
        newBalance = currentUser ? currentUser.balance : 0;

        // Se explodiu (Boom), o jogo acabou -> Gravar Histórico (Loss)
        if (gameResult.outcome?.status === 'boom') {
             await logBetHistory(userId, 'mines', gameResult.wager, gameResult);
        }
      } 
      else if (action === 'cashout') {
        gameResult = await minesService.cashout(userId, params); 
        
        if (gameResult.payout > 0) {
          const userAfterPayout = await User.findByIdAndUpdate(
            userId,
            { $inc: { balance: gameResult.payout } },
            { new: true }
          );
          newBalance = userAfterPayout ? userAfterPayout.balance : 0;
        } else {
             const currentUser = await User.findById(userId);
             newBalance = currentUser ? currentUser.balance : 0;
        }

        // Cashout é sempre fim de jogo -> Gravar Histórico (Win)
        await logBetHistory(userId, 'mines', gameResult.wager, gameResult);
      } 
      else {
        throw new Error('Invalid Mines action');
      }
    }

    return res.status(200).json({
      success: true,
      game,
      result: gameResult,
      newBalance
    });

  } catch (error: any) {
    console.error(`Error processing ${game}:`, error.message);
    return res.status(400).json({ success: false, error: error.message || 'Error processing bet' });
  }
};