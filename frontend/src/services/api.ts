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
    // O backend agora valida o user pelo Token, não precisamos de enviar walletAddress no body
    return request<any>('play', {
      method: 'POST',
      body: JSON.stringify({ game, betAmount, params, action, idempotencyKey: crypto.randomUUID() })
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
