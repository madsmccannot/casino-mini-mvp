import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';
import { getCustodyMode } from '../config/env';

dotenv.config();

const loadKeypair = (): Keypair | null => {
    if (getCustodyMode() === 'disabled') return null;
    const privateKey = process.env.CASINO_PRIVATE_KEY;
    if (!privateKey) throw new Error('CASINO_PRIVATE_KEY is required in hot_wallet mode');
    try {
        return Keypair.fromSecretKey(bs58.decode(privateKey));
    } catch {
        logger.error('Invalid CASINO_PRIVATE_KEY format. Must be Base58.');
        throw new Error('Invalid custody configuration');
    }
};

const casinoKeypair = loadKeypair();

export const solanaWallet = {
    isEnabled: (): boolean => casinoKeypair !== null,
    getKeypair: (): Keypair => {
        if (!casinoKeypair) throw new Error('Custody operations are disabled');
        return casinoKeypair;
    },
    getAddress: (): string | null => casinoKeypair?.publicKey.toBase58() || null
};
