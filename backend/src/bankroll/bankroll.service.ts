import * as solana from '../blockchain/solana';
import { solanaWallet } from '../wallet/solanaWallet';

export const bankrollService = {
    
    /**
     * Saldo REAL (Blockchain): A verdadeira solvência do casino.
     * O RiskEngine usa ISTO para decidir se aceita apostas.
     */
    getHouseBalance: async (): Promise<number> => {
        try {
            const address = solanaWallet.getAddress();
            if (!address) return 0;
            return await solana.getWalletBalance(address);
        } catch (error) {
            console.error("Critical: Failed to fetch blockchain balance", error);
            return 0; // Se falhar, retorna 0 para bloquear apostas por segurança
        }
    },

    /**
     * Admin retira lucros (Envia SOL real)
     */
    payoutUser: async (targetAddress: string, amount: number) => {
        const result = await solana.processWithdrawal(targetAddress, amount);
        return result.tx;
    }
};
