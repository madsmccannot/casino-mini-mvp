import * as crypto from 'crypto';

/**
 * Gera um hash SHA256 de uma string de input.
 * Essencial para criar o "compromisso" (Commit) do resultado antes de o utilizador apostar.
 * @param data A string para fazer o hash (ex: 'server_seed:client_seed:nonce')
 * @returns O hash SHA256 em formato hexadecimal.
 */
export const sha256 = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};