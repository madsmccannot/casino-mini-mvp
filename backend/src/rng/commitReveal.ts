import { sha256 } from '../utils/rngUtils';
import * as crypto from 'crypto'; // <--- Importamos o crypto nativo

// Gera uma semente aleatória inicial para o servidor (Criptograficamente segura)
const generateServerSeed = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

// Valor constante para House Edge
const MAX_ROLL_VALUE = 10000;

/**
 * A lógica central do Provably Fair. Gera um resultado criptográfico de 0 a 10000.
 */
const generateResult = (serverSeed: string, clientSeed: string, nonce: number): number => {
    // 1. Criar a string de hachagem: serverSeed:clientSeed:nonce
    const hashString = `${serverSeed}:${clientSeed}:${nonce}`;
    
    // 2. Hash final para determinar o resultado
    const finalHash = sha256(hashString);
    
    // 3. Pegamos nos primeiros 8 bytes (16 caracteres hex)
    const subHash = finalHash.substring(0, 8); 
    
    // Converte hexadecimal para inteiro
    const decimalValue = parseInt(subHash, 16);
    
    // 4. Mapear para 0.00 - 99.99
    const MAX_UINT32 = 0xFFFFFFFF; // 4294967295
    
    const resultRaw = (decimalValue / MAX_UINT32) * MAX_ROLL_VALUE;
    
    return Math.floor(resultRaw) / 100;
};

// Semente inicial
let currentServerSeed = generateServerSeed();

export const rngService = {
    /**
     * Gera uma semente futura para o cliente (commit).
     */
    commit: () => {
        const commitHash = sha256(currentServerSeed);
        return { serverSeed: currentServerSeed, commitHash };
    },
    
    /**
     * Revela o resultado final do jogo.
     */
    reveal: (clientSeed: string, nonce: number): { result: number, serverSeed: string, commitHash: string } => {
        
        // 1. Gera o resultado usando a semente ATUAL
        const result = generateResult(currentServerSeed, clientSeed, nonce);
        
        // 2. Guarda a semente usada para devolver ao cliente
        const usedServerSeed = currentServerSeed;
        
        // 3. Roda a semente (Rotate Seed) para o próximo jogo
        currentServerSeed = generateServerSeed();
        
        // 4. Devolve tudo
        return { 
            result, 
            serverSeed: usedServerSeed, 
            commitHash: sha256(currentServerSeed) 
        };
    },
    
    /**
     * Helper para os jogos chamarem
     */
    generateResultForGame: (clientSeed: string, nonce: number): { randomNumber: number, proof: any } => {
        const { result: randomNumber, serverSeed, commitHash } = rngService.reveal(clientSeed, nonce);
        
        return {
            randomNumber,
            proof: { serverSeed, commitHash }
        };
    }
};