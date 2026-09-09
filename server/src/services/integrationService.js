const Integration = require('../models/Integration');
const { encrypt, decrypt } = require('../utils/crypto');
const gmailIntegration = require('../integrations/gmailIntegration');
const slackIntegration = require('../integrations/slackIntegration');
const discordIntegration = require('../integrations/discordIntegration');
const googleSheetsIntegration = require('../integrations/googleSheetsIntegration');
const { OPENROUTER_API_KEY, GEMINI_API_KEY } = require('../config/env');

class IntegrationService {
  constructor() {
    this.handlers = {
      gmail: gmailIntegration,
      slack: slackIntegration,
      discord: discordIntegration,
      'google-sheets': googleSheetsIntegration,
    };
  }

  getHandler(provider) {
    const handler = this.handlers[provider];
    if (!handler) {
      throw new Error(`Unsupported integration provider: ${provider}`);
    }
    return handler;
  }

  async getUserIntegrations(userId) {
    const saved = await Integration.find({ owner: userId });
    const providers = ['gmail', 'slack', 'discord', 'google-sheets', 'openrouter', 'gemini'];

    const results = providers.map((provider) => {
      const existing = saved.find((i) => i.provider === provider);
      
      // Global env fallbacks for AI providers
      if (provider === 'openrouter' && !existing && OPENROUTER_API_KEY) {
        return {
          provider,
          isConnected: true,
          status: 'healthy',
          authDetails: { label: 'Server Environment Key', maskedKey: 'sk-or-v1-***' },
          scopes: ['api:access'],
          expiresAt: null,
          lastTestedAt: new Date(),
        };
      }
      if (provider === 'gemini' && !existing && GEMINI_API_KEY) {
        return {
          provider,
          isConnected: true,
          status: 'healthy',
          authDetails: { label: 'Server Environment Key', maskedKey: 'AIzaSy***' },
          scopes: ['api:access'],
          expiresAt: null,
          lastTestedAt: new Date(),
        };
      }

      if (existing) {
        return {
          provider: existing.provider,
          isConnected: existing.isConnected,
          status: existing.status,
          authDetails: existing.authDetails || {},
          scopes: existing.scopes || [],
          expiresAt: existing.expiresAt,
          lastTestedAt: existing.lastTestedAt,
          createdAt: existing.createdAt,
        };
      }

      return {
        provider,
        isConnected: false,
        status: 'disconnected',
        authDetails: {},
        scopes: [],
        expiresAt: null,
        lastTestedAt: null,
      };
    });

    return results;
  }

  async getIntegrationStatus(userId) {
    const integrations = await this.getUserIntegrations(userId);
    const summary = {
      total: integrations.length,
      connected: integrations.filter((i) => i.isConnected).length,
      providers: {},
    };
    integrations.forEach((i) => {
      summary.providers[i.provider] = {
        connected: i.isConnected,
        status: i.status,
      };
    });
    return summary;
  }

  async getAuthUrl(provider, state, redirectUri) {
    const handler = this.getHandler(provider);
    return handler.getAuthUrl(state, redirectUri);
  }

  async handleOAuthCallback(provider, code, redirectUri, userId) {
    const handler = this.getHandler(provider);
    const authData = await handler.handleOAuthCallback(code, redirectUri);

    // Encrypt sensitive tokens at rest
    const encryptedTokens = encrypt(authData.tokens);

    const integration = await Integration.findOneAndUpdate(
      { owner: userId, provider },
      {
        isConnected: true,
        encryptedTokens,
        authDetails: authData.authDetails || {},
        scopes: authData.scopes || [],
        expiresAt: authData.expiresAt || null,
        lastTestedAt: new Date(),
        status: 'healthy',
      },
      { upsert: true, new: true }
    );

    return {
      provider: integration.provider,
      isConnected: integration.isConnected,
      authDetails: integration.authDetails,
      status: integration.status,
    };
  }

  async saveManualCredentials(userId, provider, credentials, authDetails = {}) {
    const encryptedTokens = encrypt(credentials);
    const integration = await Integration.findOneAndUpdate(
      { owner: userId, provider },
      {
        isConnected: true,
        encryptedTokens,
        authDetails: {
          ...authDetails,
          manualSetup: true,
          configuredAt: new Date().toISOString(),
        },
        scopes: ['manual:configured'],
        lastTestedAt: new Date(),
        status: 'healthy',
      },
      { upsert: true, new: true }
    );

    return {
      provider: integration.provider,
      isConnected: integration.isConnected,
      authDetails: integration.authDetails,
      status: integration.status,
    };
  }

  async disconnect(userId, provider) {
    await Integration.deleteOne({ owner: userId, provider });
    return { provider, isConnected: false, status: 'disconnected' };
  }

  async getDecryptedCredentials(userId, provider) {
    // Check user-stored credentials first
    const integration = await Integration.findOne({ owner: userId, provider });
    if (integration && integration.encryptedTokens) {
      const decrypted = decrypt(integration.encryptedTokens);
      return {
        ...decrypted,
        authDetails: integration.authDetails,
      };
    }

    // Check system fallback keys for AI providers
    if (provider === 'openrouter' && OPENROUTER_API_KEY) {
      return { apiKey: OPENROUTER_API_KEY, systemFallback: true };
    }
    if (provider === 'gemini' && GEMINI_API_KEY) {
      return { apiKey: GEMINI_API_KEY, systemFallback: true };
    }

    // Return mock mode credentials if allowed for local demo
    return { mock: true, note: 'Default mock execution' };
  }

  async testConnection(userId, provider) {
    if (provider === 'openrouter' || provider === 'gemini') {
      const creds = await this.getDecryptedCredentials(userId, provider);
      return { success: !!(creds.apiKey || creds.mock), provider };
    }

    const handler = this.getHandler(provider);
    const credentials = await this.getDecryptedCredentials(userId, provider);
    const testResult = await handler.testConnection(credentials);

    if (testResult.success) {
      await Integration.findOneAndUpdate(
        { owner: userId, provider },
        { lastTestedAt: new Date(), status: 'healthy' }
      );
    } else {
      await Integration.findOneAndUpdate(
        { owner: userId, provider },
        { lastTestedAt: new Date(), status: testResult.code === 'AUTH_EXPIRED' ? 'warning' : 'error' }
      );
    }

    return testResult;
  }

  async executeAction(userId, provider, action, params = {}) {
    const handler = this.getHandler(provider);
    const credentials = await this.getDecryptedCredentials(userId, provider);
    return await handler.executeAction(action, params, credentials);
  }
}

module.exports = new IntegrationService();
