import { api } from './api';
export const casinoCatalogClient = {
  games: () => api.get('casino/catalog'),
  launch: (gameId: string) => api.post('casino/catalog/launch', { gameId }),
  wager: (input: { wagerId: string; sessionId: string; stakeSol: number }) => api.post('casino/catalog/wagers', input)
};
