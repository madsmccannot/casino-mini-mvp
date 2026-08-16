import { Request, Response, NextFunction } from 'express';
import { shutdownService } from './shutdown.service';

/**
 * Middleware: Verifica o estado global de emergência.
 * Bloqueia Depósitos, Levantamentos e Apostas se o modo de emergência estiver ATIVO.
 */
export const checkEmergencyState = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isActive = await shutdownService.isSystemActive();
        
        // Se o sistema NÃO estiver ativo (está em emergência)
        if (!isActive) {
            
            // EXCEÇÃO IMPORTANTE: Admin passa sempre
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
        // Financial operations must fail closed when emergency state is unknown.
        return res.status(503).json({
            error: 'System state unavailable. Operations are temporarily suspended.',
            errorCode: 'EMERGENCY_STATE_UNAVAILABLE'
        });
    }
};
