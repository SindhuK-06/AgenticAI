const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const { REDIS_URL } = require('../config/env');
const orchestrator = require('../agents/orchestrator');

let isRedisConnected = false;
let executionQueue = null;
let executionWorker = null;

// In-Memory Async Queue Fallback
const inMemoryQueue = [];
let isProcessingInMemory = false;

const processInMemoryQueue = async () => {
  if (isProcessingInMemory || inMemoryQueue.length === 0) return;
  isProcessingInMemory = true;

  while (inMemoryQueue.length > 0) {
    const job = inMemoryQueue.shift();
    try {
      if (job.delay && job.delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, job.delay));
      }
      console.log(`[InMemoryQueue] Processing job: ${job.name} (Execution: ${job.data.executionId})`);
      await orchestrator.runWorkflow(job.data.executionId, job.data.userId);
    } catch (err) {
      console.error(`[InMemoryQueue] Job execution error:`, err.message);
    }
  }

  isProcessingInMemory = false;
};

const initQueue = () => {
  try {
    const redisConnection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 1000,
      lazyConnect: true,
      retryStrategy: () => null,
    });

    redisConnection.on('error', () => {
      isRedisConnected = false;
    });

    redisConnection
      .connect()
      .then(() => {
        console.log('[Queue] Connected to Redis BullMQ');
        isRedisConnected = true;

        executionQueue = new Queue('workflow-executions', { connection: redisConnection });
        executionWorker = new Worker(
          'workflow-executions',
          async (job) => {
            const { executionId, userId } = job.data;
            await orchestrator.runWorkflow(executionId, userId);
          },
          { connection: redisConnection, concurrency: 5 }
        );
      })
      .catch(() => {
        console.log('[Queue] Redis not detected. Switched to in-memory async queue.');
        isRedisConnected = false;
      });
  } catch (err) {
    console.log('[Queue] Using in-memory async queue.');
    isRedisConnected = false;
  }
};

const addExecutionJob = async (executionId, userId, options = {}) => {
  if (isRedisConnected && executionQueue) {
    try {
      return await executionQueue.add(
        'execute_workflow',
        { executionId, userId },
        {
          delay: options.delay || 0,
          attempts: options.attempts || 1,
          removeOnComplete: true,
        }
      );
    } catch (e) {
      console.warn('[Queue] Redis enqueue fallback to in-memory:', e.message);
    }
  }

  // Enqueue in memory
  inMemoryQueue.push({
    name: 'execute_workflow',
    data: { executionId, userId },
    delay: options.delay || 0,
  });

  setImmediate(processInMemoryQueue);
  return { id: `inmem_${Date.now()}` };
};

module.exports = {
  initQueue,
  addExecutionJob,
  isRedisActive: () => isRedisConnected,
};
