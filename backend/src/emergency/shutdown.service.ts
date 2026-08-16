import { User } from '../models/User';
import { LedgerBalance } from '../ledger/ledgerBalance.model';
import { Types } from 'mongoose';

// ID Fixo para o documento de configuração do sistema
const SYSTEM_CONFIG_ID = 'SYSTEM_STATUS';

export const shutdownService = {
    
    /**
     * Alterna o estado de emergência.
     * @param enableEmergency - Se true, bloqueia transferências. Se false, desbloqueia.
     */
    toggleEmergencyState: async (enableEmergency: boolean): Promise<boolean> => {
        // Se ativamos a emergência, as transferências ficam FALSE (Desativadas)
        const isTransferActive = !enableEmergency;

        try {
            const config = await User.findOneAndUpdate(
                { accountId: SYSTEM_CONFIG_ID },
                { 
                    $set: { 
                        isTransferEnabled: isTransferActive,
                        isBankroll: false, 
                        isAdmin: false     
                    } 
                },
                { 
                    upsert: true, 
                    returnDocument: 'after',
                    setDefaultsOnInsert: true 
                }
            );

            // Se o documento for null (raro), assumimos emergência para segurança
            if (!config) throw new Error("Failed to update system config");

            // Retornamos TRUE se estiver em MODO DE EMERGÊNCIA (ou seja, transferências OFF)
            return !config.isTransferEnabled;

        } catch (error) {
            console.error("Shutdown Service Error:", error);
            throw new Error("Failed to toggle emergency state");
        }
    },

    /**
     * Verifica se o sistema está a aceitar transferências.
     * @returns true se tudo estiver bem, false se estiver em emergência.
     */
    isSystemActive: async (): Promise<boolean> => {
        const config = await User.findOne({ accountId: SYSTEM_CONFIG_ID });
        
        // Se a configuração ainda não existir, assumimos que o sistema está ATIVO (true)
        if (!config) return true;
        
        // Retorna o estado gravado (true = ativo, false = bloqueado)
        return config.isTransferEnabled;
    },

    /**
     * Exporta saldos de todos os jogadores (exceto sistema e banca)
     */
    exportPlayerBalances: async () => {
        const users = await User.find({
            accountId: { $nin: [SYSTEM_CONFIG_ID, 'casino_bankroll'] },
            isBankroll: false
        }).select('_id accountId primaryWallet');
        const balances = await LedgerBalance.find({
            accountCode: { $in: users.map((user) => `USER:${user._id.toString()}:USDC:AVAILABLE`) },
            amountMinor: { $gt: Types.Decimal128.fromString('0') }
        }).lean();
        const balanceByCode = new Map(balances.map((balance) => [balance.accountCode, balance.amountMinor.toString()]));
        const data = users.flatMap((user) => {
            const balanceMinor = balanceByCode.get(`USER:${user._id.toString()}:USDC:AVAILABLE`);
            return balanceMinor ? [{ accountId: user.accountId, primaryWallet: user.primaryWallet, balanceMinor, currency: 'USDC' }] : [];
        });

        return {
            count: data.length,
            filePath: 'balances_export.csv',
            data
        };
    }
};
