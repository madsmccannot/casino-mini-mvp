import { User } from '../models/User';
import * as solana from '../blockchain/solana';
import { solanaWallet } from '../wallet/solanaWallet';

// ID interno para a conta da banca na BD
const BANKROLL_USER_ID = 'casino_bankroll_internal';

export const bankrollService = {
    
    /**
     * Saldo Virtual (BD): Usado para gráficos de lucro/prejuízo
     */
    getBankrollBalance: async (): Promise<number> => {
        const bankrollUser = await User.findOne({ isBankroll: true });
        return bankrollUser ? bankrollUser.balance : 0;
    },

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
     * Atualiza o registo contabilístico na BD
     */
    updateBankroll: async (amount: number): Promise<void> => {
        await User.findOneAndUpdate(
            { isBankroll: true },
            { 
                $inc: { balance: amount },
                $setOnInsert: { walletAddress: BANKROLL_USER_ID, totalWagered: 0, isAdmin: false }
            },
            { upsert: true, new: true }
        );
    },

    /**
     * Admin retira lucros (Envia SOL real)
     */
    payoutUser: async (targetAddress: string, amount: number) => {
        const result = await solana.processWithdrawal(targetAddress, amount);
        // Se o dinheiro saiu da wallet real, abatemos no registo virtual
        await bankrollService.updateBankroll(-amount);
        return result.tx;
    }
};
