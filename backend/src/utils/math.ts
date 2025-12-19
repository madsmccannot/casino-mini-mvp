// NOTA: O SDK da Solana usa 1,000,000,000 (10^9) Lamports por SOL.
const LAMPORTS_PER_SOL = 1_000_000_000;

export const mathUtils = {

    /**
     * Converte Lamports para SOL.
     * @param lamports - O valor em Lamports (BigInt ou number).
     * @returns O valor correspondente em SOL (number).
     */
    lamportsToSol: (lamports: number | bigint): number => {
        return Number(lamports) / LAMPORTS_PER_SOL;
    },

    /**
     * Converte SOL para Lamports.
     * @param sol - O valor em SOL (number).
     * @returns O valor correspondente em Lamports (number - usar BigInt e uma biblioteca BigNumber em produção é recomendado).
     */
    solToLamports: (sol: number): number => {
        // Arredonda para baixo para evitar problemas de ponto flutuante em Lamports
        return Math.floor(sol * LAMPORTS_PER_SOL);
    },
    
    /**
     * Arredonda um número para um número específico de casas decimais.
     * @param num - O número a arredondar.
     * @param decimals - O número de casas decimais.
     * @returns O número arredondado.
     */
    round: (num: number, decimals: number): number => {
        const factor = 10 ** decimals;
        return Math.round(num * factor) / factor;
    }
};