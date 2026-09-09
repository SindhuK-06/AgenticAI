/**
 * Planner Agent
 * Determines optimal DAG execution order, detects dependencies, and scores confidence.
 */
class PlannerAgent {
  constructor() {
    this.name = 'planner';
  }

  plan(workflowSnapshot) {
    const { nodes = [], edges = [] } = workflowSnapshot;
    const startTime = Date.now();

    if (!nodes.length) {
      return {
        success: false,
        confidenceScore: 0,
        executionPlan: [],
        error: 'Workflow contains no nodes',
        durationMs: Date.now() - startTime,
      };
    }

    // Build Adjacency List & In-degree map for Topological Sort (Kahn's Algorithm)
    const inDegree = {};
    const adjacency = {};
    const nodeMap = {};

    nodes.forEach((node) => {
      inDegree[node.id] = 0;
      adjacency[node.id] = [];
      nodeMap[node.id] = node;
    });

    edges.forEach((edge) => {
      if (adjacency[edge.source] && inDegree[edge.target] !== undefined) {
        adjacency[edge.source].push(edge.target);
        inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
      }
    });

    // Queue nodes with 0 in-degree (Entry points / Triggers)
    const queue = [];
    nodes.forEach((node) => {
      if (inDegree[node.id] === 0) {
        queue.push(node.id);
      }
    });

    const executionPlan = [];
    while (queue.length > 0) {
      const current = queue.shift();
      executionPlan.push(current);

      if (adjacency[current]) {
        adjacency[current].forEach((neighbor) => {
          inDegree[neighbor]--;
          if (inDegree[neighbor] === 0) {
            queue.push(neighbor);
          }
        });
      }
    }

    // If there are unvisited nodes, graph contains cycles or disconnected nodes
    const hasCycle = executionPlan.length < nodes.length;
    if (hasCycle) {
      // Append remaining nodes for robust execution attempt
      nodes.forEach((n) => {
        if (!executionPlan.includes(n.id)) {
          executionPlan.push(n.id);
        }
      });
    }

    // Compute confidence score based on node config completeness & graph structure
    let completenessScore = 1.0;
    nodes.forEach((node) => {
      const cfg = node.data?.config;
      if (!cfg || Object.keys(cfg).length === 0) {
        completenessScore -= 0.05;
      }
    });
    if (hasCycle) completenessScore -= 0.15;
    const confidenceScore = Math.max(0.65, Math.min(0.99, completenessScore));

    return {
      success: true,
      agent: this.name,
      confidenceScore: parseFloat(confidenceScore.toFixed(2)),
      executionPlan,
      totalNodes: nodes.length,
      entryNodeCount: nodes.filter((n) => inDegree[n.id] === 0).length,
      hasCycle,
      planSummary: `Calculated ${executionPlan.length}-stage DAG execution pipeline with ${(confidenceScore * 100).toFixed(0)}% confidence`,
      durationMs: Date.now() - startTime,
    };
  }
}

module.exports = new PlannerAgent();
