import { switchboardRNG } from '../rng/switchboard';

interface DiceParams {
  target: number;
  condition: 'above' | 'below';
}

interface DiceResult {
  payout: number;
  rolled: number;
  won: boolean;
}

export const playDice = async (betAmount: number, params: DiceParams): Promise<DiceResult> => {
  const { target, condition } = params;

  // 1. Obter número seguro do Switchboard
  const randomFloat = await switchboardRNG.secureRandom();
  
  // 2. Converter para escala 0.00 a 100.00
  const rolled = parseFloat((randomFloat * 100).toFixed(2));

  let won = false;
  let multiplier = 0;

  // 3. Lógica do Jogo
  if (condition === 'above') {
    // Apostou Over. Ganha se sair > target
    // Chance = 100 - target
    const winChance = 100 - target;
    if (rolled > target) {
      won = true;
      multiplier = 99 / winChance; // 1% Edge (99/chance)
    }
  } else {
    // Apostou Under. Ganha se sair < target
    const winChance = target;
    if (rolled < target) {
      won = true;
      multiplier = 99 / winChance;
    }
  }

  // Proteção
  if (multiplier < 0) multiplier = 0;

  const payout = won ? betAmount * multiplier : 0;

  return {
    rolled,
    payout,
    won
  };
};