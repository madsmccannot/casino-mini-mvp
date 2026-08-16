import { useSportsStore } from '../state/sportsStore';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const URL = API_URL.replace(/^http/, 'ws').replace(/\/api\/?$/, '/api/sports/stream');
export const connectOddsStream = () => {
  let active = true; let socket: WebSocket | undefined; let retry: ReturnType<typeof setTimeout>;
  const connect = () => {
    socket = new WebSocket(URL);
    socket.onopen = () => useSportsStore.getState().setConnected(true);
    socket.onmessage = event => { const payload = JSON.parse(event.data); if (payload.type === 'odds') useSportsStore.getState().updateMarkets(payload.markets); };
    socket.onclose = () => { useSportsStore.getState().setConnected(false); if (active) retry = setTimeout(connect, 1500); };
  };
  connect(); return () => { active = false; clearTimeout(retry); socket?.close(); };
};
