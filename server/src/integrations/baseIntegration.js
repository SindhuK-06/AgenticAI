/**
 * Base Integration Abstract Class
 * All third-party integrations must inherit from BaseIntegration
 */
class BaseIntegration {
  constructor(provider) {
    if (this.constructor === BaseIntegration) {
      throw new Error('BaseIntegration is an abstract class and cannot be instantiated directly.');
    }
    this.provider = provider;
  }

  /**
   * Generates OAuth authorization URL
   */
  getAuthUrl(state, redirectUri) {
    throw new Error(`getAuthUrl() not implemented for ${this.provider}`);
  }

  /**
   * Exchanges OAuth code for access & refresh tokens
   */
  async handleOAuthCallback(code, redirectUri) {
    throw new Error(`handleOAuthCallback() not implemented for ${this.provider}`);
  }

  /**
   * Tests whether stored credentials are valid
   */
  async testConnection(credentials) {
    throw new Error(`testConnection() not implemented for ${this.provider}`);
  }

  /**
   * Executes a specific tool action against the provider
   */
  async executeAction(action, params, credentials) {
    throw new Error(`executeAction() not implemented for ${this.provider}`);
  }
}

module.exports = BaseIntegration;
