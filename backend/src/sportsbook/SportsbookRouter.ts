import { SandboxFeed, sandboxFeed } from './providers/SandboxFeed';
import { SandboxSportsbookProvider } from './providers/SandboxSportsbookProvider';
import { SportradarProvider } from './providers/SportradarProvider';
import { SportsProviderUnavailableError, SportsbookProvider } from './providers/SportsbookProvider';
import { SportsTicketRejectedError } from './providers/SportsbookProvider';
import { SportsProviderState } from './models/SportsProviderState';

export class SportsbookRouter {
  constructor(private providers: Map<string, SportsbookProvider>) {}
  selected() {
    const name = process.env.SPORTSBOOK_PROVIDER?.trim() || 'disabled';
    if (name === 'disabled') throw new SportsProviderUnavailableError('Sportsbook is disabled');
    const provider = this.providers.get(name);
    if (!provider) throw new SportsProviderUnavailableError(`Unsupported sportsbook provider: ${name}`);
    if (process.env.NODE_ENV === 'production' && name === 'sandbox') throw new SportsProviderUnavailableError('Sportsbook sandbox is forbidden in production');
    return provider;
  }
  async execute<T>(operation: (provider: SportsbookProvider) => Promise<T>) {
    const provider = this.selected();
    const state = await SportsProviderState.findOne({ provider: provider.name });
    if ((state?.consecutiveFailures || 0) >= 3 && state?.lastFailureAt && Date.now() - state.lastFailureAt.getTime() < 30_000) throw new SportsProviderUnavailableError(`${provider.name} circuit breaker is open`);
    try {
      const health = await provider.getHealth();
      if (health.state !== 'HEALTHY') throw new SportsProviderUnavailableError(`${provider.name} is ${health.state.toLowerCase()}`);
      const result = await operation(provider);
      await SportsProviderState.updateOne({ provider: provider.name }, { $set: { state: 'HEALTHY', lastSuccessAt: new Date(), consecutiveFailures: 0 }, $unset: { lastError: 1 } }, { upsert: true });
      return result;
    } catch (error: any) {
      if (!(error instanceof SportsTicketRejectedError)) await SportsProviderState.updateOne({ provider: provider.name }, { $set: { state: 'DEGRADED', lastFailureAt: new Date(), lastError: error.message?.slice(0, 500) || 'Provider failure' }, $inc: { consecutiveFailures: 1 } }, { upsert: true });
      throw error;
    }
  }
}

export const createSportsbookRouter = (feed: SandboxFeed = sandboxFeed) => new SportsbookRouter(new Map<string, SportsbookProvider>([
  ['sandbox', new SandboxSportsbookProvider(() => feed.snapshot())], ['sportradar', new SportradarProvider()]
]));
export const sportsbookRouter = createSportsbookRouter();
