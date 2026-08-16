// Compatibility boundary retained for imports during the custody migration.
export const solanaWallet = {
  getAddress: (): never => { throw new Error('Legacy wallet custody is retired'); },
  getKeypair: (): never => { throw new Error('Legacy wallet custody is retired'); }
};
