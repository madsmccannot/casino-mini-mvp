import { logger } from '../utils/logger';
import * as crypto from 'crypto';

// NOTA: Removemos a importação do @switchboard-xyz/solana.js para resolver 
// o conflito de compilação (ESM vs CommonJS).
// O sistema usará o RNG Nativo Seguro (Crypto), que é adequado para Mainnet.

export const switchboardRNG = {

    init: async () => {
        // Apenas logamos que o módulo está em modo de compatibilidade
        logger.info("ℹ️ RNG System initialized in Native Secure Mode (Crypto).");
    },

    getLatestRandomNumber: async (): Promise<number | null> => {
        // Retornamos null para indicar que não há Oráculo externo ligado
        return null;
    },
    
    /**
     * Gera número aleatório usando a biblioteca Crypto nativa do Node.js.
     * É criptograficamente seguro e impossível de prever.
     */
    secureRandom: async (): Promise<number> => {
        // Gera 4 bytes aleatórios (32-bit integer)
        const buffer = crypto.randomBytes(4);
        const randomInt = buffer.readUInt32BE(0);
        
        // Normaliza para um float entre 0.0 e 1.0
        const secureFloat = randomInt / 0xFFFFFFFF;

        return secureFloat; 
    }
};