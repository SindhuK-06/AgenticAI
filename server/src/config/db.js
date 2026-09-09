const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

// Disable Mongoose command buffering so queries fail-fast to in-memory store if offline
mongoose.set('bufferCommands', false);

let isInMemory = false;
let inMemoryStore = {
  users: [],
  workflows: [],
  executions: [],
  executionLogs: [],
  integrations: [],
  notifications: [],
  agentMemories: [],
};

const connectDB = async () => {
  try {
    const isAtlas = MONGODB_URI.includes('mongodb+srv') || !MONGODB_URI.includes('127.0.0.1');
    const timeout = isAtlas ? 8000 : 2500;

    // Attempt MongoDB connection
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: timeout,
      connectTimeoutMS: timeout,
      bufferCommands: false,
    });
    console.log(`[Database] Successfully connected to MongoDB: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    isInMemory = false;
  } catch (err) {
    console.log(`[Database] MongoDB connection failed (${err.message}). Activating in-memory storage fallback for seamless local operation.`);
    isInMemory = true;
  }
};

const getDBStatus = () => ({
  connected: true,
  mode: isInMemory ? 'in-memory' : 'mongodb',
  uri: isInMemory ? 'memory://agentflow_ai' : MONGODB_URI,
});

const getInMemoryStore = () => inMemoryStore;
const isInMemoryDB = () => isInMemory;

module.exports = {
  connectDB,
  getDBStatus,
  getInMemoryStore,
  isInMemoryDB,
};
