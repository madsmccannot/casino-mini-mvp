import { ProviderState } from './providerState.model';
import { ProviderName, ProviderUnavailableError } from './BankrollProvider';

const FAILURE_THRESHOLD = 3;
const OPEN_MS = 30_000;

export const assertCircuitAllows = async (provider: ProviderName): Promise<void> => {
  const state = await ProviderState.findOne({ provider });
  if (!state || state.circuit === 'CLOSED') return;
  if (state.circuit === 'OPEN' && state.openUntil && state.openUntil.getTime() <= Date.now()) {
    const claimed = await ProviderState.findOneAndUpdate(
      { provider, circuit: 'OPEN', openUntil: { $lte: new Date() } },
      { $set: { circuit: 'HALF_OPEN', lastCheckedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (claimed) return;
  }
  throw new ProviderUnavailableError(`${provider} circuit breaker is ${state.circuit.toLowerCase()}`);
};

export const recordProviderSuccess = async (provider: ProviderName): Promise<void> => {
  await ProviderState.updateOne(
    { provider },
    { $set: { consecutiveFailures: 0, circuit: 'CLOSED', lastCheckedAt: new Date() }, $unset: { openUntil: 1, lastFailure: 1 } },
    { upsert: true }
  );
};

export const recordProviderFailure = async (provider: ProviderName, error: unknown): Promise<void> => {
  const message = error instanceof Error ? error.message.slice(0, 500) : 'Unknown provider failure';
  const state = await ProviderState.findOneAndUpdate(
    { provider },
    { $inc: { consecutiveFailures: 1 }, $set: { lastFailure: message, lastCheckedAt: new Date() }, $setOnInsert: { circuit: 'CLOSED' } },
    { upsert: true, returnDocument: 'after' }
  );
  if ((state?.consecutiveFailures ?? 0) >= FAILURE_THRESHOLD) {
    await ProviderState.updateOne(
      { provider },
      { $set: { circuit: 'OPEN', openUntil: new Date(Date.now() + OPEN_MS) } }
    );
  }
};
