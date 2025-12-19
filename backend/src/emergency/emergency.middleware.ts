import { Request, Response, NextFunction } from 'express';
import { shutdownService } from './shutdown.service';

/**
 * Middleware: Verifica o estado global de emergência.
 * Bloqueia Depósitos, Levantamentos e Apostas se o modo de emergência estiver ATIVO.
 */
export const checkEmergencyState = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // CORREÇÃO: Usamos o nome correto da função 'isSystemActive'
        const isActive = await shutdownService.isSystemActive();
        
        // Se o sistema NÃO estiver ativo (está em emergência)
        if (!isActive) {
            
            // EXCEÇÃO IMPORTANTE: Se for uma rota de Admin, deixamos passar.
            // Sem isto, se ligares o bloqueio, bloqueias-te a ti próprio e não consegues desligar!
            if (req.path.includes('/admin')) {
                return next();
            }

            console.warn(`[SECURITY] Access denied to route: ${req.path}. System in SHUTDOWN mode.`);
            return res.status(503).json({ 
                error: "⚠️ SYSTEM IN MAINTENANCE MODE. Operations are temporarily suspended.",
                errorCode: "EMERGENCY_SHUTDOWN"
            });
        }
        
        next();
    } catch (error) {
        console.error("Emergency middleware failed:", error);
        // Em caso de erro na verificação, deixamos passar ou bloqueamos? 
        // Por segurança, vamos deixar passar o next() para não travar o site se o Mongo falhar momentaneamente,
        // mas registamos o erro crítico acima.
        next(); 
    }
};