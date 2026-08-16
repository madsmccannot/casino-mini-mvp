import { lamportsToSol } from '../ledger/casinoLedger.service';
import { bankrollRouter } from './BankrollRouter';

// Compatibility facade for callers that have not yet moved to provider-native limits.
export const bankrollService = {
  getHouseBalance: async (): Promise<number> => bankrollRouter.execute(async provider => {
    const limits = await provider.getLimits('dice', 'SOL');
    return lamportsToSol(limits.availableLiquidityMinor);
  })
};
