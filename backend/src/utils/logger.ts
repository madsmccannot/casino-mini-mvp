import winston, { format } from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = format;

// Formato personalizado para logs visuais (Dev)
const customFormat = printf(({ level, message, timestamp, stack }) => {
    if (stack) {
        return `${timestamp} [${level}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level}]: ${message}`;
});

// Detectar se estamos em produção (Railway define NODE_ENV=production)
const isProduction = process.env.NODE_ENV === 'production';

// Configuração do logger
export const logger = winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: errors({ stack: true }), // Captura stack traces sempre
    defaultMeta: { service: 'casino-backend' },
    transports: [
        // 1. Consola (Stdout) - Principal canal para o Railway/Vercel
        new winston.transports.Console({
            format: isProduction 
                ? combine(timestamp(), json()) // JSON estruturado em Prod (melhor para Datadog/Cloudwatch)
                : combine(
                    colorize({ all: true }), 
                    timestamp({ format: 'HH:mm:ss' }),
                    customFormat
                  ) // Bonito em Dev
        }),
    ],
});

// Em desenvolvimento local, podemos manter os ficheiros para debug fácil
if (!isProduction) {
    logger.add(new winston.transports.File({ 
        filename: 'backend/logs/error.log', 
        level: 'error',
        format: combine(timestamp(), json())
    }));
}