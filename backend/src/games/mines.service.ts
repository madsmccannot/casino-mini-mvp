import { GameResult } from '../types';
import * as crypto from 'crypto';
import { GameSession } from '../models/GameSession';

const generateId = () => crypto.randomBytes(8).toString('hex');

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
  
  // 1. INICIAR JOGO (Agora Async e grava no Mongo)
  startGame: async (userId: string, betId: string, wager: number, params: { bombCount: number }): Promise<GameResult & { sessionId: string, betId: string }> => {
    const { bombCount } = params;
    
    if (wager <= 0) throw new Error("Aposta inválida");
    if (bombCount < 1 || bombCount > 24) throw new Error("Número de bombas inválido (1-24)");

    // RNG Seguro
    const bombs = new Set<number>();
    while (bombs.size < bombCount) {
      bombs.add(crypto.randomInt(0, 25));
    }
    const bombArray = Array.from(bombs);

    // Provably Fair
    const secretString = JSON.stringify(bombArray);
    const commitHash = crypto.createHash('sha256').update(secretString).digest('hex');
    const sessionId = generateId();
    
    // CRIAR SESSÃO NA BD
    await GameSession.create({
      userId,
      betId,
      sessionId,
      game: 'mines',
      wager,
      active: true,
      state: {
        bombs: bombArray,
        revealed: [],
        bombCount
      },
      serverSeed: secretString,
      commitHash: commitHash
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
      betId,
      clientSeed: 'mines-session', 
      serverSeed: 'hidden',
      commitHash: commitHash 
    };
  },

  // 2. REVELAR QUADRADO
  reveal: async (userId: string, params: { sessionId: string, tileIndex: number }): Promise<GameResult & { betId: string }> => {
    const { sessionId, tileIndex } = params;

    // Buscar sessão à BD e garantir que pertence ao User
    const session = await GameSession.findOne({ sessionId, userId });

    if (!session || !session.active) throw new Error("Jogo não encontrado ou terminado");
    if (session.state.revealed.includes(tileIndex)) throw new Error("Quadrado já revelado");

    const { bombs, bombCount } = session.state;

    // BOOM! 💣
    if (bombs.includes(tileIndex)) {
      // Atualizar BD: Marcar como inativo
      session.active = false;
      await session.save();

      return {
        success: true,
        game: 'mines',
        wager: session.wager,
        payout: 0,
        multiplier: 0,
        profit: -session.wager,
        outcome: { status: 'boom', bombs: bombs, active: false }, 
        nonce: Date.now(),
        timestamp: new Date(),
        clientSeed: 'mines-session',
        serverSeed: session.serverSeed, // Revela segredo
        commitHash: session.commitHash
        ,betId: session.betId
      };
    }

    // DIAMANTE 💎
    session.state.revealed.push(tileIndex);
    // Nota: Mongoose precisa disto para saber que o array mudou
    session.markModified('state.revealed');
    
    await session.save();

    const multiplier = calculateMultiplier(bombCount, session.state.revealed.length);

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
      clientSeed: 'mines-session',
      serverSeed: 'hidden',
      commitHash: session.commitHash
      ,betId: session.betId
    };
  },

  // 3. LEVANTAR (CASHOUT)
  cashout: async (userId: string, params: { sessionId: string }): Promise<GameResult & { betId: string }> => {
    const { sessionId } = params;
    const session = await GameSession.findOne({ sessionId, userId });

    if (!session || !session.active) throw new Error("Jogo não encontrado");

    const multiplier = calculateMultiplier(session.state.bombCount, session.state.revealed.length);
    const payout = session.wager * multiplier;

    // Fechar sessão na BD
    session.active = false;
    await session.save();

    return {
      success: true,
      game: 'mines',
      wager: session.wager,
      payout,
      multiplier,
      profit: payout - session.wager,
      outcome: { status: 'cashout', bombs: session.state.bombs, active: false },
      nonce: Date.now(),
      timestamp: new Date(),
      clientSeed: 'mines-session',
      serverSeed: session.serverSeed, 
      commitHash: session.commitHash
      ,betId: session.betId
    };
  }
};
