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

// Interceptor: Adiciona o walletAddress aos HEADERS de todos os pedidos
apiClient.interceptors.request.use((config) => {
  // Vamos buscar o endereço à Store Global
  const walletAddress = useWalletStore.getState().address;
  
  // Se tivermos um endereço conectado, colamo-lo no cabeçalho do pedido
  if (walletAddress) {
    config.headers['x-wallet-address'] = walletAddress;
  }

  // Manter compatibilidade antiga (opcional, mas seguro): injetar no body se for POST
  if (config.method === 'post' && walletAddress && config.data) {
    config.data = {
      ...config.data,
      walletAddress: config.data.walletAddress || walletAddress
    };
  }
  
  return config;
});

export const api = {
  // --- APOSTAS ---
  placeBet: async (game: string, betAmount: number, params: any, action: string = 'bet') => {
    const response = await apiClient.post('/play', {
      game,
      betAmount,
      params,
      action
    });
    return response.data;
  },

  // --- GET (Admin, Stats, etc) ---
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