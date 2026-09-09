const express = require('express');
const { getDBStatus } = require('../config/db');
const { isRedisActive } = require('../queues/executionQueue');
const orchestrator = require('../agents/orchestrator');

const router = express.Router();

router.get('/', (req, res) => {
  const dbStatus = getDBStatus();
  const redisActive = isRedisActive();
  const langGraph = orchestrator.getLangGraphStatus();

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'Agentflow_AI Orchestration Server',
    database: dbStatus,
    queue: {
      mode: redisActive ? 'redis-bullmq' : 'in-memory-async',
      redisActive,
    },
    orchestration: {
      langGraph,
      agents: ['planner', 'execution', 'validation', 'recovery', 'monitoring'],
    },
  });
});

module.exports = router;
