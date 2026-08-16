import { Keypair } from '@solana/web3.js';

// Legacy wallet custody was intentionally retired. This compatibility object keeps
// old call sites fail-closed until they are replaced by approved provider workflows.
export const solanaWallet = {
  isEnabled: (): boolean => false,
  getKeypair: (): Keypair => { throw new Error('Legacy wallet custody is retired'); },
  getAddress: (): null => null
};
