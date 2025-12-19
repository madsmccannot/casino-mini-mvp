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
        // Mapeamento simplificado (Apenas Solana)
        const apiId = 'solana';

        // Verificar Cache
        const cached = priceCache[symbol];
        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            return cached.price;
        }

        try {
            // Usar CoinGecko API
            const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${apiId}&vs_currencies=usd`);
            
            const price = response.data[apiId]?.usd;
            
            if (!price) throw new Error('Price not found');

            // Atualizar Cache
            priceCache[symbol] = { price, timestamp: Date.now() };
            
            logger.info(`Oracle Price Update: 1 SOL = $${price}`);
            return price;

        } catch (error: any) {
            logger.error(`Failed to fetch price for SOL`, { error: error.message });
            
            // Fallback de emergência (valor aproximado fixo para não travar o sistema)
            // Se a API falhar, o jogo continua a assumir 1 SOL = $150 (ajusta conforme necessário)
            return 150; 
        }
    }
};