/**
 * Validation Agent
 * Verifies required output fields and ensures data contract integrity.
 */
class ValidationAgent {
  constructor() {
    this.name = 'validation';
  }

  validate(node, executionResult) {
    const startTime = Date.now();
    const { success, output, error, nodeId, nodeLabel } = executionResult;

    if (!success) {
      return {
        isValid: false,
        agent: this.name,
        nodeId,
        nodeLabel,
        errors: [error ? error.message : 'Execution failed without error details'],
        durationMs: Date.now() - startTime,
      };
    }

    if (output === null || output === undefined) {
      return {
        isValid: false,
        agent: this.name,
        nodeId,
        nodeLabel,
        errors: ['Output payload is null or empty'],
        durationMs: Date.now() - startTime,
      };
    }

    const errors = [];
    const config = node.data?.config || {};
    const expectedFields = config.requiredOutputFields || [];

    expectedFields.forEach((field) => {
      if (output[field] === undefined || output[field] === null || output[field] === '') {
        errors.push(`Missing required field: "${field}" in node output`);
      }
    });

    const isValid = errors.length === 0;

    return {
      isValid,
      agent: this.name,
      nodeId,
      nodeLabel,
      errors,
      validatedOutput: output,
      validationSummary: isValid
        ? `Output validation passed for node [${nodeId}]`
        : `Output validation failed with ${errors.length} contract error(s)`,
      durationMs: Date.now() - startTime,
    };
  }
}

module.exports = new ValidationAgent();
