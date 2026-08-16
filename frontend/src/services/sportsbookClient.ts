import { api } from './api';
export const sportsbookClient = {
  events: (query = '') => api.get(`sports/events${query}`), event: (id: string) => api.get(`sports/events/${id}`),
  tickets: () => api.get('sports/tickets'),
  placeTicket: (input: any) => api.post('sports/tickets', { ...input, ticketId: crypto.randomUUID() })
};
