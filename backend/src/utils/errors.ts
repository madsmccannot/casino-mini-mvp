import { logger } from './logger';

/**
 * Classe base para todos os erros da aplicacao com codigo de status HTTP.
 */
export class CustomError extends Error {
    public httpCode: number;
    public isOperational: boolean;

    constructor(message: string, httpCode: number, isOperational: boolean = true) {
        super(message);
        this.name = this.constructor.name;
        this.httpCode = httpCode;
        this.isOperational = isOperational;
        
        // Mantem o stack trace (importante para debug)
        Error.captureStackTrace(this, this.constructor);

        // Loga o erro, exceto se for um erro de cliente 4xx
        if (httpCode >= 500) {
            logger.error(`[CRITICAL] ${message}`, { httpCode, stack: this.stack });
        } else if (httpCode === 401) {
             // Loga tentativas de acesso nao autorizado
             logger.warn(`[AUTH FAIL] ${message}`);
        }
    }
}

/**
 * Erro 400: Pedido Inválido
 */
export class BadRequestError extends CustomError {
    constructor(message: string = "Invalid Request.") {
        super(message, 400);
    }
}

/**
 * Erro 401: Não Autorizado (Login, JWT inválido, etc.)
 */
export class UnauthorizedError extends CustomError {
    constructor(message: string = "Access denied. Authentication required.") {
        super(message, 401);
    }
}

/**
 * Erro 403: Proibido (Permissão negada)
 */
export class ForbiddenError extends CustomError {
    constructor(message: string = "Forbidden access. Insufficient privileges.") {
        super(message, 403);
    }
}

/**
 * Erro 404: Recurso Não Encontrado
 */
export class NotFoundError extends CustomError {
    constructor(message: string = "Resource not found.") {
        super(message, 404);
    }
}

// --- ERROS ESPECÍFICOS DO CASINO/FINANCEIROS ---

/**
 * Erro 400: Saldo Insuficiente para a aposta ou levantamento
 */
export class InsufficientFundsError extends BadRequestError {
    constructor(message: string = "Insufficient balance for this transaction.") {
        super(message);
        this.name = 'InsufficientFundsError';
    }
}

/**
 * Erro 400: Limites de Risco Excedidos (problema interno do casino)
 */
export class RiskLimitExceededError extends BadRequestError {
    constructor(message: string = "Risk limit exceeded. Wager too high for current Bankroll.") {
        super(message);
        this.name = 'RiskLimitExceededError';
    }
}