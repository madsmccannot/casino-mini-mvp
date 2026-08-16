import { api } from './api';

export const accountClient = {
  profile: () => api.get('account/profile'),
  updateProfile: (displayName: string | null) => api.patch('account/profile', { displayName }),
  bets: (page = 1) => api.get(`account/bets?page=${page}&limit=20`),
  favorites: () => api.get('account/favorites'),
  addFavorite: (itemType: string, itemId: string) => api.post('account/favorites', { itemType, itemId }),
  removeFavorite: (itemType: string, itemId: string) => api.post('account/favorites/remove', { itemType, itemId }),
  retention: () => api.get('account/retention')
};
