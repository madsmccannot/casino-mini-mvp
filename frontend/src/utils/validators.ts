import { PublicKey } from '@solana/web3.js';

/**
 * Valida se uma string é um endereço Solana válido.
 * Usa Regex para rapidez e PublicKey para certeza absoluta.
 */
export const isValidSolanaAddress = (address: string): boolean => {
    if (!address) return false;
    
    // 1. Check Rápido (Base58, tamanho 32-44)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!base58Regex.test(address)) return false;

    // 2. Check Robusto (SDK)
    try {
        new PublicKey(address);
        return true;
    } catch (e) {
        return false;
    }
};

/**
 * Valida inputs numéricos de aposta.
 */
export const validateBetAmount = (amount: number, min: number, max: number): true | string => {
    if (isNaN(amount)) return "Invalid amount.";
    
    if (amount <= 0) {
        return "Amount must be greater than zero.";
    }
    
    // Resolver problemas de precisão flutuante na comparação
    // ex: 0.0009999999 < 0.001
    const epsilon = 0.00000001;
    
    if (amount < min - epsilon) {
        return `Minimum bet is ${min} SOL.`;
    }
    
    if (amount > max + epsilon) {
        return `Maximum bet is ${max} SOL.`;
    }
    
    return true;
};