import { GameResult } from '../types';

// Store em memória para guardar jogos ativos
const activeGames = new Map<string, any>();

const generateId = () => Math.random().toString(36).substring(7);

const calculateMultiplier = (bombCount: number, revealedCount: number) => {
  const totalCells = 25;
  let multiplier = 1;
  
  for (let i = 0; i < revealedCount; i++) {
    const remainingCells = totalCells - i;
    const remainingSafe = totalCells - bombCount - i;
    multiplier *= (remainingCells / remainingSafe);
  }
  
  return multiplier * 0.99; // House Edge 1%
};

export const minesService = {
  
  // 1. INICIAR JOGO
  startGame: (wager: number, params: { bombCount: number }): GameResult & { sessionId: string } => {
    const { bombCount } = params;
    
    if (wager <= 0) throw new Error("Aposta inválida");
    if (bombCount < 1 || bombCount > 24) throw new Error("Número de bombas inválido (1-24)");

    // Gerar Bombas (Local RNG para rapidez e estado)
    const bombs = new Set<number>();
    while (bombs.size < bombCount) {
      bombs.add(Math.floor(Math.random() * 25));
    }

    const sessionId = generateId();
    
    activeGames.set(sessionId, {
      wager,
      bombCount,
      bombs: Array.from(bombs),
      revealed: [],
      active: true,
      timestamp: Date.now()
    });

    return {
      success: true,
      game: 'mines',
      wager,
      payout: 0,
      multiplier: 1,
      profit: 0,
      outcome: { status: 'active', revealed: [] }, 
      nonce: Date.now(),
      timestamp: new Date(),
      sessionId,
      // Campos obrigatórios para satisfazer o TypeScript (GameResult)
      clientSeed: 'mines-local', 
      serverSeed: 'active-session',
      commitHash: 'hidden'
    };
  },

  // 2. REVELAR QUADRADO
  reveal: (params: { sessionId: string, tileIndex: number }): GameResult => {
    const { sessionId, tileIndex } = params;
    const session = activeGames.get(sessionId);

    if (!session || !session.active) throw new Error("Jogo não encontrado ou terminado");
    if (session.revealed.includes(tileIndex)) throw new Error("Quadrado já revelado");

    if (session.bombs.includes(tileIndex)) {
      activeGames.delete(sessionId); 
      return {
        success: true,
        game: 'mines',
        wager: session.wager,
        payout: 0,
        multiplier: 0,
        profit: -session.wager,
        outcome: { status: 'boom', bombs: session.bombs, active: false }, 
        nonce: Date.now(),
        timestamp: new Date(),
        clientSeed: 'mines-local',
        serverSeed: 'revealed',
        commitHash: 'revealed'
      };
    }

    session.revealed.push(tileIndex);
    const multiplier = calculateMultiplier(session.bombCount, session.revealed.length);
    
    activeGames.set(sessionId, session);

    return {
      success: true,
      game: 'mines',
      wager: session.wager,
      payout: 0, 
      multiplier,
      profit: 0,
      outcome: { status: 'gem', multiplier, active: true },
      nonce: Date.now(),
      timestamp: new Date(),
      clientSeed: 'mines-local',
      serverSeed: 'active-session',
      commitHash: 'hidden'
    };
  },

  // 3. LEVANTAR (CASHOUT)
  cashout: (params: { sessionId: string }): GameResult => {
    const { sessionId } = params;
    const session = activeGames.get(sessionId);

    if (!session || !session.active) throw new Error("Jogo não encontrado");

    const multiplier = calculateMultiplier(session.bombCount, session.revealed.length);
    const payout = session.wager * multiplier;

    activeGames.delete(sessionId);

    return {
      success: true,
      game: 'mines',
      wager: session.wager,
      payout,
      multiplier,
      profit: payout - session.wager,
      outcome: { status: 'cashout', bombs: session.bombs, active: false },
      nonce: Date.now(),
      timestamp: new Date(),
      clientSeed: 'mines-local',
      serverSeed: 'cashed-out',
      commitHash: 'revealed'
    };
  }
};