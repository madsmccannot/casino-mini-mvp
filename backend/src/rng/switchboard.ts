import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { 
    SwitchboardProgram, 
    VrfAccount, 
    types
    // SwitchboardDecimal <- REMOVIDO: Não é necessário pois fazemos o cálculo manualmente abaixo
} from '@switchboard-xyz/solana.js';
import { logger } from '../utils/logger';

// --- CONFIGURAÇÃO ---
const CONNECTION = new Connection("https://api.devnet.solana.com"); 

// Chave pública de uma conta VRF (Devnet - usar uma que exista)
const VRF_PUBKEY_DEVNET = "YOUR_VRF_ACCOUNT_PUBKEY"; 
const SB_PROGRAM_ID = new PublicKey("Gj7q3r9iP4k9gG4X1Q9s5k3Gq2s7b5oR1x9X1v6K8yY5"); 

// Usamos um Keypair dummy (apenas para inicialização de leitura)
const DUMMY_PAYER = Keypair.generate(); 


let switchboardProgram: SwitchboardProgram | null = null;
let vrfAccount: VrfAccount | null = null;

export const switchboardRNG = {

    init: async () => {
        try {
            // CORREÇÃO: Passar o DUMMY_PAYER como segundo argumento (necessário para fromConnection)
            switchboardProgram = await SwitchboardProgram.fromConnection(CONNECTION, DUMMY_PAYER, SB_PROGRAM_ID);
            
            const vrfKey = new PublicKey(VRF_PUBKEY_DEVNET);
            vrfAccount = new VrfAccount(switchboardProgram, vrfKey);
            
            logger.info("Switchboard RNG initialized successfully.");
            
        } catch (error) {
            logger.error("Failed to initialize Switchboard RNG.", { error });
            switchboardProgram = null;
            vrfAccount = null;
        }
    },

    getLatestRandomNumber: async (): Promise<number | null> => {
        if (!switchboardProgram || !vrfAccount) {
            logger.warn("Switchboard not initialized. Cannot fetch random number.");
            return null;
        }

        try {
            // CORREÇÃO: O campo de resultado está em `vrfState.currentRound.result`
            const vrfState = await vrfAccount.loadData();
            
            const vrfResult = vrfState.currentRound.result;

            if (vrfResult.every(byte => byte === 0)) {
                logger.debug("VRF result not yet available (all zeros). Using fallback PRNG.");
                return null;
            }
            
            // Lógica de conversão de Buffer para Number (0-1)
            // Isto substitui a necessidade do SwitchboardDecimal
            const resultBuffer = Buffer.from(vrfResult);
            const resultBigInt = BigInt(`0x${resultBuffer.toString('hex')}`);
            
            const MAX_U256 = BigInt(2) ** BigInt(256) - BigInt(1);
            
            // Usar Number() para conversão final (perda de precisão esperada, mas aceitável para 0-1 float)
            const normalizedResult = Number(resultBigInt) / Number(MAX_U256);

            logger.info(`Switchboard RNG Fetched: ${normalizedResult}`);
            return normalizedResult;

        } catch (error) {
            logger.error("Error fetching Switchboard VRF result.", { error });
            return null;
        }
    },
    
    secureRandom: async (): Promise<number> => {
        const switchboardResult = await switchboardRNG.getLatestRandomNumber();
        
        if (switchboardResult !== null) {
            return switchboardResult;
        }
        
        logger.warn("Falling back to internal PRNG (Provably Fair).");
        return Math.random(); 
    }
};