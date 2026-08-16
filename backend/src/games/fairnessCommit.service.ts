import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { FairnessCommit } from './fairnessCommit.model';

const validateClientInput = (clientSeed: string, nonce: number) => {
  if (!/^[\x20-\x7E]{1,128}$/.test(clientSeed)) throw new Error('clientSeed must contain 1-128 printable characters');
  if (!Number.isSafeInteger(nonce) || nonce < 0) throw new Error('nonce must be a non-negative safe integer');
};

export const issueFairnessCommit = async (userId: Types.ObjectId, clientSeed: string, nonce: number) => {
  validateClientInput(clientSeed, nonce);
  const serverSeed = randomBytes(32).toString('hex');
  const commit = await FairnessCommit.create({
    commitId: randomUUID(), userId, serverSeed,
    commitHash: createHash('sha256').update(serverSeed).digest('hex'),
    clientSeed, nonce, expiresAt: new Date(Date.now() + 5 * 60_000)
  });
  return { commitId: commit.commitId, commitHash: commit.commitHash, clientSeed, nonce, issuedAt: commit.createdAt, expiresAt: commit.expiresAt };
};

export const consumeFairnessCommit = async (userId: Types.ObjectId, commitId: string, clientSeed: string, nonce: number) => {
  validateClientInput(clientSeed, nonce);
  if (!/^[0-9a-f-]{36}$/.test(commitId)) throw new Error('Invalid fairnessCommitId');
  const commit = await FairnessCommit.findOneAndUpdate(
    { commitId, userId, clientSeed, nonce, status: 'ISSUED', expiresAt: { $gt: new Date() } },
    { $set: { status: 'CONSUMED', consumedAt: new Date() } },
    { returnDocument: 'after' }
  ).select('+serverSeed');
  if (!commit) throw new Error('Fairness commitment is invalid, expired, mismatched, or already used');
  return { serverSeed: commit.serverSeed, commitId, committedAt: commit.createdAt.toISOString() };
};
