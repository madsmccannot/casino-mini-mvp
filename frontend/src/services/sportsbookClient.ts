import { api } from './api';
export const sportsbookClient = {
  events: (query = '') => api.get(`sports/events${query}`), event: (id: string) => api.get(`sports/events/${id}`),
  tickets: () => api.get('sports/tickets'),
  placeTicket: (input: any) => api.post('sports/tickets', { ...input, ticketId: crypto.randomUUID() }),
  cashoutQuote: (ticketId: string) => api.get(`sports/tickets/${encodeURIComponent(ticketId)}/cashout`),
  cashout: (ticketId: string, quoteId: string) => api.post(`sports/tickets/${encodeURIComponent(ticketId)}/cashout`, { quoteId })
};
