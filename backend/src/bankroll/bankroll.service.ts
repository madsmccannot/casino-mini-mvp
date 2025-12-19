import { User } from '../models/User';
import * as solana from '../blockchain/solana'; // Importar serviço blockchain
import { solanaWallet } from '../wallet/solanaWallet'; // Importar carteira

// Endereço reservado para a Banca (apenas para registo na BD)
const BANKROLL_ADDRESS = 'casino_bankroll';

export const bankrollService = {
    
    /**
     * Obtém o saldo virtual da Banca registado na Base de Dados.
     * Útil para cálculo de Lucro/Prejuízo histórico.
     */
    getBankrollBalance: async (): Promise<number> => {
        const bankrollUser = await User.findOne({ 
            walletAddress: BANKROLL_ADDRESS,
            isBankroll: true
        });
        
        if (!bankrollUser) {
            console.error(`🚨 Bankroll user not found! Create user with walletAddress: ${BANKROLL_ADDRESS}`);
            return 0;
        }
        return bankrollUser.balance;
    },

    /**
     * [NOVO] Obtém o saldo REAL da carteira Solana do Casino (Blockchain).
     * Usado para verificar solvência antes de grandes pagamentos.
     */
    getHouseBalance: async (): Promise<number> => {
        const address = solanaWallet.getAddress();
        return await solana.getWalletBalance(address);
    },

    /**
     * Adiciona ou deduz uma quantia do saldo virtual da Banca na DB.
     */
    updateBankroll: async (amount: number): Promise<number> => {
        const bankrollUser = await User.findOneAndUpdate(
            { walletAddress: BANKROLL_ADDRESS, isBankroll: true },
            { $inc: { balance: amount } },
            { new: true }
        );
        
        if (!bankrollUser) return 0;
        console.log(`🏦 Bankroll Update (DB): ${amount > 0 ? '+' : ''}${amount.toFixed(4)} SOL. New Balance: ${bankrollUser.balance.toFixed(4)}`);
        return bankrollUser.balance;
    },

    /**
     * [NOVO] Processa um levantamento de fundos da Casa (Admin Withdrawal).
     * Envia SOL real da carteira do casino para o admin.
     */
    payoutUser: async (targetAddress: string, amount: number) => {
        // Reutiliza a lógica segura de withdrawal do solana.ts
        const result = await solana.processWithdrawal(targetAddress, amount);
        return result.tx; // Retorna a assinatura da transação
    }
};