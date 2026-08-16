export const PLINKO_TABLES = {
  low: {
    8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    12: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16]
  },
  medium: {
    8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    12: [33, 11, 4, 2, 1.1, 0.5, 0.472, 0.5, 1.1, 2, 4, 11, 33],
    16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
  },
  high: {
    8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    12: [170, 24, 8, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8, 24, 170],
    16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
  }
} as const;

export type PlinkoRisk = keyof typeof PLINKO_TABLES;
export type PlinkoRows = 8 | 12 | 16;

const finiteWager = (wager: number) => {
  if (!Number.isFinite(wager) || wager <= 0 || !Number.isSafeInteger(wager * 1_000_000_000)) throw new Error('Invalid wager');
};

export const validators = {
  coinflip(wager: number, params: any) {
    finiteWager(wager);
    if (!params || !['heads', 'tails'].includes(params.side)) throw new Error('side must be heads or tails');
    return { side: params.side as 'heads' | 'tails', clientSeed: params.clientSeed, nonce: params.nonce };
  },
  dice(wager: number, params: any) {
    finiteWager(wager);
    if (!params || !Number.isFinite(params.target) || params.target < 1 || params.target > 99) throw new Error('target must be between 1 and 99');
    const condition = params.condition === 'above' ? 'over' : params.condition === 'below' ? 'under' : params.condition;
    if (!['over', 'under'].includes(condition)) throw new Error('condition must be over or under');
    return { target: params.target as number, condition: condition as 'over' | 'under', clientSeed: params.clientSeed, nonce: params.nonce };
  },
  plinko(wager: number, params: any) {
    finiteWager(wager);
    const rows = Number(params?.rows);
    const risk = String(params?.risk || '').toLowerCase();
    if (![8, 12, 16].includes(rows)) throw new Error('rows must be 8, 12, or 16');
    if (!['low', 'medium', 'high'].includes(risk)) throw new Error('risk must be low, medium, or high');
    return { rows: rows as PlinkoRows, risk: risk as PlinkoRisk, clientSeed: params.clientSeed, nonce: params.nonce };
  },
  roulette(wager: number, params: any) {
    finiteWager(wager);
    if (!params || !['red', 'black', 'green'].includes(params.color)) throw new Error('color must be red, black, or green');
    return { color: params.color as 'red' | 'black' | 'green', clientSeed: params.clientSeed, nonce: params.nonce };
  },
  mines(wager: number, params: any) {
    finiteWager(wager);
    if (!Number.isInteger(params?.bombCount) || params.bombCount < 1 || params.bombCount > 24) throw new Error('bombCount must be between 1 and 24');
    return { bombCount: params.bombCount as number, clientSeed: params.clientSeed, nonce: params.nonce };
  },
  limbo(wager: number, params: any) {
    finiteWager(wager);
    if (!Number.isFinite(params?.targetMultiplier) || params.targetMultiplier < 1.01 || params.targetMultiplier > 1000) throw new Error('targetMultiplier must be between 1.01 and 1000');
    return { targetMultiplier: params.targetMultiplier as number, clientSeed: params.clientSeed, nonce: params.nonce };
  },
  crash(wager: number, params: any) {
    finiteWager(wager);
    if (!Number.isFinite(params?.autoCashout) || params.autoCashout < 1.01 || params.autoCashout > 1000) throw new Error('autoCashout must be between 1.01 and 1000');
    return { autoCashout: params.autoCashout as number, clientSeed: params.clientSeed, nonce: params.nonce };
  },
  blackjack(wager: number, params: any) {
    finiteWager(wager);
    return { clientSeed: params?.clientSeed, nonce: params?.nonce };
  }
};

export const maxMultiplierFor = (game: string, params: any): number => {
  switch (game) {
    case 'coinflip': return 1.98;
    case 'dice': {
      const value = validators.dice(1, params);
      const chance = value.condition === 'over' ? 100 - value.target : value.target;
      return 99 / chance;
    }
    case 'roulette': return validators.roulette(1, params).color === 'green' ? 36 : 2;
    case 'plinko': {
      const value = validators.plinko(1, params);
      return Math.max(...PLINKO_TABLES[value.risk][value.rows]);
    }
    case 'mines': {
      const { bombCount } = validators.mines(1, params);
      let multiplier = 1;
      for (let revealed = 0; revealed < 25 - bombCount; revealed++) multiplier *= (25 - revealed) / (25 - bombCount - revealed);
      return multiplier * 0.99;
    }
    case 'limbo': return validators.limbo(1, params).targetMultiplier;
    case 'crash': return validators.crash(1, params).autoCashout;
    case 'blackjack': validators.blackjack(1, params); return 2.5;
    default: throw new Error('Game not supported');
  }
};

export const GAME_REGISTRY = Object.freeze({
  coinflip: { id: 'coinflip', lifecycle: 'instant', rtp: 0.99 },
  dice: { id: 'dice', lifecycle: 'instant', rtp: 0.99 },
  mines: { id: 'mines', lifecycle: 'interactive', rtp: 0.99 },
  plinko: { id: 'plinko', lifecycle: 'instant', rtp: 0.99 },
  roulette: { id: 'roulette', lifecycle: 'instant', rtp: 36 / 37 }
  ,crash: { id: 'crash', lifecycle: 'round', rtp: 0.99 }
  ,limbo: { id: 'limbo', lifecycle: 'instant', rtp: 0.99 }
  ,blackjack: { id: 'blackjack', lifecycle: 'interactive', rtp: null, rtpModel: 'strategy-dependent' }
} as const);
