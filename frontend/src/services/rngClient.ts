import * as crypto from 'crypto';

// Replicamos a lógica SHA256 do backend
const sha256 = (data: string): string => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

const MAX_ROLL_VALUE = 10000;
const MAX_UINT32 = 0xFFFFFFFF; // 4294967295

/**
 * Gera o resultado final com base nas provas do servidor.
 * Esta função deve ser idêntica à lógica generateResult no backend (commitReveal.ts)
 */
const generateResult = (serverSeed: string, clientSeed: string, nonce: number): number => {
    const hashString = `${serverSeed}:${clientSeed}:${nonce}`;
    const finalHash = sha256(hashString);
    
    // Usar apenas os primeiros 8 bytes (32 bits)
    const subHash = finalHash.substring(0, 8); 
    const decimalValue = parseInt(subHash, 16);
    
    // Mapeamento para 0.00 a 99.99
    const resultRaw = (decimalValue / MAX_UINT32) * MAX_ROLL_VALUE;
    
    return Math.floor(resultRaw) / 100;
};


interface Proof {
    serverSeed: string;
    clientSeed: string;
    nonce: number;
    expectedResult: number;
    commitHash: string;
    nextCommitHash: string; // O commit hash do próximo jogo
}

export const rngClient = {
    
    /**
     * Função principal para verificar a justiça do resultado.
     * @param proof Os dados de prova recebidos do backend.
     * @returns {isFair: boolean, calculatedResult: number}
     */
    verifyResult: (proof: Proof) => {
        
        // 1. Recalcular o resultado localmente
        const calculatedResult = generateResult(
            proof.serverSeed, 
            proof.clientSeed, 
            proof.nonce
        );
        
        // 2. Verificar se o resultado calculado corresponde ao resultado esperado
        const isResultFair = calculatedResult === proof.expectedResult;
        
        // 3. (Opcional, mas recomendado) Verificar o COMPROMISSO do próximo jogo
        // O hash da semente do próximo jogo (nextCommitHash) deve ser o SHA256 da semente atual.
        const calculatedNextCommitHash = sha256(proof.serverSeed);
        const isNextCommitValid = calculatedNextCommitHash === proof.commitHash;

        return {
            isFair: isResultFair,
            calculatedResult: calculatedResult,
            isNextCommitValid: isNextCommitValid
        };
    },

    /**
     * Função para o cliente gerar a sua própria semente (se for necessário)
     */
    generateClientSeed: (): string => {
        return sha256(Math.random().toString() + Date.now() + 'client_salt');
    },

    /**
     * Função para verificar se a semente do servidor foi comprometida antes do jogo.
     */
    verifyCommit: (serverSeed: string, commitHash: string): boolean => {
        return sha256(serverSeed) === commitHash;
    }
};