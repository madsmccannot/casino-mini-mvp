import { BankrollProvider, ProviderLimitError, ProviderUnavailableError } from './BankrollProvider';
import { assertCircuitAllows, recordProviderFailure, recordProviderSuccess } from './circuitBreaker.service';
import { InternalProvider } from './providers/InternalProvider';
import { WinrProvider } from './providers/WinrProvider';

export class BankrollRouter {
  constructor(private readonly providers: Map<string, BankrollProvider>) {}

  selected(): BankrollProvider {
    const selected = process.env.BANKROLL_PROVIDER?.trim() || 'disabled';
    if (selected === 'disabled') throw new ProviderUnavailableError('Bankroll routing is disabled');
    const provider = this.providers.get(selected);
    if (!provider) throw new ProviderUnavailableError(`Unsupported bankroll provider: ${selected}`);
    if (process.env.NODE_ENV === 'production' && provider.name === 'internal') {
      throw new ProviderUnavailableError('Internal bankroll cannot be selected in production');
    }
    return provider;
  }

  async execute<T>(operation: (provider: BankrollProvider) => Promise<T>): Promise<T> {
    const provider = this.selected();
    await assertCircuitAllows(provider.name);
    try {
      const health = await provider.getHealth();
      if (health.state !== 'HEALTHY') throw new ProviderUnavailableError(`${provider.name} is ${health.state.toLowerCase()}: ${health.reason || 'no reason supplied'}`);
      const result = await operation(provider);
      await recordProviderSuccess(provider.name);
      return result;
    } catch (error) {
      if (!(error instanceof ProviderLimitError)) await recordProviderFailure(provider.name, error);
      throw error;
    }
  }
}

export const bankrollRouter = new BankrollRouter(new Map<string, BankrollProvider>([
  ['internal', new InternalProvider()],
  ['winr', new WinrProvider()]
]));
