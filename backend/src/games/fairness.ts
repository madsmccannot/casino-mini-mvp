import { createHash, createHmac, randomBytes } from 'node:crypto';

export const FAIRNESS_ALGORITHM = 'hmac-sha256-v1';

export interface FairnessProof {
  algorithm: typeof FAIRNESS_ALGORITHM;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  commitHash: string;
  commitId?: string;
  committedAt?: string;
}

export class FairRandom {
  private cursor = 0;
  constructor(readonly proof: FairnessProof) {}

  private uint32(): number {
    const digest = createHmac('sha256', this.proof.serverSeed)
      .update(`${this.proof.clientSeed}:${this.proof.nonce}:${this.cursor++}`)
      .digest();
    return digest.readUInt32BE(0);
  }

  // Rejection sampling avoids modulo bias for every integer range used by a game.
  integer(maxExclusive: number): number {
    if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) throw new Error('Invalid random range');
    const range = 0x1_0000_0000;
    const ceiling = range - (range % maxExclusive);
    let value: number;
    do value = this.uint32(); while (value >= ceiling);
    return value % maxExclusive;
  }
}

export const createFairRandom = (clientSeed = 'default', nonce = 0, serverSeed?: string, commitment?: { commitId: string; committedAt: string }): FairRandom => {
  if (!/^[\x20-\x7E]{1,128}$/.test(clientSeed)) throw new Error('clientSeed must contain 1-128 printable characters');
  if (!Number.isSafeInteger(nonce) || nonce < 0) throw new Error('nonce must be a non-negative safe integer');
  const secret = serverSeed || randomBytes(32).toString('hex');
  if (!/^[a-f0-9]{64}$/.test(secret)) throw new Error('Invalid server seed');
  return new FairRandom({
    algorithm: FAIRNESS_ALGORITHM,
    serverSeed: secret,
    clientSeed,
    nonce,
    commitHash: createHash('sha256').update(secret).digest('hex'),
    ...commitment
  });
};

export const verifyCommitment = (proof: FairnessProof): boolean =>
  proof.algorithm === FAIRNESS_ALGORITHM &&
  createHash('sha256').update(proof.serverSeed).digest('hex') === proof.commitHash;
