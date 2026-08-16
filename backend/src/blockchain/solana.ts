// Legacy chain custody boundary. No RPC, signer, key material or transaction
// construction is allowed in this application while CUSTODY_MODE is disabled.
export const getCasinoPublicKey = (): never => { throw new Error('Legacy chain custody is retired'); };
export const auditRecentDeposits = async (..._args: unknown[]): Promise<any> => { throw new Error('Legacy chain custody is retired'); };
export const processWithdrawal = async (..._args: unknown[]): Promise<any> => { throw new Error('Legacy chain custody is retired'); };
