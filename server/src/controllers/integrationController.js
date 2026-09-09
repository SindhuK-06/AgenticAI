const integrationService = require('../services/integrationService');
const { CLIENT_URL } = require('../config/env');

class IntegrationController {
  async listIntegrations(req, res, next) {
    try {
      const integrations = await integrationService.getUserIntegrations(req.user.id);
      res.status(200).json({
        success: true,
        data: integrations,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStatus(req, res, next) {
    try {
      const status = await integrationService.getIntegrationStatus(req.user.id);
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (err) {
      next(err);
    }
  }

  async startOAuth(req, res, next) {
    try {
      const { provider } = req.params;
      const redirectUri = `${CLIENT_URL}/api/integrations/oauth/${provider}/callback`;
      const state = Buffer.from(JSON.stringify({ userId: req.user.id, provider })).toString('base64');
      const authUrl = await integrationService.getAuthUrl(provider, state, redirectUri);
      
      res.status(200).json({
        success: true,
        data: { authUrl },
      });
    } catch (err) {
      next(err);
    }
  }

  async handleOAuthCallback(req, res, next) {
    try {
      const { provider } = req.params;
      const { code, state } = req.query;

      if (!code) {
        return res.redirect(`${CLIENT_URL}/integrations?error=missing_oauth_code`);
      }

      let userId = req.user?.id;
      if (!userId && state) {
        try {
          const parsedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
          userId = parsedState.userId;
        } catch (e) {
          // ignore
        }
      }

      const redirectUri = `${CLIENT_URL}/api/integrations/oauth/${provider}/callback`;
      await integrationService.handleOAuthCallback(provider, code, redirectUri, userId);

      res.redirect(`${CLIENT_URL}/integrations?success=${provider}_connected`);
    } catch (err) {
      console.error('[IntegrationController] OAuth Callback Error:', err.message);
      res.redirect(`${CLIENT_URL}/integrations?error=${encodeURIComponent(err.message)}`);
    }
  }

  async oauthError(req, res, next) {
    res.status(400).json({
      success: false,
      error: req.query.message || 'OAuth authentication cancelled or encountered an error.',
    });
  }

  async saveManual(req, res, next) {
    try {
      const { provider, credentials, authDetails } = req.body;
      const result = await integrationService.saveManualCredentials(
        req.user.id,
        provider,
        credentials,
        authDetails
      );
      res.status(200).json({
        success: true,
        message: `${provider} credentials saved and encrypted securely at rest`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async testIntegration(req, res, next) {
    try {
      const { provider } = req.params;
      const result = await integrationService.testConnection(req.user.id, provider);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async disconnect(req, res, next) {
    try {
      const { provider } = req.params;
      const result = await integrationService.disconnect(req.user.id, provider);
      res.status(200).json({
        success: true,
        message: `${provider} disconnected successfully`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new IntegrationController();
