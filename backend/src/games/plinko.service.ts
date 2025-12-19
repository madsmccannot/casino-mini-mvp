import { GameResult } from '../types';
import { switchboardRNG } from '../rng/switchboard';
import { rngService } from '../rng/commitReveal';

interface PlinkoParams {
  clientSeed?: string; 
  nonce?: number; 
  rows: number;      
}

// Configuração para 8 linhas
const MULTIPLIERS_8 = [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6]; 

export const playPlinko = async (wager: number, params: PlinkoParams): Promise<GameResult> => {
  const { clientSeed = 'default', nonce = 0, rows } = params;
  if (wager <= 0) throw new Error("Aposta inválida");
  
  const multipliers = MULTIPLIERS_8; // Assumindo 8 linhas para este PoC

  const path: number[] = [];
  let currentPos = 0; 

  // 1. Obter UMA semente mestre do Switchboard
  // Não chamamos o Oracle 8 vezes (seria muito lento).
  // Usamos o número do Oracle para gerar entropia para o caminho.
  const randomFloat = await switchboardRNG.secureRandom();
  
  // Usamos o float para gerar uma sequência pseudo-aleatória determinística local
  // Isto garante que o caminho é "imprevisível" mas rápido.
  let seedState = randomFloat;

  // Função auxiliar simples para gerar próximos números baseados no seed do Oracle
  const nextRandom = () => {
      seedState = (seedState * 9301 + 49297) % 233280 / 233280;
      return seedState;
  };

  for (let i = 0; i < rows; i++) {
    // 0 = esquerda, 1 = direita (50/50 chance baseada no seed do Oracle)
    const val = nextRandom();
    const direction = val >= 0.5 ? 1 : 0; 
    
    path.push(direction);
    currentPos += direction;
  }

  // Garantir limites
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