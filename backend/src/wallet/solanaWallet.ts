import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const CASINO_PRIVATE_KEY = process.env.CASINO_PRIVATE_KEY;

if (!CASINO_PRIVATE_KEY) {
    logger.error("❌ CASINO_PRIVATE_KEY missing in .env");
    process.exit(1);
}

let casinoKeypair: Keypair;

try {
    const secretKey = bs58.decode(CASINO_PRIVATE_KEY);
    casinoKeypair = Keypair.fromSecretKey(secretKey);
    // Não fazemos log da chave privada, apenas do endereço público
    logger.info(`🔑 Hot Wallet Loaded: ${casinoKeypair.publicKey.toBase58()}`);
} catch (error) {
    logger.error("❌ Invalid CASINO_PRIVATE_KEY format. Must be Base58.");
    process.exit(1);
}

export const solanaWallet = {
    getKeypair: (): Keypair => casinoKeypair,
    getAddress: (): string => casinoKeypair.publicKey.toBase58()
};