import { Response } from 'express';
import { AuthRequest } from './validateBet.middleware';
import { User } from '../../models/User'; 

// Importar os serviços
import { playCoinflip } from '../../games/coinflip.service';
import { playDice } from '../../games/dice.service';
import { playPlinko } from '../../games/plinko.service';
import { playRoulette } from '../../games/roulette.service';
import { minesService } from '../../games/mines.service';
// Importar o motor de risco
import { riskEngine } from '../../bankroll/riskEngine'; 

export const placeBet = async (req: AuthRequest, res: Response) => {
  const { game, betAmount, params, action } = req.body; 
  
  // O middleware AuthRequest garante que req.user existe
  const user: any = req.user; 

  let gameResult;

  try {
    // --- LÓGICA PARA JOGOS INSTANTÂNEOS ---
    if (game !== 'mines') {
      
      // 1. VALIDAÇÃO DE RISCO
      const potentialMultiplier = params?.multiplier || 2; 
      const riskValidation = await riskEngine.validateBet(game, betAmount, potentialMultiplier);

      if (riskValidation !== true) {
        return res.status(400).json({ success: false, error: riskValidation });
      }

      // 2. Deduzir saldo e atualizar total apostado
      user.balance -= betAmount;
      user.totalWagered += betAmount;
      
      // 3. Executar o Jogo (TODOS COM AWAIT AGORA)
      switch (game) {
        case 'coinflip':
          gameResult = await playCoinflip(betAmount, params); 
          break;
        case 'dice':
          gameResult = await playDice(betAmount, params); 
          break;
        case 'plinko':
          gameResult = await playPlinko(betAmount, params); 
          break;
        case 'roulette':
          gameResult = await playRoulette(betAmount, params); 
          break;
        default:
          throw new Error('Game not supported');
      }

      // 4. Processar Pagamento (se ganhou)
      if (gameResult.payout > 0) {
        user.balance += gameResult.payout;
      }
      
      // Salvar estado do utilizador
      await user.save();
    } 
    
    // --- LÓGICA ESPECIAL PARA MINES (Stateful - Sync) ---
    else {
      
      if (action === 'bet') {
        user.balance -= betAmount;
        user.totalWagered += betAmount;
        await user.save();

        gameResult = minesService.startGame(betAmount, params); 
      } 
      else if (action === 'reveal') {
        gameResult = minesService.reveal(params); 
      } 
      else if (action === 'cashout') {
        gameResult = minesService.cashout(params); 
        
        if (gameResult.payout > 0) {
          user.balance += gameResult.payout;
          await user.save();
        }
      }
      else {
        throw new Error('Invalid Mines action');
      }
    }

    // 5. Resposta final ao Cliente
    return res.status(200).json({
      success: true,
      game,
      result: gameResult,
      newBalance: user.balance
    });

  } catch (error: any) {
    console.error(`Error processing ${game}:`, error.message);
    
    return res.status(400).json({ 
      success: false, 
      error: error.message || 'Error processing bet' 
    });
  }
};