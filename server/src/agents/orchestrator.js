const plannerAgent = require('./plannerAgent');
const executionAgent = require('./executionAgent');
const validationAgent = require('./validationAgent');
const recoveryAgent = require('./recoveryAgent');
const monitoringAgent = require('./monitoringAgent');
const Execution = require('../models/Execution');
const AgentMemory = require('../models/AgentMemory');
const notificationService = require('../services/notificationService');

// Active execution control states in memory
const executionControlState = new Map();

class Orchestrator {
  constructor() {
    this.langGraphStatus = this.checkLangGraph();
  }

  checkLangGraph() {
    try {
      require.resolve('@langchain/langgraph');
      return 'available';
    } catch {
      return 'not-installed';
    }
  }

  getLangGraphStatus() {
    return this.langGraphStatus;
  }

  // Execution Lifecycle Controls
  pauseExecution(executionId) {
    executionControlState.set(executionId, 'PAUSED');
  }

  resumeExecution(executionId) {
    executionControlState.set(executionId, 'RUNNING');
  }

  cancelExecution(executionId) {
    executionControlState.set(executionId, 'CANCELLED');
  }

  getControlState(executionId) {
    return executionControlState.get(executionId) || 'RUNNING';
  }

  /**
   * Main Agentic Orchestration Runner
   */
  async runWorkflow(executionId, userId) {
    console.log(`[Orchestrator] Starting agentic execution [${executionId}]`);
    const execution = await Execution.findById(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const workflowId = execution.workflowId;
    const workflowSnapshot = execution.workflowSnapshot || { nodes: [], edges: [] };
    const startTime = Date.now();

    executionControlState.set(executionId, 'RUNNING');

    // 1. UPDATE STATUS TO RUNNING
    await Execution.findByIdAndUpdate(executionId, {
      status: 'RUNNING',
      startTime: new Date(),
      langGraphStatus: this.langGraphStatus,
    });
    monitoringAgent.emitStatusUpdate(executionId, 'RUNNING', { langGraphStatus: this.langGraphStatus });

    // Step 0: Monitoring Agent starts session
    await monitoringAgent.logEvent({
      executionId,
      workflowId,
      agent: 'monitoring',
      level: 'info',
      message: `Execution initiated. Orchestration substrate: LangGraph (${this.langGraphStatus}).`,
      metadata: { langGraphStatus: this.langGraphStatus, triggerSource: execution.triggerSource },
    });

    // 2. STAGE 1: PLANNER AGENT
    const planResult = plannerAgent.plan(workflowSnapshot);
    await monitoringAgent.logEvent({
      executionId,
      workflowId,
      agent: 'planner',
      level: planResult.success ? 'info' : 'error',
      message: planResult.planSummary || 'Calculated DAG execution order.',
      metadata: {
        confidenceScore: planResult.confidenceScore,
        executionPlan: planResult.executionPlan,
        hasCycle: planResult.hasCycle,
        durationMs: planResult.durationMs,
      },
    });

    if (!planResult.success || planResult.executionPlan.length === 0) {
      await this.finalizeExecution(executionId, 'FAILED', {
        error: { message: planResult.error || 'Empty execution plan', code: 'PLANNER_ERROR' },
        startTime,
      });
      return;
    }

    // Save planner confidence to execution
    await Execution.findByIdAndUpdate(executionId, {
      confidenceScore: planResult.confidenceScore,
    });

    // Store Plan in AgentMemory
    await AgentMemory.create({
      workflowId,
      executionId,
      agentId: 'planner',
      key: 'execution_plan',
      value: planResult.executionPlan,
      confidenceScore: planResult.confidenceScore,
    });

    // 3. STAGE 2: SEQUENTIAL NODE EXECUTION WITH AGENT CHAIN
    const executionContext = {
      initialInput: execution.inputs || {},
      ...execution.inputs,
    };
    const nodeMap = new Map((workflowSnapshot.nodes || []).map((n) => [n.id, n]));
    const executedOutputs = {};

    for (let i = 0; i < planResult.executionPlan.length; i++) {
      const nodeId = planResult.executionPlan[i];
      const node = nodeMap.get(nodeId);

      if (!node) continue;

      // Check for Pause / Cancel signals
      let control = this.getControlState(executionId);
      while (control === 'PAUSED') {
        await Execution.findByIdAndUpdate(executionId, { status: 'PAUSED', currentNode: nodeId });
        monitoringAgent.emitStatusUpdate(executionId, 'PAUSED', { currentNode: nodeId });
        await monitoringAgent.logEvent({
          executionId,
          workflowId,
          nodeId,
          agent: 'monitoring',
          level: 'warning',
          message: `Execution paused by operator at node [${nodeId}]. Waiting for resume signal...`,
        });

        // Polling wait for resume/cancel
        await new Promise((resolve) => setTimeout(resolve, 1500));
        control = this.getControlState(executionId);
      }

      if (control === 'CANCELLED') {
        await this.finalizeExecution(executionId, 'CANCELLED', {
          currentNode: nodeId,
          startTime,
          outputs: executedOutputs,
        });
        await monitoringAgent.logEvent({
          executionId,
          workflowId,
          nodeId,
          agent: 'monitoring',
          level: 'warning',
          message: `Execution cancelled by operator. Terminating pipeline.`,
        });
        return;
      }

      // Update current executing node
      await Execution.findByIdAndUpdate(executionId, { currentNode: nodeId, status: 'RUNNING' });
      monitoringAgent.emitStatusUpdate(executionId, 'RUNNING', { currentNode: nodeId });

      const nodeLabel = node.data?.label || nodeId;
      let nodeRetryCount = 0;
      let nodeSucceeded = false;

      while (!nodeSucceeded) {
        // --- EXECUTION AGENT ---
        await monitoringAgent.logEvent({
          executionId,
          workflowId,
          nodeId,
          agent: 'execution',
          level: 'info',
          message: `Executing node [${nodeLabel}] (${node.data?.nodeType || node.type})`,
          metadata: { attempt: nodeRetryCount + 1, config: node.data?.config },
        });

        const execResult = await executionAgent.executeNode(node, executionContext, userId);

        if (execResult.success) {
          // --- VALIDATION AGENT ---
          const valResult = validationAgent.validate(node, execResult);
          await monitoringAgent.logEvent({
            executionId,
            workflowId,
            nodeId,
            agent: 'validation',
            level: valResult.isValid ? 'success' : 'error',
            message: valResult.validationSummary,
            metadata: { errors: valResult.errors, durationMs: valResult.durationMs },
          });

          if (valResult.isValid) {
            nodeSucceeded = true;
            executedOutputs[nodeId] = execResult.output;
            Object.assign(executionContext, execResult.output);

            await monitoringAgent.logEvent({
              executionId,
              workflowId,
              nodeId,
              agent: 'execution',
              level: 'success',
              message: `Node [${nodeLabel}] executed successfully.`,
              metadata: { outputSnippet: execResult.output, durationMs: execResult.durationMs },
            });
            break;
          } else {
            // Treat validation failure as exception for recovery agent
            execResult.success = false;
            execResult.error = { message: valResult.errors.join('; '), code: 'MISSING_FIELDS' };
          }
        }

        // --- RECOVERY AGENT (On Failure) ---
        const recResult = recoveryAgent.evaluate(execResult.error, null, nodeRetryCount);

        await monitoringAgent.logEvent({
          executionId,
          workflowId,
          nodeId,
          agent: 'recovery',
          level: recResult.decision === 'retry_with_backoff' ? 'warning' : 'error',
          message: `Recovery Agent: Failure classified as [${recResult.classification}]. Decision: ${recResult.decision}. ${recResult.suggestedFix}`,
          metadata: recResult,
        });

        if (recResult.decision === 'retry_with_backoff') {
          nodeRetryCount++;
          await Execution.findByIdAndUpdate(executionId, {
            status: 'RETRYING',
            retryCount: (execution.retryCount || 0) + 1,
          });
          monitoringAgent.emitStatusUpdate(executionId, 'RETRYING', {
            currentNode: nodeId,
            backoffMs: recResult.backoffMs,
          });

          // Wait backoff duration
          await new Promise((r) => setTimeout(r, Math.min(recResult.backoffMs, 5000)));
        } else {
          // Escalation / Pipeline Termination
          await this.finalizeExecution(executionId, 'FAILED', {
            error: {
              message: execResult.error?.message || 'Node execution failed',
              code: recResult.classification,
              nodeId,
              agent: 'recovery',
              suggestedFix: recResult.suggestedFix,
            },
            currentNode: nodeId,
            startTime,
            outputs: executedOutputs,
          });

          // Send Alert Notification to Operator
          await notificationService.createNotification({
            owner: userId,
            workflowId,
            executionId,
            type: 'failure',
            title: `Execution Failed: ${workflowSnapshot.name || 'Workflow'}`,
            message: `Pipeline failed at node "${nodeLabel}" (${recResult.classification}): ${recResult.suggestedFix}`,
            metadata: { nodeId, classification: recResult.classification },
          });

          return;
        }
      }
    }

    // 4. PIPELINE COMPLETED SUCCESSFULLY
    await this.finalizeExecution(executionId, 'COMPLETED', {
      outputs: executedOutputs,
      startTime,
    });

    await monitoringAgent.logEvent({
      executionId,
      workflowId,
      agent: 'monitoring',
      level: 'success',
      message: `Workflow completed all ${planResult.executionPlan.length} nodes successfully in ${(Date.now() - startTime)}ms.`,
      metadata: { totalDurationMs: Date.now() - startTime },
    });

    await notificationService.createNotification({
      owner: userId,
      workflowId,
      executionId,
      type: 'success',
      title: `Workflow Succeeded: ${workflowSnapshot.name || 'Workflow'}`,
      message: `All stages finished without error in ${((Date.now() - startTime) / 1000).toFixed(1)}s.`,
      metadata: { executionId, durationMs: Date.now() - startTime },
    });

    executionControlState.delete(executionId);
  }

  async finalizeExecution(executionId, status, { error = null, currentNode = null, startTime = Date.now(), outputs = {} } = {}) {
    const endTime = new Date();
    const duration = Date.now() - (startTime || Date.now());

    await Execution.findByIdAndUpdate(executionId, {
      status,
      currentNode,
      endTime,
      duration,
      outputs,
      error,
    });

    monitoringAgent.emitStatusUpdate(executionId, status, {
      endTime,
      duration,
      outputs,
      error,
    });
  }
}

module.exports = new Orchestrator();
