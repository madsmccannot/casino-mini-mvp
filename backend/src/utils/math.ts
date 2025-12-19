// NOTA: O SDK da Solana usa 1,000,000,000 (10^9) Lamports por SOL.
const LAMPORTS_PER_SOL = 1_000_000_000;

export const mathUtils = {

    /**
     * Converte Lamports para SOL com precisão segura (4 casas decimais para display).
     */
    lamportsToSol: (lamports: number | bigint): number => {
        const val = Number(lamports) / LAMPORTS_PER_SOL;
        // Fix para floating point errors (ex: 0.0000000001)
        return Number(val.toFixed(9)); 
    },

    /**
     * Converte SOL para Lamports de forma segura.
     * Removemos casas decimais excessivas antes de multiplicar.
     */
    solToLamports: (sol: number): number => {
        // Truncamos para 9 casas decimais (limite do SOL) antes de multiplicar
        // para evitar erros como 1.0000000000001 -> 1000000001
        const fixedSol = Number(sol.toFixed(9)); 
        return Math.floor(fixedSol * LAMPORTS_PER_SOL);
    },
    
    /**
     * Arredonda um número para X casas decimais.
     */
    round: (num: number, decimals: number): number => {
        const factor = 10 ** decimals;
        return Math.round((num + Number.EPSILON) * factor) / factor;
    }
};