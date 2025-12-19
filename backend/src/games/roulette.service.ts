import { GameResult } from '../types';
import { switchboardRNG } from '../rng/switchboard';
import { rngService } from '../rng/commitReveal';

interface RouletteParams {
  color: 'red' | 'black' | 'green';
  clientSeed?: string; 
  nonce?: number; 
}

const getRouletteColor = (num: number) => {
    if (num === 0) return 'green';
    const redNums = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNums.includes(num) ? 'red' : 'black';
};

export const playRoulette = async (wager: number, params: RouletteParams): Promise<GameResult> => {
  const { color, clientSeed = 'default', nonce = 0 } = params;
  
  if (wager <= 0) throw new Error("Aposta inválida");

  // 1. Obter número seguro (0 a 1) do Switchboard
  const randomFloat = await switchboardRNG.secureRandom();

  // 2. Mapear 0-1 para um número de roleta (0-36)
  const resultNumber = Math.floor(randomFloat * 37); 
  
  const resultColor = getRouletteColor(resultNumber);

  const isWin = resultColor === color;
  
  let multiplier = 0;
  if (color === 'green') multiplier = 14; 
  else multiplier = 2; 

  const payout = isWin ? wager * multiplier : 0;
  
  const proof = rngService.generateResultForGame(clientSeed, nonce).proof;

  return {
    success: true,
    game: 'roulette',
    wager,
    payout,
    multiplier: isWin ? multiplier : 0,
    profit: payout - wager,
    outcome: resultNumber, 
    timestamp: new Date(),
    
    clientSeed: clientSeed,
    nonce: nonce,
    serverSeed: proof.serverSeed, 
    commitHash: proof.commitHash,
  };
};