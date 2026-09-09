const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { PORT, CLIENT_URL, NODE_ENV } = require('./config/env');
const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');
const { initQueue } = require('./queues/executionQueue');
const { errorHandler } = require('./middleware');

// Routes
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const executionRoutes = require('./routes/executionRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

// 1. Initialize Real-Time WebSockets
initSocket(server);

// 2. Global Security & Utility Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const allowedOrigins = [
  CLIENT_URL,
  CLIENT_URL.replace(/\/$/, ''),
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes(origin.replace(/\/$/, '')) ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback to allow connection with credentials
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 3. Auth Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. Mount API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);

// Root fallback
app.get('/', (req, res) => {
  res.json({
    name: 'Agentflow_AI Orchestration API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// 5. Centralized Error Handler
app.use(errorHandler);

// 6. Bootstrap Database, Queues, and Server Listener
const startServer = async () => {
  await connectDB();
  initQueue();

  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  🚀 Agentflow_AI Server running on port ${PORT}`);
    console.log(`  🔗 Client URL: ${CLIENT_URL}`);
    console.log(`  ⚡ Multi-Agent Orchestrator: Online`);
    console.log(`====================================================`);
  });
};

if (require.main === module) {
  startServer().catch((err) => {
    console.error('[Server] Fatal startup error:', err);
  });
}

module.exports = { app, server, startServer };
