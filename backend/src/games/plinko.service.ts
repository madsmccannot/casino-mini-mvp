import { GameResult } from '../types';
import { switchboardRNG } from '../rng/switchboard';
import { rngService } from '../rng/commitReveal';

interface PlinkoParams {
  clientSeed?: string; 
  nonce?: number; 
  rows: number;      
}

// Configuração para 8 linhas (Hardcoded para MVP)
const MULTIPLIERS_8 = [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6]; 

export const playPlinko = async (wager: number, params: PlinkoParams): Promise<GameResult> => {
  const { clientSeed = 'default', nonce = 0, rows } = params;
  if (wager <= 0) throw new Error("Aposta inválida");
  
  const multipliers = MULTIPLIERS_8; 

  const path: number[] = [];
  let currentPos = 0; 

  // 1. Obter seed segura da Blockchain
  const randomFloat = await switchboardRNG.secureRandom();
  
  // 2. Usar o seed para determinar o caminho (Determinístico localmente)
  let seedState = randomFloat;

  const nextRandom = () => {
      seedState = (seedState * 9301 + 49297) % 233280 / 233280;
      return seedState;
  };

  for (let i = 0; i < rows; i++) {
    // 0 = esquerda, 1 = direita
    const val = nextRandom();
    const direction = val >= 0.5 ? 1 : 0; 
    
    path.push(direction);
    currentPos += direction;
  }

  // Garantir limites do array
  const finalBucketIndex = Math.min(Math.max(0, currentPos), multipliers.length - 1);

  const multiplier = multipliers[finalBucketIndex];
  const payout = wager * multiplier;

  const proof = rngService.generateResultForGame(clientSeed, nonce).proof;

  return {
    success: true,
    game: 'plinko',
    wager,
    payout,
    multiplier,
    profit: payout - wager,
    outcome: { path, multiplier },
    timestamp: new Date(),
    
    clientSeed: clientSeed,
    nonce: nonce,
    serverSeed: proof.serverSeed, 
    commitHash: proof.commitHash,
  };
};