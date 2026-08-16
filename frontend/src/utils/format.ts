export const SOLANA_LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * Converte Lamports para SOL de forma segura para visualização.
 */
export const lamportsToSol = (lamports: number | bigint): number => {
    // Math.abs para evitar -0.0000
    const val = Number(lamports) / SOLANA_LAMPORTS_PER_SOL;
    return parseFloat(val.toFixed(9)); // Remove precisão desnecessária além de 9 casas
};

/**
 * Converte SOL para Lamports de forma segura para transações.
 * CRÍTICO: Evita erros como 1.1 * 1e9 = 1100000000.0000001
 */
export const solToLamports = (sol: number): number => {
    // Fixamos em 9 casas decimais antes de multiplicar
    const fixedSol = Number(sol.toFixed(9));
    return Math.floor(fixedSol * SOLANA_LAMPORTS_PER_SOL);
};

/**
 * Trunca um endereço (ex: 5tpr...cg2D).
 */
export const truncateAddress = (address: string, chars: number = 4): string => {
    if (!address) return '';
    if (address.length <= chars * 2) return address;
    
    const start = address.substring(0, chars);
    const end = address.substring(address.length - chars);
    return `${start}...${end}`;
};

/**
 * Formata moeda para UI (ex: 10.5000).
 * Remove zeros à direita se não forem necessários, ou fixa decimais.
 */
export const formatCurrency = (value: number, decimals: number = 4): string => {
    if (isNaN(value) || value === null) return '0.00';
    
    // Se for zero, retorna limpo
    if (value === 0) return '0.00';

    // Fixa as casas decimais
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: decimals
    });
};
