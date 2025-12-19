import { Connection, PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

// Configuração
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const CASINO_PRIVATE_KEY = process.env.CASINO_PRIVATE_KEY;

if (!CASINO_PRIVATE_KEY) {
    logger.error("❌ CASINO_PRIVATE_KEY missing in backend .env");
    process.exit(1);
}

// Inicializar Conexão e Wallet
const connection = new Connection(RPC_URL, 'confirmed');
let casinoKeypair: Keypair;

try {
    const secretKey = bs58.decode(CASINO_PRIVATE_KEY);
    casinoKeypair = Keypair.fromSecretKey(secretKey);
    logger.info(`✅ Solana Service Online. Casino Address: ${casinoKeypair.publicKey.toBase58()}`);
} catch (err) {
    logger.error("❌ Invalid CASINO_PRIVATE_KEY format.");
    process.exit(1);
}

export const getCasinoPublicKey = () => {
    return casinoKeypair.publicKey.toBase58();
};

/**
 * NOVO: Obtém o saldo de uma carteira em SOL
 */
export const getWalletBalance = async (address: string): Promise<number> => {
    try {
        const pubKey = new PublicKey(address);
        const balance = await connection.getBalance(pubKey);
        return balance / LAMPORTS_PER_SOL;
    } catch (error) {
        logger.error(`Error fetching balance for ${address}`, error);
        return 0;
    }
};

/**
 * Verifica se um depósito é válido.
 * Inclui sistema de RETRY para lidar com atrasos do RPC.
 */
export const auditRecentDeposits = async (walletAddress: string, signature: string) => {
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 1500;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            logger.info(`🔍 Auditing tx ${signature} (Attempt ${i + 1}/${MAX_RETRIES})...`);

            const tx = await connection.getParsedTransaction(signature, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0
            });

            if (!tx) {
                if (i < MAX_RETRIES - 1) {
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                    continue; 
                }
                logger.warn(`❌ Transaction not found after retries: ${signature}`);
                return null;
            }

            const instructions = tx.transaction.message.instructions;
            let amountLamports = 0;
            let validTransfer = false;

            for (const instr of instructions) {
                if ('parsed' in instr && instr.program === 'system' && instr.parsed.type === 'transfer') {
                    const info = instr.parsed.info;
                    if (info.destination === casinoKeypair.publicKey.toBase58()) {
                        if (info.source === walletAddress) {
                            amountLamports += Number(info.lamports);
                            validTransfer = true;
                        }
                    }
                }
            }

            if (validTransfer && amountLamports > 0) {
                logger.info(`✅ Valid Deposit Found: ${amountLamports / LAMPORTS_PER_SOL} SOL`);
                return {
                    isConfirmed: true,
                    amountSol: amountLamports / LAMPORTS_PER_SOL
                };
            } else {
                logger.warn(`⚠️ Transaction found but no transfer to casino detected.`);
                return null;
            }

        } catch (error: any) {
            logger.error(`Error auditing tx: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
    }
    return null;
};

/**
 * Processa levantamentos (Envia SOL do Casino para o User)
 */
export const processWithdrawal = async (userAddress: string, amountSol: number) => {
    try {
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: casinoKeypair.publicKey,
                toPubkey: new PublicKey(userAddress),
                lamports: Math.floor(amountSol * LAMPORTS_PER_SOL),
            })
        );

        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [casinoKeypair],
            { commitment: 'confirmed' }
        );

        logger.info(`💸 Withdrawal successful: ${signature}`);
        return { tx: signature };

    } catch (error: any) {
        logger.error(`❌ Withdrawal failed: ${error.message}`);
        throw new Error("Blockchain transfer failed");
    }
};