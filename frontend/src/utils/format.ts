import { LAMPORTS_PER_SOL } from '@solana/web3.js';

// NOTA: O SDK da Solana usa 1,000,000,000 de Lamports por SOL
// Exportamos para garantir que o Frontend e o Backend usem a mesma constante.
export const SOLANA_LAMPORTS_PER_SOL = LAMPORTS_PER_SOL; 

/**
 * Converte um valor em Lamports para SOL.
 * @param lamports - O valor em Lamports (BigInt ou number).
 * @returns O valor correspondente em SOL (number).
 */
export const lamportsToSol = (lamports: number | bigint): number => {
    return Number(lamports) / SOLANA_LAMPORTS_PER_SOL;
};

/**
 * Converte um valor em SOL para Lamports.
 * @param sol - O valor em SOL (number).
 * @returns O valor correspondente em Lamports (number, mas usar BigInt em produção é mais seguro).
 */
export const solToLamports = (sol: number): number => {
    return sol * SOLANA_LAMPORTS_PER_SOL;
};

/**
 * Trunca um endereço de carteira para um formato amigável (ex: 5tpr...cg2D).
 * @param address - A string completa do endereço.
 * @param chars - Número de caracteres a mostrar no início e no fim.
 * @returns A string truncada.
 */
export const truncateAddress = (address: string, chars: number = 4): string => {
    if (!address || address.length <= chars * 2) {
        return address;
    }
    const start = address.substring(0, chars);
    const end = address.substring(address.length - chars);
    return `${start}...${end}`;
};

/**
 * Formata um valor numérico para uma string de moeda com X casas decimais.
 * @param value - O valor a formatar.
 * @param decimals - Número de casas decimais.
 * @returns A string formatada.
 */
export const formatCurrency = (value: number, decimals: number = 4): string => {
    if (isNaN(value) || value === null) return '0.0000';
    return value.toFixed(decimals);
};