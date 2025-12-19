import winston, { format } from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = format;

// Formato personalizado para logs (inclui timestamp, nivel, e mensagem)
const customFormat = printf(({ level, message, timestamp, stack }) => {
    // Se houver um stack (erro), imprime-o
    if (stack) {
        return `${timestamp} [${level}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level}]: ${message}`;
});

// Configuração do logger
export const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    
    // Logs de erro sao sempre guardados num ficheiro separado
    exceptionHandlers: [
        new winston.transports.File({ filename: 'backend/logs/exceptions.log' })
    ],
    
    // Configuração dos transports (onde o log vai)
    transports: [
        // 1. Consola (para desenvolvimento)
        new winston.transports.Console({
            format: combine(
                colorize({ all: true }), // Adiciona cores à consola
                timestamp({ format: 'HH:mm:ss' }),
                customFormat
            ),
        }),

        // 2. Ficheiro de Logs Principal
        new winston.transports.File({ 
            filename: 'backend/logs/combined.log', 
            level: 'info', // Apenas info e acima
            format: combine(
                timestamp(),
                json()
            ) 
        }),
        
        // 3. Ficheiro de Erros Críticos (para monitorizacao)
        new winston.transports.File({ 
            filename: 'backend/logs/error.log', 
            level: 'error', 
            format: combine(
                timestamp(),
                errors({ stack: true }), // Captura o stack trace
                json()
            ) 
        }),
    ],
    // Capturar stack traces para todos os logs de erro
    format: errors({ stack: true }),
});