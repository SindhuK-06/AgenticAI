const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const Workflow = require('../models/Workflow');
const orchestrator = require('../agents/orchestrator');
const { addExecutionJob } = require('../queues/executionQueue');

class ExecutionService {
  async triggerExecution({ workflowId, userId, inputs = {}, triggerSource = 'manual' }) {
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      throw err;
    }

    // Capture immutable snapshot of nodes and edges at execution time
    const workflowSnapshot = {
      id: workflow._id || workflow.id,
      name: workflow.name,
      description: workflow.description,
      triggerConfig: workflow.triggerConfig,
      nodes: JSON.parse(JSON.stringify(workflow.nodes || [])),
      edges: JSON.parse(JSON.stringify(workflow.edges || [])),
      version: workflow.version,
    };

    const execution = await Execution.create({
      workflowId: workflow._id || workflow.id,
      workflowSnapshot,
      status: 'PENDING',
      currentNode: null,
      startTime: new Date(),
      inputs,
      outputs: {},
      error: null,
      retryCount: 0,
      triggerSource,
      langGraphStatus: orchestrator.getLangGraphStatus(),
      confidenceScore: 0.95,
    });

    const executionId = execution._id || execution.id;

    // Enqueue background execution job
    await addExecutionJob(executionId, userId);

    return execution;
  }

  async listExecutions({ workflowId = null, status = null, limit = 50, skip = 0 } = {}) {
    const query = {};
    if (workflowId) query.workflowId = workflowId;
    if (status && status !== 'all') query.status = status;

    const executions = await Execution.find(query, { createdAt: -1 }, parseInt(limit), parseInt(skip));
    const total = await Execution.countDocuments(query);

    return {
      executions,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    };
  }

  async getExecutionById(executionId) {
    const execution = await Execution.findById(executionId);
    if (!execution) {
      const err = new Error('Execution not found');
      err.statusCode = 404;
      throw err;
    }
    return execution;
  }

  async getExecutionTimeline(executionId) {
    const logs = await ExecutionLog.find({ executionId }, { timestamp: 1 });
    const execution = await Execution.findById(executionId);

    return {
      executionId,
      status: execution?.status || 'UNKNOWN',
      duration: execution?.duration || 0,
      confidenceScore: execution?.confidenceScore || 0.95,
      langGraphStatus: execution?.langGraphStatus || 'available',
      logs,
    };
  }

  async pauseExecution(executionId) {
    orchestrator.pauseExecution(executionId);
    await Execution.findByIdAndUpdate(executionId, { status: 'PAUSED' });
    return { success: true, executionId, status: 'PAUSED' };
  }

  async resumeExecution(executionId) {
    orchestrator.resumeExecution(executionId);
    await Execution.findByIdAndUpdate(executionId, { status: 'RUNNING' });
    return { success: true, executionId, status: 'RUNNING' };
  }

  async cancelExecution(executionId) {
    orchestrator.cancelExecution(executionId);
    await Execution.findByIdAndUpdate(executionId, { status: 'CANCELLED' });
    return { success: true, executionId, status: 'CANCELLED' };
  }
}

module.exports = new ExecutionService();
