import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (typeof window === 'undefined') return null;

  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to realtime engine:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from realtime engine');
    });
  }

  return socket;
};

export const joinExecutionRoom = (executionId) => {
  const s = getSocket();
  if (s && executionId) {
    s.emit('join_execution', executionId);
  }
};

export const leaveExecutionRoom = (executionId) => {
  const s = getSocket();
  if (s && executionId) {
    s.emit('leave_execution', executionId);
  }
};

export const joinUserRoom = (userId) => {
  const s = getSocket();
  if (s && userId) {
    s.emit('join_user', userId);
  }
};

export default {
  getSocket,
  joinExecutionRoom,
  leaveExecutionRoom,
  joinUserRoom,
};
