import { FairnessProof } from './fairness';

export type GameId = 'coinflip' | 'dice' | 'mines' | 'plinko' | 'roulette' | 'crash' | 'limbo' | 'blackjack';

export interface StandardGameResult {
  success: true;
  game: GameId;
  wager: number;
  payout: number;
  multiplier: number;
  profit: number;
  won: boolean;
  outcome: any;
  timestamp: Date;
  proof: FairnessProof;
  // Compatibility fields while the frontend migrates to proof.*.
  clientSeed: string;
  nonce: number;
  serverSeed: string;
  commitHash: string;
}

export const standardResult = (
  game: GameId,
  wager: number,
  payout: number,
  multiplier: number,
  outcome: unknown,
  proof: FairnessProof
): StandardGameResult => ({
  success: true, game, wager, payout, multiplier, profit: payout - wager,
  won: payout > 0, outcome, timestamp: new Date(), proof,
  clientSeed: proof.clientSeed, nonce: proof.nonce, serverSeed: proof.serverSeed, commitHash: proof.commitHash
});
