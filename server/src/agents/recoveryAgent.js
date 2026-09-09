/**
 * Recovery Agent
 * Classifies runtime failures (MISSING_FIELDS, API_FAILURE, AUTH_EXPIRED, RATE_LIMIT, TRANSIENT)
 * and determines strategic decision: retry_with_backoff vs escalate.
 */
class RecoveryAgent {
  constructor() {
    this.name = 'recovery';
    this.maxRetries = 3;
    this.baseBackoffMs = 1000;
  }

  classifyFailure(error, validationResult) {
    if (validationResult && !validationResult.isValid && validationResult.errors?.length > 0) {
      return 'MISSING_FIELDS';
    }

    if (!error) return 'UNKNOWN_ERROR';

    const code = (error.code || '').toUpperCase();
    const msg = (error.message || '').toLowerCase();

    if (code === 'MISSING_FIELDS' || msg.includes('missing required') || msg.includes('missing_fields')) {
      return 'MISSING_FIELDS';
    }

    if (code === 'AUTH_EXPIRED' || code === 'INTEGRATION_NOT_CONNECTED' || msg.includes('auth_expired') || msg.includes('integration_not_connected') || msg.includes('unauthorized') || msg.includes('invalid_auth')) {
      return 'AUTH_EXPIRED';
    }

    if (code === 'RATE_LIMIT' || msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')) {
      return 'RATE_LIMIT';
    }

    if (msg.includes('timeout') || msg.includes('econnreset') || msg.includes('etimedout') || msg.includes('network error') || msg.includes('temporary') || msg.includes('503') || msg.includes('502')) {
      return 'TRANSIENT';
    }

    if (code === 'API_FAILURE' || msg.includes('api_failure')) {
      return 'API_FAILURE';
    }

    return 'API_FAILURE';
  }

  evaluate(error, validationResult, currentRetryCount = 0) {
    const startTime = Date.now();
    const classification = this.classifyFailure(error, validationResult);

    let decision = 'escalate';
    let backoffMs = 0;
    let suggestedFix = '';

    switch (classification) {
      case 'TRANSIENT':
      case 'RATE_LIMIT':
        if (currentRetryCount < this.maxRetries) {
          decision = 'retry_with_backoff';
          backoffMs = this.baseBackoffMs * Math.pow(2, currentRetryCount) + Math.floor(Math.random() * 500);
          suggestedFix = `Transient network/rate-limit error detected. Applying exponential backoff of ${backoffMs}ms before retry ${currentRetryCount + 1}/${this.maxRetries}.`;
        } else {
          decision = 'escalate';
          suggestedFix = `Maximum retry attempts (${this.maxRetries}) exceeded. Escalating to operator console.`;
        }
        break;

      case 'API_FAILURE':
        if (currentRetryCount < 1) {
          // Allow 1 single retry attempt on unexpected API glitches
          decision = 'retry_with_backoff';
          backoffMs = 2000;
          suggestedFix = 'Single retry scheduled for downstream provider failure.';
        } else {
          decision = 'escalate';
          suggestedFix = 'Downstream provider returned non-recoverable API error. Human operator review required.';
        }
        break;

      case 'AUTH_EXPIRED':
        decision = 'escalate';
        suggestedFix = 'Credentials expired or missing. Direct operator to /integrations page to re-authenticate OAuth or update credentials.';
        break;

      case 'MISSING_FIELDS':
        decision = 'escalate';
        suggestedFix = 'Validation contract violated. Review node input mappings and upstream data outputs.';
        break;

      default:
        decision = 'escalate';
        suggestedFix = 'Unclassified exception. Escalated to administrator.';
        break;
    }

    return {
      agent: this.name,
      classification,
      decision, // 'retry_with_backoff' | 'escalate'
      backoffMs,
      retryCount: currentRetryCount,
      suggestedFix,
      reason: error?.message || validationResult?.errors?.join(', ') || 'Unknown execution anomaly',
      durationMs: Date.now() - startTime,
    };
  }
}

module.exports = new RecoveryAgent();
