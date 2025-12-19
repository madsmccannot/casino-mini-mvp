import { User } from '../models/User';

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
                { walletAddress: SYSTEM_CONFIG_ID.toLowerCase() },
                { 
                    $set: { 
                        isTransferEnabled: isTransferActive,
                        isBankroll: false, 
                        isAdmin: false     
                    } 
                },
                { 
                    upsert: true, 
                    new: true,    
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
        const config = await User.findOne({ walletAddress: SYSTEM_CONFIG_ID.toLowerCase() });
        
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
            walletAddress: { $nin: [SYSTEM_CONFIG_ID.toLowerCase(), 'casino_bankroll'] },
            balance: { $gt: 0 } 
        }).select('walletAddress balance totalWagered'); 

        return {
            count: users.length,
            filePath: 'balances_export.csv',
            data: users
        };
    }
};