export interface PlayRequest {
  game: 'dice' | 'coinflip' | 'plinko' | 'mines' | 'roulette' | 'mines_start' | 'mines_reveal' | 'mines_cashout';
  amount: number;
  params: any; 
}

export interface GameResult {
  success: boolean;
  game: string;
  wager: number;
  payout: number;
  multiplier: number;
  profit: number;
  outcome: any; 
  nonce: number;  // Contador de apostas
  timestamp: Date;
  sessionId?: string; 
  serverSeed?: string; 
  clientSeed: string; 
  commitHash?: string;
}

// --- NOVOS TIPOS PARA GESTÃO DE RISCO ---

// Limites de pagamento para um jogo específico
export interface RiskLimits {
    maxPayoutMultiplier: number;
    maxBetAmountSOL: number;
}

// Resumo do estado atual da banca
export interface BankrollStatus {
    totalBalance: number;
    maxRiskExposure: number; // Valor máximo que o casino pode pagar numa única aposta
    maxPayoutMultiplier: number;
}