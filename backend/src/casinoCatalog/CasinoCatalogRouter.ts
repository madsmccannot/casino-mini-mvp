import { CasinoCatalogProvider, CatalogProviderUnavailableError } from './providers/CasinoCatalogProvider';
import { SandboxCasinoCatalogProvider } from './providers/SandboxCasinoCatalogProvider';
import { AggregatorCasinoCatalogProvider } from './providers/AggregatorCasinoCatalogProvider';
export class CasinoCatalogRouter {
  constructor(private readonly providers: Map<string, CasinoCatalogProvider>) {}
  selected() { const name = process.env.CASINO_CATALOG_PROVIDER?.trim() || 'disabled'; if (name === 'disabled') throw new CatalogProviderUnavailableError('External casino catalog is disabled'); const provider = this.providers.get(name); if (!provider) throw new CatalogProviderUnavailableError(`Unsupported casino catalog provider: ${name}`); if (process.env.NODE_ENV === 'production' && name === 'sandbox') throw new CatalogProviderUnavailableError('Casino catalog sandbox is forbidden in production'); return provider; }
  async execute<T>(operation: (provider: CasinoCatalogProvider) => Promise<T>) { const provider = this.selected(); const health = await provider.getHealth(); if (health.state !== 'HEALTHY') throw new CatalogProviderUnavailableError(`${provider.name} is ${health.state.toLowerCase()}`); return operation(provider); }
}
export const casinoCatalogRouter = new CasinoCatalogRouter(new Map<string, CasinoCatalogProvider>([['sandbox', new SandboxCasinoCatalogProvider()], ['aggregator', new AggregatorCasinoCatalogProvider()]]));
