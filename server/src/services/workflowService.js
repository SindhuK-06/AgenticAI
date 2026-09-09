const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');

class WorkflowService {
  async createWorkflow(userId, data) {
    const workflow = await Workflow.create({
      name: data.name || 'Untitled Workflow',
      description: data.description || '',
      owner: userId,
      status: data.status || 'active',
      triggerConfig: data.triggerConfig || { type: 'manual', config: {} },
      nodes: data.nodes || [],
      edges: data.edges || [],
      version: 1,
      tags: data.tags || ['Automation'],
    });

    return workflow;
  }

  async getWorkflows(userId, { search, status, tag } = {}) {
    const query = { owner: userId };
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const workflows = await Workflow.find(query);
    if (tag && tag !== 'all') {
      return workflows.filter((w) => (w.tags || []).includes(tag));
    }
    return workflows;
  }

  async getWorkflowById(userId, id) {
    const workflow = await Workflow.findById(id);
    if (!workflow) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      throw err;
    }
    return workflow;
  }

  async updateWorkflow(userId, id, data) {
    const workflow = await Workflow.findById(id);
    if (!workflow) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      throw err;
    }

    // Check if version should increment
    const nodesChanged = JSON.stringify(data.nodes || []) !== JSON.stringify(workflow.nodes || []);
    const edgesChanged = JSON.stringify(data.edges || []) !== JSON.stringify(workflow.edges || []);
    const newVersion = nodesChanged || edgesChanged ? (workflow.version || 1) + 1 : workflow.version || 1;

    const updated = await Workflow.findByIdAndUpdate(
      id,
      {
        name: data.name !== undefined ? data.name : workflow.name,
        description: data.description !== undefined ? data.description : workflow.description,
        status: data.status !== undefined ? data.status : workflow.status,
        triggerConfig: data.triggerConfig !== undefined ? data.triggerConfig : workflow.triggerConfig,
        nodes: data.nodes !== undefined ? data.nodes : workflow.nodes,
        edges: data.edges !== undefined ? data.edges : workflow.edges,
        version: newVersion,
        tags: data.tags !== undefined ? data.tags : workflow.tags,
      },
      { new: true }
    );

    return updated;
  }

  async duplicateWorkflow(userId, id) {
    const source = await this.getWorkflowById(userId, id);
    const cloned = await Workflow.create({
      name: `${source.name} (Copy)`,
      description: source.description,
      owner: userId,
      status: 'draft',
      triggerConfig: source.triggerConfig,
      nodes: source.nodes,
      edges: source.edges,
      version: 1,
      tags: source.tags,
    });

    return cloned;
  }

  async deleteWorkflow(userId, id) {
    const workflow = await this.getWorkflowById(userId, id);
    await Workflow.findByIdAndDelete(id);
    return { success: true, deletedId: id };
  }

  async getDashboardMetrics(userId) {
    const allWorkflows = await Workflow.find({ owner: userId });
    const allExecutions = await Execution.find({}, { createdAt: -1 }, 100);

    const totalWorkflows = allWorkflows.length;
    const activeWorkflows = allWorkflows.filter((w) => w.status === 'active').length;

    const totalExecutions = allExecutions.length;
    const completedExecutions = allExecutions.filter((e) => e.status === 'COMPLETED').length;
    const failedExecutions = allExecutions.filter((e) => e.status === 'FAILED').length;
    const runningExecutions = allExecutions.filter((e) => e.status === 'RUNNING' || e.status === 'RETRYING').length;

    const successRate = totalExecutions > 0 ? Math.round((completedExecutions / totalExecutions) * 100) : 100;
    const avgDuration =
      completedExecutions > 0
        ? Math.round(
            allExecutions
              .filter((e) => e.status === 'COMPLETED' && e.duration)
              .reduce((acc, e) => acc + e.duration, 0) / completedExecutions
          )
        : 850;

    // Recent execution logs for AI Activity stream
    const recentLogs = await ExecutionLog.find({}, { timestamp: -1 });

    return {
      metrics: {
        totalWorkflows,
        activeWorkflows,
        totalExecutions,
        completedExecutions,
        failedExecutions,
        runningExecutions,
        successRate,
        avgDurationMs: avgDuration,
      },
      recentWorkflows: allWorkflows.slice(0, 5),
      recentExecutions: allExecutions.slice(0, 8),
      recentActivity: recentLogs.slice(-10).reverse(),
    };
  }
}

module.exports = new WorkflowService();
