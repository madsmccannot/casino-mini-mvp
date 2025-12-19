import * as crypto from 'crypto';

/**
 * Utilitários de Criptografia Segura (RNG)
 * Centraliza toda a lógica de aleatoriedade para facilitar auditorias.
 */

/**
 * Gera um hash SHA256 de uma string.
 * Usado para criar o "compromisso" (Commit) e verificar integridade.
 */
export const sha256 = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Gera uma string aleatória segura (hexadecimal).
 * Usada para Server Seeds e Session IDs.
 * @param length Tamanho em bytes (padrão 32 bytes = 64 caracteres hex)
 */
export const generateRandomSeed = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Gera um número inteiro seguro entre min (inclusivo) e max (exclusivo).
 * Usado para jogos como Mines (escolher posição das bombas).
 */
export const secureRandomInt = (min: number, max: number): number => {
  return crypto.randomInt(min, max);
};