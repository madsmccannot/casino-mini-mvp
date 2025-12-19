import { sha256 } from '../utils/rngUtils';

// Gera uma semente aleatória inicial para o servidor (deveria ser guardada na DB)
const generateServerSeed = (): string => {
    return sha256(Math.random().toString() + Date.now());
};

// Valor constante para House Edge
const MAX_ROLL_VALUE = 10000;

/**
 * A lógica central do Provably Fair. Gera um resultado criptográfico de 0 a 10000.
 * @param serverSeed Semente secreta do servidor.
 * @param clientSeed Semente fornecida pelo cliente (do frontend).
 * @param nonce Contador de apostas.
 * @returns Um número entre 0 e 99.99 (float).
 */
const generateResult = (serverSeed: string, clientSeed: string, nonce: number): number => {
    // 1. Criar a string de hachagem (Hash String)
    // Este formato é padronizado em muitos casinos: serverSeed:clientSeed:nonce
    const hashString = `${serverSeed}:${clientSeed}:${nonce}`;
    
    // 2. Hash final para determinar o resultado
    const finalHash = sha256(hashString);
    
    // 3. Converter o hash hexadecimal para um número decimal grande
    // Pegamos nos primeiros 8 bytes do hash para garantir aleatoriedade suficiente
    const subHash = finalHash.substring(0, 8); 
    
    // Converte hexadecimal para inteiro (base 16)
    const decimalValue = parseInt(subHash, 16);
    
    // 4. Mapear o valor para a nossa escala (0.00 a 99.99)
    // O valor máximo de 8 bytes em hex (FFFFFFFF) é usado para normalizar.
    const MAX_UINT32 = 0xFFFFFFFF; // 4294967295
    
    // Mapeamento: (decimalValue / MAX_UINT32) * MAX_ROLL_VALUE
    const resultRaw = (decimalValue / MAX_UINT32) * MAX_ROLL_VALUE;
    
    // Retorna o resultado arredondado para duas casas decimais (ex: 78.45)
    return Math.floor(resultRaw) / 100;
};

// --- SERVIÇOS EXPORTADOS ---

// ATENÇÃO: Num cenário real, o serverSeed é guardado na DB com um hash (commit)
// Vamos usar uma semente fixa para o PoC, para facilitar o teste.
let currentServerSeed = generateServerSeed();

export const rngService = {
    /**
     * Gera uma semente futura para o cliente (commit). O cliente aposta contra este hash.
     * @returns {serverSeed: string, commitHash: string}
     */
    commit: () => {
        // Gera o hash da semente que será usada para o PRÓXIMO jogo
        const commitHash = sha256(currentServerSeed);
        return { serverSeed: currentServerSeed, commitHash };
    },
    
    /**
     * Revela o resultado final do jogo usando a semente do servidor e do cliente.
     * @param clientSeed A semente enviada pelo cliente na aposta.
     * @param nonce O nonce atual (contador de apostas do utilizador).
     * @returns {result: number, serverSeed: string}
     */
    reveal: (clientSeed: string, nonce: number): { result: number, serverSeed: string, commitHash: string } => {
        
        // 1. Gera o resultado usando a semente atual
        const result = generateResult(currentServerSeed, clientSeed, nonce);
        
        // 2. Guarda a semente que acabou de ser usada
        const usedServerSeed = currentServerSeed;
        
        // 3. (MUITO IMPORTANTE) Gera a NOVA semente para o PRÓXIMO jogo
        currentServerSeed = generateServerSeed();
        
        // 4. Devolve o resultado e as provas (serverSeed usado e commitHash da próxima semente)
        return { 
            result, 
            serverSeed: usedServerSeed, 
            commitHash: sha256(currentServerSeed) 
        };
    },
    
    /**
     * Funções auxiliares para serem chamadas nos serviços de jogo (dice, coinflip).
     * @returns O número aleatório gerado (0.00 a 99.99)
     */
    generateResultForGame: (clientSeed: string, nonce: number): { randomNumber: number, proof: any } => {
        const { result: randomNumber, serverSeed, commitHash } = rngService.reveal(clientSeed, nonce);
        
        return {
            randomNumber,
            proof: { serverSeed, commitHash }
        };
    }
};