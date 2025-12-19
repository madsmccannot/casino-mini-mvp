import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';
dotenv.config();

// A CHAVE PRIVADA SOLANA do Casino (Hot Wallet)
const CASINO_PRIVATE_KEY = process.env.CASINO_PRIVATE_KEY;

if (!CASINO_PRIVATE_KEY) {
    throw new Error("CASINO_PRIVATE_KEY not set in environment variables. Solana withdrawals will fail.");
}

// Inicializa o Keypair uma única vez
let casinoKeypair: Keypair;

try {
    // Decodifica a chave privada (Base58) para obter o Keypair
    const secretKey = bs58.decode(CASINO_PRIVATE_KEY);
    casinoKeypair = Keypair.fromSecretKey(secretKey);
} catch (error) {
    throw new Error("Invalid CASINO_PRIVATE_KEY format. Must be Base58.");
}

export const solanaWallet = {
    /**
     * Obtém o objeto Keypair da conta Solana (necessário para assinar transações).
     * @returns O Keypair do casino.
     */
    getKeypair: (): Keypair => {
        return casinoKeypair;
    },

    /**
     * Obtém o endereço público Solana do casino.
     * @returns O endereço público (string base58).
     */
    getAddress: (): string => {
        return casinoKeypair.publicKey.toBase58();
    }
};