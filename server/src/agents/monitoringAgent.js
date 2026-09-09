const ExecutionLog = require('../models/ExecutionLog');
const { emitExecutionEvent } = require('../config/socket');

class MonitoringAgent {
  constructor() {
    this.name = 'monitoring';
  }

  /**
   * Logs an agent event to the database and broadcasts in real-time over Socket.IO
   */
  async logEvent({ executionId, workflowId, nodeId = null, agent, level = 'info', message, metadata = {} }) {
    try {
      const logEntry = await ExecutionLog.create({
        executionId,
        workflowId,
        nodeId,
        agent,
        level,
        message,
        metadata,
        timestamp: new Date(),
      });

      // Emit live real-time event to connected Socket.IO clients
      emitExecutionEvent(executionId, 'agent_event', {
        id: logEntry._id || logEntry.id,
        executionId,
        workflowId,
        nodeId,
        agent,
        level,
        message,
        metadata,
        timestamp: logEntry.timestamp,
      });

      return logEntry;
    } catch (err) {
      console.error('[MonitoringAgent] Error recording log event:', err.message);
      return null;
    }
  }

  /**
   * Emits overall execution status change (RUNNING, PAUSED, COMPLETED, FAILED, etc.)
   */
  emitStatusUpdate(executionId, status, extraData = {}) {
    emitExecutionEvent(executionId, 'execution_status', {
      executionId,
      status,
      ...extraData,
      timestamp: new Date(),
    });
  }
}

module.exports = new MonitoringAgent();
