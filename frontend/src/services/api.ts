import axios from 'axios';
import { useWalletStore } from '../state/walletStore';

// URL do Backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Instância do Axios
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Injeta o TOKEN JWT em todos os pedidos
apiClient.interceptors.request.use((config) => {
  // Vamos buscar o estado atual da Store (sem hooks, acesso direto)
  const { token } = useWalletStore.getState();
  
  // SE tivermos um token (estamos logados), enviamos no header Authorization
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export const api = {
  // --- APOSTAS ---
  placeBet: async (game: string, betAmount: number, params: any, action: string = 'bet') => {
    // O backend agora valida o user pelo Token, não precisamos de enviar walletAddress no body
    const response = await apiClient.post('/play', {
      game,
      betAmount, // Opcional no 'reveal', mas o backend ignora se não precisar
      params,
      action
    });
    return response.data;
  },

  // --- GET Genérico ---
  get: async (endpoint: string) => {
    const response = await apiClient.get(`/${endpoint}`);
    return response.data;
  },

  // --- POST Genérico ---
  post: async (endpoint: string, data: any) => {
    const response = await apiClient.post(`/${endpoint}`, data);
    return response.data;
  }
};