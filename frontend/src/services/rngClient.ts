// NOTA: Usamos a API nativa do browser (window.crypto), não importamos 'crypto' do Node.

// Função SHA256 compatível com Navegador (Async)
const sha256 = async (data: string): Promise<string> => {
    // Codifica a string para bytes
    const msgBuffer = new TextEncoder().encode(data);
    
    // CORREÇÃO: Adicionado 'as any' para resolver o erro TS2769.
    // O TypeScript confunde-se com SharedArrayBuffer, mas o TextEncoder produz um ArrayBuffer seguro.
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer as any);
    
    // Converte ArrayBuffer para string Hex
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
};

const MAX_ROLL_VALUE = 10000;
const MAX_UINT32 = 0xFFFFFFFF; // 4294967295

/**
 * Gera o resultado final com base nas provas do servidor.
 * Agora é ASYNC porque usa a Web Crypto API.
 */
const generateResult = async (serverSeed: string, clientSeed: string, nonce: number): Promise<number> => {
    const hashString = `${serverSeed}:${clientSeed}:${nonce}`;
    const finalHash = await sha256(hashString);
    
    // Usar apenas os primeiros 8 bytes (16 caracteres hex)
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
    nextCommitHash?: string; // Opcional
}

export const rngClient = {
    
    /**
     * Verifica a justiça do resultado.
     * @returns Promise<{isFair: boolean, calculatedResult: number}>
     */
    verifyResult: async (proof: Proof) => {
        
        // 1. Recalcular o resultado localmente (Async)
        const calculatedResult = await generateResult(
            proof.serverSeed, 
            proof.clientSeed, 
            proof.nonce
        );
        
        // 2. Comparar (Pequena margem para erros de float, ou igualdade estrita)
        // Usamos toFixed(2) para garantir comparação justa com o backend
        const isResultFair = calculatedResult.toFixed(2) === proof.expectedResult.toFixed(2);
        
        // 3. Verificar se o ServerSeed bate certo com o Hash (Commit) anterior
        const calculatedCommitHash = await sha256(proof.serverSeed);
        const isCommitValid = calculatedCommitHash === proof.commitHash;

        return {
            isFair: isResultFair && isCommitValid,
            calculatedResult: calculatedResult,
            isCommitValid: isCommitValid
        };
    },

    /**
     * Gera uma semente do cliente aleatória
     */
    generateClientSeed: (): string => {
        // Math.random é suficiente para client seed, mas podemos adicionar entropia
        return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }
};