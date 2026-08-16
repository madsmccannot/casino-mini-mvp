import { Server } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { advanceCrashRound, publicCrashRound, recoverCrashSettlements } from './crash.service';

export const attachCrashRealtime = (server: Server) => {
  const sockets = new WebSocketServer({ server, path: '/api/crash/stream', maxPayload: 1024, perMessageDeflate: false });
  sockets.on('connection', client => {
    if (sockets.clients.size > 500) client.close(1013, 'Realtime capacity reached');
  });
  let running = false;
  let lastRecovery = 0;
  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      if (Date.now() - lastRecovery >= 5_000) {
        await recoverCrashSettlements();
        lastRecovery = Date.now();
      }
      const round = await advanceCrashRound();
      const payload = JSON.stringify(publicCrashRound(round));
      for (const client of sockets.clients) if (client.readyState === WebSocket.OPEN) client.send(payload);
    } catch (error) {
      console.error('Crash round tick failed:', error);
    } finally {
      running = false;
    }
  }, 100);
  timer.unref();
  sockets.on('close', () => clearInterval(timer));
  return sockets;
};
