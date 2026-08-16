import { Connection, PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';
import { solanaWallet } from '../wallet/solanaWallet';

dotenv.config();

// Configuração
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
// Inicializar Conexão
const connection = new Connection(RPC_URL, 'confirmed');

export const getCasinoPublicKey = () => {
    return solanaWallet.getAddress();
};

/**
 * Obtém o saldo de qualquer carteira em SOL
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
    const casinoKeypair = solanaWallet.getKeypair();
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 2000; // Aumentei ligeiramente para dar tempo à propagação

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
                    // Verifica se o dinheiro foi PARA a carteira do casino
                    if (info.destination === casinoKeypair.publicKey.toBase58()) {
                        // Verifica se veio da carteira do utilizador
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
 * Usado pelo Payout do Jogo e pelo Withdrawal do Admin.
 */
export const processWithdrawal = async (userAddress: string, amountSol: number) => {
    try {
        const casinoKeypair = solanaWallet.getKeypair();
        // 1. Verificação de Segurança (Hot Wallet tem fundos?)
        const currentBalance = await connection.getBalance(casinoKeypair.publicKey);
        const amountLamports = Math.floor(amountSol * LAMPORTS_PER_SOL);
        
        // Deixamos uma margem de 0.005 SOL para taxas de gás
        if (currentBalance < (amountLamports + 5000)) {
            logger.error(`❌ Insufficient funds in Hot Wallet. Has: ${currentBalance}, Needs: ${amountLamports}`);
            throw new Error("Casino Hot Wallet insufficient funds. Contact support.");
        }

        // 2. Construir Transação
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: casinoKeypair.publicKey,
                toPubkey: new PublicKey(userAddress),
                lamports: amountLamports,
            })
        );

        // 3. Enviar e Confirmar
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
        // Repassamos o erro original se for de fundos, senão genérico
        if (error.message.includes("Hot Wallet")) throw error;
        throw new Error("Blockchain transfer failed. Please try again later.");
    }
};
