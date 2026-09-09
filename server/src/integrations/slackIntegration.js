const axios = require('axios');
const BaseIntegration = require('./baseIntegration');
const { SLACK_CLIENT_ID, SLACK_CLIENT_SECRET } = require('../config/env');

class SlackIntegration extends BaseIntegration {
  constructor() {
    super('slack');
  }

  getAuthUrl(state, redirectUri) {
    if (!SLACK_CLIENT_ID) {
      throw new Error('SLACK_CLIENT_ID is not configured in server environment');
    }
    const scopes = ['chat:write', 'channels:read', 'incoming-webhook'].join(',');
    const params = new URLSearchParams({
      client_id: SLACK_CLIENT_ID,
      scope: scopes,
      redirect_uri: redirectUri,
      state: state || '',
    });
    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  async handleOAuthCallback(code, redirectUri) {
    if (!SLACK_CLIENT_ID || !SLACK_CLIENT_SECRET) {
      throw new Error('Slack OAuth credentials not configured on server');
    }
    const response = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      new URLSearchParams({
        code,
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        redirect_uri: redirectUri,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (!response.data.ok) {
      throw new Error(`Slack OAuth error: ${response.data.error}`);
    }

    const { access_token, team, authed_user, incoming_webhook, scope } = response.data;

    return {
      tokens: {
        accessToken: access_token,
        webhookUrl: incoming_webhook ? incoming_webhook.url : null,
      },
      scopes: scope ? scope.split(',') : ['chat:write'],
      expiresAt: null,
      authDetails: {
        teamName: team ? team.name : 'Slack Team',
        teamId: team ? team.id : null,
        channel: incoming_webhook ? incoming_webhook.channel : '#general',
        userId: authed_user ? authed_user.id : null,
      },
    };
  }

  async testConnection(credentials) {
    if (!credentials || (!credentials.accessToken && !credentials.webhookUrl && !credentials.apiKey)) {
      return { success: false, error: 'INTEGRATION_NOT_CONNECTED: No Slack credentials provided' };
    }
    try {
      if (credentials.accessToken) {
        const testRes = await axios.post(
          'https://slack.com/api/auth.test',
          {},
          { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
        );
        if (testRes.data.ok) {
          return { success: true, team: testRes.data.team, user: testRes.data.user };
        }
        return { success: false, error: testRes.data.error, code: 'AUTH_EXPIRED' };
      }
      return { success: true, message: 'Valid Slack Webhook / Token' };
    } catch (err) {
      return { success: false, error: err.message, code: 'API_FAILURE' };
    }
  }

  async executeAction(action, params = {}, credentials = {}) {
    if (!credentials || (!credentials.accessToken && !credentials.webhookUrl && !credentials.mock)) {
      const err = new Error('INTEGRATION_NOT_CONNECTED: Slack credentials missing or disconnected');
      err.code = 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    if (action === 'send_message' || action === 'send_webhook' || action === 'post_notification') {
      const text = params.text || params.message;
      const channel = params.channel || '#general';
      const blocks = params.blocks;

      if (!text && !blocks) {
        const err = new Error('MISSING_FIELDS: Slack message requires "text" or "blocks"');
        err.code = 'MISSING_FIELDS';
        throw err;
      }

      // If mock/simulated
      if (credentials.mock || (!credentials.accessToken && !credentials.webhookUrl)) {
        return {
          status: 'success',
          action: 'send_message',
          channel,
          text,
          ts: `${Date.now() / 1000}`,
          timestamp: new Date().toISOString(),
          simulated: true,
        };
      }

      // If webhook url is provided
      if (credentials.webhookUrl) {
        try {
          const res = await axios.post(credentials.webhookUrl, {
            text,
            blocks,
            channel: channel !== '#general' ? channel : undefined,
          });
          return {
            status: 'success',
            action: 'send_webhook',
            channel,
            response: res.data,
            timestamp: new Date().toISOString(),
          };
        } catch (err) {
          const apiErr = new Error(`API_FAILURE: Slack webhook error (${err.message})`);
          apiErr.code = 'API_FAILURE';
          throw apiErr;
        }
      }

      // If Bot token
      try {
        const response = await axios.post(
          'https://slack.com/api/chat.postMessage',
          {
            channel,
            text,
            blocks,
          },
          { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
        );

        if (!response.data.ok) {
          if (response.data.error === 'invalid_auth' || response.data.error === 'token_expired') {
            const authErr = new Error(`AUTH_EXPIRED: Slack token error (${response.data.error})`);
            authErr.code = 'AUTH_EXPIRED';
            throw authErr;
          }
          const apiErr = new Error(`API_FAILURE: Slack API error (${response.data.error})`);
          apiErr.code = 'API_FAILURE';
          throw apiErr;
        }

        return {
          status: 'success',
          action: 'send_message',
          channel: response.data.channel,
          ts: response.data.ts,
          message: response.data.message,
          timestamp: new Date().toISOString(),
        };
      } catch (err) {
        if (err.code === 'AUTH_EXPIRED' || err.code === 'API_FAILURE') throw err;
        const apiErr = new Error(`API_FAILURE: Slack post error (${err.message})`);
        apiErr.code = 'API_FAILURE';
        throw apiErr;
      }
    }

    throw new Error(`Unsupported Slack action: ${action}`);
  }
}

module.exports = new SlackIntegration();
