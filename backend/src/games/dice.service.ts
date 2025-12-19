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

// NOTA: Agora é uma função ASYNC porque chama o RNG externo
export const playDice = async (betAmount: number, params: DiceParams): Promise<DiceResult> => {
  const { target, condition } = params;

  // 1. Obter número seguro (0 a 1) do Switchboard ou Fallback
  const randomFloat = await switchboardRNG.secureRandom();
  
  // 2. Converter para escala 0.00 a 100.00
  const rolled = parseFloat((randomFloat * 100).toFixed(2));

  let won = false;
  let multiplier = 0;

  // 3. Lógica do Jogo
  if (condition === 'above') {
    // Exemplo: Apostou Over 50. Ganha se sair 50.01+
    // Chance = 100 - 50 = 50%
    const winChance = 100 - target;
    if (rolled > target) {
      won = true;
      // Multiplicador com House Edge de 1% (99 / chance)
      multiplier = 99 / winChance;
    }
  } else {
    // Apostou Under 50. Ganha se sair 49.99-
    const winChance = target;
    if (rolled < target) {
      won = true;
      multiplier = 99 / winChance;
    }
  }

  // Proteção contra multiplicadores infinitos ou negativos
  if (multiplier < 0) multiplier = 0;

  const payout = won ? betAmount * multiplier : 0;

  return {
    rolled,
    payout,
    won
  };
};