// --- REQUESTS (O que o Frontend envia) ---
export interface PlayRequest {
  // Apenas os nomes dos jogos. As ações (reveal/cashout) vão no campo 'action'
  game: 'dice' | 'coinflip' | 'plinko' | 'mines' | 'roulette' | 'crash' | 'limbo' | 'blackjack';
  
  betAmount?: number; // Opcional porque 'reveal' no Mines não tem aposta
  
  params: any; // Parâmetros específicos (cor, lado da moeda, array de minas, etc.)
  
  // Ação específica para jogos com estado (Mines)
  action?: 'bet' | 'reveal' | 'cashout' | 'hit' | 'stand';
}

// --- RESPONSES (O que o Backend devolve) ---
export interface GameResult {
  success: boolean;
  game: string;
  wager: number;
  payout: number;
  multiplier: number;
  profit: number;
  
  outcome: any; // Resultado flexível (pode ser número, string ou objeto complexo)
  
  nonce: number;      
  timestamp: Date;
  
  // Campos de Segurança e Auditoria
  sessionId?: string; 
  serverSeed?: string; 
  clientSeed: string; 
  commitHash?: string;
}

// --- GESTÃO DE RISCO (Prioridade 5) ---

// Limites de pagamento para um jogo específico
export interface RiskLimits {
    maxPayoutMultiplier: number;
    maxBetAmountSOL: number;
}

// Resumo do estado atual da banca (Para o Risk Engine)
export interface BankrollStatus {
    totalBalance: number;
    maxRiskExposure: number; // Valor máximo que o casino pode pagar numa única aposta
    maxPayoutMultiplier: number;
}
