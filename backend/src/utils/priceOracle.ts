import axios from 'axios';
import { logger } from './logger';

// Cache simples para não estourar o limite da API gratuita
let priceCache: { [key: string]: { price: number, timestamp: number } } = {};
const CACHE_DURATION = 60 * 1000; // 1 minuto

export const priceOracle = {
    /**
     * Obtém o preço atual de SOL em USD.
     * @param symbol 'SOL' (Padrão)
     */
    getPrice: async (symbol: string = 'SOL'): Promise<number> => {
        const apiId = 'solana';

        // 1. Verificar Cache
        const cached = priceCache[symbol];
        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            return cached.price;
        }

        try {
            // 2. Tentar API externa (CoinGecko)
            // Timeout curto (2s) para não prender o request do utilizador se a API estiver lenta
            const response = await axios.get(
                `https://api.coingecko.com/api/v3/simple/price?ids=${apiId}&vs_currencies=usd`,
                { timeout: 2000 } 
            );
            
            const price = response.data[apiId]?.usd;
            
            if (!price) throw new Error('Price data missing in response');

            // 3. Atualizar Cache
            priceCache[symbol] = { price, timestamp: Date.now() };
            
            logger.info(`Oracle Price Update: 1 SOL = $${price}`);
            return price;

        } catch (error: any) {
            // Não fazemos log de erro completo para não poluir, apenas aviso
            logger.warn(`Oracle API failed (${error.message}). Using fallback price.`);
            
            // 4. Fallback de emergência
            // Se já tivermos um valor em cache (mesmo antigo), usamos esse em vez do fixo
            if (cached) return cached.price;

            return 150; // Valor fixo de segurança
        }
    }
};