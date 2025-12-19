import { PublicKey } from '@solana/web3.js';

/**
 * Valida se uma string é um endereço de chave pública (PublicKey) válido da Solana.
 * @param address - A string a validar.
 * @returns true se for um endereço válido, false caso contrário.
 */
export const isValidSolanaAddress = (address: string): boolean => {
    if (!address) return false;
    
    try {
        // Tenta criar uma nova PublicKey a partir da string
        new PublicKey(address);
        // Se não lançar erro, a estrutura base do endereço está correta.
        return true;
    } catch (e) {
        // Se lançar erro, não é um endereço válido.
        return false;
    }
};

/**
 * Valida se um valor de aposta está dentro dos limites de SOL.
 * @param amount - O valor da aposta em SOL.
 * @param min - A aposta mínima permitida.
 * @param max - A aposta máxima permitida.
 * @returns true se a aposta for válida, ou uma string de erro.
 */
export const validateBetAmount = (amount: number, min: number, max: number): true | string => {
    if (isNaN(amount) || amount <= 0) {
        return "Amount must be greater than zero.";
    }
    if (amount < min) {
        return `Minimum bet is ${min.toFixed(4)} SOL.`;
    }
    if (amount > max) {
        return `Maximum bet is ${max.toFixed(4)} SOL.`;
    }
    return true;
};