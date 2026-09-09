const workflowService = require('../services/workflowService');
const aiService = require('../services/aiService');
const executionService = require('../services/executionService');

class WorkflowController {
  async getDashboard(req, res, next) {
    try {
      const stats = await workflowService.getDashboardMetrics(req.user.id);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  async listWorkflows(req, res, next) {
    try {
      const { search, status, tag } = req.query;
      const workflows = await workflowService.getWorkflows(req.user.id, { search, status, tag });
      res.status(200).json({
        success: true,
        data: workflows,
      });
    } catch (err) {
      next(err);
    }
  }

  async createWorkflow(req, res, next) {
    try {
      const workflow = await workflowService.createWorkflow(req.user.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Workflow created successfully',
        data: workflow,
      });
    } catch (err) {
      next(err);
    }
  }

  async generateWorkflow(req, res, next) {
    try {
      const { prompt, model } = req.body;
      const generated = await aiService.generateWorkflow(prompt, { model });
      res.status(200).json({
        success: true,
        message: 'Workflow graph generated successfully',
        data: generated,
      });
    } catch (err) {
      next(err);
    }
  }

  async getWorkflow(req, res, next) {
    try {
      const workflow = await workflowService.getWorkflowById(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        data: workflow,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateWorkflow(req, res, next) {
    try {
      const updated = await workflowService.updateWorkflow(req.user.id, req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Workflow updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async duplicateWorkflow(req, res, next) {
    try {
      const cloned = await workflowService.duplicateWorkflow(req.user.id, req.params.id);
      res.status(201).json({
        success: true,
        message: 'Workflow duplicated successfully',
        data: cloned,
      });
    } catch (err) {
      next(err);
    }
  }

  async executeWorkflow(req, res, next) {
    try {
      const inputs = req.body.inputs || {};
      const execution = await executionService.triggerExecution({
        workflowId: req.params.id,
        userId: req.user.id,
        inputs,
        triggerSource: req.body.triggerSource || 'manual',
      });
      res.status(202).json({
        success: true,
        message: 'Execution triggered and enqueued',
        data: execution,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteWorkflow(req, res, next) {
    try {
      const result = await workflowService.deleteWorkflow(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Workflow deleted successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new WorkflowController();
