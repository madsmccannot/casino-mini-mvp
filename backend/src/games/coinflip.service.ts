import { GameResult } from '../types';
import { switchboardRNG } from '../rng/switchboard'; 
import { rngService } from '../rng/commitReveal'; 

interface CoinflipParams {
  side: 'heads' | 'tails';
  clientSeed?: string; 
  nonce?: number;
}

export const playCoinflip = async (wager: number, params: CoinflipParams): Promise<GameResult> => {
  const { side, clientSeed = 'default', nonce = 0 } = params;
  
  if (wager <= 0) throw new Error("Aposta inválida");
  if (!['heads', 'tails'].includes(side)) throw new Error("Escolha inválida (heads/tails)");

  // 1. Obter número seguro (0 a 1) do Switchboard
  const randomFloat = await switchboardRNG.secureRandom();

  // 2. Converter para 0.00 a 100.00
  const result = parseFloat((randomFloat * 100).toFixed(2));

  // 3. Lógica do Jogo: >= 50.00 é Heads, < 50.00 é Tails
  const isHeads = result >= 50.00; 
  const outcome = isHeads ? 'heads' : 'tails';
  const isWin = outcome === side;

  const multiplier = 1.98; // House edge ~1%
  const payout = isWin ? wager * multiplier : 0;

  // Gerar prova compatível com frontend
  const proof = rngService.generateResultForGame(clientSeed, nonce).proof;

  return {
    success: true,
    game: 'coinflip',
    wager,
    payout,
    multiplier: isWin ? multiplier : 0,
    profit: payout - wager,
    outcome: outcome, 
    timestamp: new Date(),
    
    // Dados de prova
    clientSeed: clientSeed,
    nonce: nonce,
    serverSeed: proof.serverSeed, 
    commitHash: proof.commitHash,
  };
};