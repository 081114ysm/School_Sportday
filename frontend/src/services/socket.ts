import { io, Socket } from 'socket.io-client';
import { BASE_URL } from './config';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || BASE_URL;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('[소켓] 연결됨:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[소켓] 연결 해제:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[소켓] 연결 오류:', err.message);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[소켓] 재연결 완료, 시도 횟수:', attemptNumber);
    });
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
