const axios = require('axios');
const BaseIntegration = require('./baseIntegration');
const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET } = require('../config/env');

class DiscordIntegration extends BaseIntegration {
  constructor() {
    super('discord');
  }

  getAuthUrl(state, redirectUri) {
    if (!DISCORD_CLIENT_ID) {
      throw new Error('DISCORD_CLIENT_ID is not configured in server environment');
    }
    const scopes = ['bot', 'identify', 'webhook.incoming'].join('%20');
    // permissions=2048 (Send Messages) + 32768 (Embed Links)
    return `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=34816&scope=${scopes}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&state=${state || ''}`;
  }

  async handleOAuthCallback(code, redirectUri) {
    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      throw new Error('Discord OAuth credentials not configured on server');
    }
    const response = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token, expires_in, webhook, guild } = response.data;

    return {
      tokens: {
        accessToken: access_token,
        refreshToken: refresh_token,
        webhookUrl: webhook ? webhook.url : null,
      },
      scopes: ['bot', 'identify', 'webhook.incoming'],
      expiresAt: new Date(Date.now() + (expires_in || 604800) * 1000),
      authDetails: {
        guildName: guild ? guild.name : 'Discord Server',
        guildId: guild ? guild.id : null,
        channelId: webhook ? webhook.channel_id : null,
      },
    };
  }

  async testConnection(credentials) {
    if (!credentials || (!credentials.accessToken && !credentials.webhookUrl && !credentials.botToken)) {
      return { success: false, error: 'INTEGRATION_NOT_CONNECTED: No Discord credentials provided' };
    }
    try {
      if (credentials.webhookUrl) {
        // Ping webhook without content to verify existence or test with get
        const res = await axios.get(credentials.webhookUrl);
        return { success: true, webhook: res.data };
      }
      return { success: true, message: 'Valid Discord Bot / Webhook' };
    } catch (err) {
      return { success: false, error: err.message, code: 'API_FAILURE' };
    }
  }

  async executeAction(action, params = {}, credentials = {}) {
    if (!credentials || (!credentials.webhookUrl && !credentials.botToken && !credentials.mock)) {
      const err = new Error('INTEGRATION_NOT_CONNECTED: Discord credentials missing or disconnected');
      err.code = 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    if (
      action === 'send_channel_message' ||
      action === 'send_webhook' ||
      action === 'post_bot_message'
    ) {
      const content = params.content || params.message || params.text;
      const embeds = params.embeds || (params.title ? [{
        title: params.title,
        description: content,
        color: params.color || 0x6366f1,
        timestamp: new Date().toISOString(),
      }] : undefined);

      if (!content && !embeds) {
        const err = new Error('MISSING_FIELDS: Discord action requires "content" or "embeds"');
        err.code = 'MISSING_FIELDS';
        throw err;
      }

      // Mock
      if (credentials.mock || (!credentials.webhookUrl && !credentials.botToken)) {
        return {
          status: 'success',
          action: 'send_webhook',
          content,
          id: `discord_msg_${Date.now()}`,
          timestamp: new Date().toISOString(),
          simulated: true,
        };
      }

      if (credentials.webhookUrl) {
        try {
          const res = await axios.post(credentials.webhookUrl, {
            content: embeds ? undefined : content,
            embeds,
            username: params.username || 'Agentflow AI Bot',
          });
          return {
            status: 'success',
            action: 'send_webhook',
            response: res.data || 'OK',
            timestamp: new Date().toISOString(),
          };
        } catch (err) {
          const apiErr = new Error(`API_FAILURE: Discord webhook error (${err.message})`);
          apiErr.code = 'API_FAILURE';
          throw apiErr;
        }
      }

      if (credentials.botToken && params.channelId) {
        try {
          const res = await axios.post(
            `https://discord.com/api/v10/channels/${params.channelId}/messages`,
            { content, embeds },
            { headers: { Authorization: `Bot ${credentials.botToken}` } }
          );
          return {
            status: 'success',
            action: 'send_channel_message',
            messageId: res.data.id,
            timestamp: new Date().toISOString(),
          };
        } catch (err) {
          if (err.response && err.response.status === 401) {
            const authErr = new Error('AUTH_EXPIRED: Discord bot token invalid');
            authErr.code = 'AUTH_EXPIRED';
            throw authErr;
          }
          const apiErr = new Error(`API_FAILURE: Discord bot post error (${err.message})`);
          apiErr.code = 'API_FAILURE';
          throw apiErr;
        }
      }
    }

    throw new Error(`Unsupported Discord action: ${action}`);
  }
}

module.exports = new DiscordIntegration();
