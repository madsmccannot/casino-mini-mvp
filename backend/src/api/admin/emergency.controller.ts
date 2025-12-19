import { Response } from 'express';
import { AuthRequest } from '../bets/validateBet.middleware';
import { shutdownService } from '../../emergency/shutdown.service';

/**
 * ROTA ADMIN: Aciona ou desativa o modo de emergência/shutdown.
 * (Requer autenticação de administrador)
 */
export const toggleEmergency = async (req: AuthRequest, res: Response) => {
    // 1. Ação de segurança: Verificar se o utilizador é admin
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: "Access Denied: Admin required." });
    }
    
    // 2. Parâmetro de ação: 'enable' ou 'disable'
    const { action } = req.body;
    
    if (action !== 'enable' && action !== 'disable') {
        return res.status(400).json({ error: "Invalid action. Must be 'enable' or 'disable'." });
    }

    try {
        const shouldEnableEmergency = action === 'enable';
        
        // Esta função retorna TRUE se a emergência ficar LIGADA
        const isEmergencyNowActive = await shutdownService.toggleEmergencyState(shouldEnableEmergency);

        const message = isEmergencyNowActive 
            ? "⚠️ EMERGENCY MODE ON. Transfers and deposits DISABLED." 
            : "Emergency mode OFF. Transfers and games ENABLED.";

        console.log(`[SECURITY] ${message}`);
        
        return res.json({ 
            success: true, 
            status: isEmergencyNowActive ? 'SHUTDOWN' : 'ACTIVE', 
            message 
        });

    } catch (error) {
        console.error("Emergency toggle failed:", error);
        return res.status(500).json({ error: "Server error during state change." });
    }
};

/**
 * ROTA ADMIN: Exporta os saldos dos utilizadores para ficheiro.
 */
export const exportBalances = async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: "Access Denied: Admin required." });
    }

    try {
        const result = await shutdownService.exportPlayerBalances();
        
        return res.json({ 
            success: true, 
            message: `Exported ${result.count} player balances.`,
            filePath: result.filePath,
            dataPreview: result.data.slice(0, 5)
        });
        
    } catch (error) {
        console.error("Export failed:", error);
        return res.status(500).json({ error: "Server error during export." });
    }
};