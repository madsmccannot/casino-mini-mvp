import { useWalletStore } from '../state/walletStore';

// URL do Backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const request = async <T>(endpoint: string, init: RequestInit = {}): Promise<T> => {
  const { token } = useWalletStore.getState();
  const response = await fetch(`${API_URL}/${endpoint.replace(/^\//, '')}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers
    }
  });
  const data = await response.json().catch(() => ({ error: 'Invalid server response' }));
  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`) as Error & { response?: { data: unknown } };
    error.response = { data };
    throw error;
  }
  return data as T;
};

export const api = {
  // --- APOSTAS ---
  placeBet: async (game: string, betAmount: number, params: any, action: string = 'bet') => {
    let committedParams = params;
    if (action === 'bet') {
      const clientSeed = params?.clientSeed || crypto.randomUUID();
      const nonce = Number.isSafeInteger(params?.nonce) && params.nonce >= 0 ? params.nonce : 0;
      const commitment = await request<any>('fairness/commit', {
        method: 'POST', body: JSON.stringify({ clientSeed, nonce })
      });
      committedParams = { ...params, clientSeed, nonce, fairnessCommitId: commitment.commitId, commitHash: commitment.commitHash };
    }
    // The backend binds the JWT to the internal Account ID; wallet addresses never come from bet payloads.
    return request<any>('play', {
      method: 'POST',
      body: JSON.stringify({ game, betAmount, params: committedParams, action, idempotencyKey: crypto.randomUUID() })
    });
  },

  // --- GET Genérico ---
  get: async (endpoint: string) => {
    return request<any>(endpoint);
  },

  // --- POST Genérico ---
  post: async (endpoint: string, data: any) => {
    return request<any>(endpoint, { method: 'POST', body: JSON.stringify(data) });
  }
};
