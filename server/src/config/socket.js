const { Server } = require('socket.io');
const { CLIENT_URL } = require('./env');

let io = null;

const initSocket = (server) => {
  const allowedOrigins = [
    CLIENT_URL,
    CLIENT_URL.replace(/\/$/, ''),
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes(origin.replace(/\/$/, '')) || origin.endsWith('.vercel.app')) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join execution room for live timeline
    socket.on('join_execution', (executionId) => {
      if (executionId) {
        socket.join(`execution:${executionId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined execution:${executionId}`);
      }
    });

    socket.on('leave_execution', (executionId) => {
      if (executionId) {
        socket.leave(`execution:${executionId}`);
      }
    });

    // Join user notification room
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined user:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    console.warn('[Socket.IO] Warning: Socket instance requested before initialization');
  }
  return io;
};

const emitExecutionEvent = (executionId, eventName, data) => {
  if (io && executionId) {
    io.to(`execution:${executionId}`).emit(eventName, data);
    // Also broadcast on general execution feed
    io.emit('execution_event', { executionId, eventName, data });
  }
};

const emitNotification = (userId, notification) => {
  if (io && userId) {
    io.to(`user:${userId}`).emit('notification', notification);
    io.emit('global_notification', notification);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitExecutionEvent,
  emitNotification,
};
