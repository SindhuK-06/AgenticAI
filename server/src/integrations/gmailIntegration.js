const axios = require('axios');
const BaseIntegration = require('./baseIntegration');
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = require('../config/env');

class GmailIntegration extends BaseIntegration {
  constructor() {
    super('gmail');
  }

  getAuthUrl(state, redirectUri) {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error('GOOGLE_CLIENT_ID is not configured in server environment');
    }
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent',
      state: state || '',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleOAuthCallback(code, redirectUri) {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured on server');
    }
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token, expires_in, scope } = response.data;
    
    // Fetch user profile email
    let userEmail = 'unknown@gmail.com';
    try {
      const profile = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      userEmail = profile.data.email || userEmail;
    } catch (e) {
      console.warn('[GmailIntegration] Could not fetch user profile:', e.message);
    }

    return {
      tokens: {
        accessToken: access_token,
        refreshToken: refresh_token,
      },
      scopes: scope ? scope.split(' ') : ['https://www.googleapis.com/auth/gmail.send'],
      expiresAt: new Date(Date.now() + (expires_in || 3600) * 1000),
      authDetails: {
        email: userEmail,
        accountName: userEmail,
      },
    };
  }

  async testConnection(credentials) {
    if (!credentials || (!credentials.accessToken && !credentials.apiKey)) {
      return { success: false, error: 'INTEGRATION_NOT_CONNECTED: No credentials provided' };
    }
    try {
      if (credentials.accessToken) {
        const profile = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${credentials.accessToken}` },
        });
        return { success: true, user: profile.data };
      }
      return { success: true, message: 'Valid API Key / Mock credentials' };
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        return { success: false, error: 'AUTH_EXPIRED: Token expired or invalid', code: 'AUTH_EXPIRED' };
      }
      return { success: false, error: err.message, code: 'API_FAILURE' };
    }
  }

  async executeAction(action, params = {}, credentials = {}) {
    if (!credentials || (!credentials.accessToken && !credentials.apiKey && !credentials.mock)) {
      const err = new Error('INTEGRATION_NOT_CONNECTED: Gmail credentials missing or disconnected');
      err.code = 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    if (action === 'send_email') {
      const { to, subject, body, cc, bcc } = params;
      if (!to || !subject) {
        const err = new Error('MISSING_FIELDS: Gmail send_email requires "to" and "subject"');
        err.code = 'MISSING_FIELDS';
        throw err;
      }

      // If simulated or mock credentials
      if (credentials.mock || !credentials.accessToken) {
        return {
          status: 'success',
          action: 'send_email',
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          to,
          subject,
          bodySnippet: body ? body.substring(0, 100) : '',
          timestamp: new Date().toISOString(),
          simulated: true,
        };
      }

      // Real Gmail API call
      try {
        const rawMessage = [
          `To: ${to}`,
          cc ? `Cc: ${cc}` : '',
          bcc ? `Bcc: ${bcc}` : '',
          `Subject: ${subject}`,
          'Content-Type: text/html; charset=utf-8',
          '',
          body || '',
        ].filter(Boolean).join('\r\n');

        const encodedMessage = Buffer.from(rawMessage)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        const response = await axios.post(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
          { raw: encodedMessage },
          { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
        );

        return {
          status: 'success',
          action: 'send_email',
          messageId: response.data.id,
          threadId: response.data.threadId,
          to,
          subject,
          timestamp: new Date().toISOString(),
        };
      } catch (err) {
        if (err.response && err.response.status === 401) {
          const authErr = new Error('AUTH_EXPIRED: Gmail access token expired');
          authErr.code = 'AUTH_EXPIRED';
          throw authErr;
        }
        const apiErr = new Error(`API_FAILURE: Gmail send error (${err.message})`);
        apiErr.code = 'API_FAILURE';
        throw apiErr;
      }
    } else if (action === 'read_emails') {
      const { query = 'is:unread', maxResults = 5 } = params;
      if (credentials.mock || !credentials.accessToken) {
        return {
          status: 'success',
          action: 'read_emails',
          messages: [
            { id: 'mock_msg_1', from: 'alerts@ops.agentflow.ai', subject: 'High priority incident 104', snippet: 'Database cluster high load...' },
            { id: 'mock_msg_2', from: 'billing@client.com', subject: 'Invoice INV-2026-08', snippet: 'Please find attached invoice for review...' },
          ],
          total: 2,
          simulated: true,
        };
      }

      try {
        const listRes = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
          headers: { Authorization: `Bearer ${credentials.accessToken}` },
          params: { q: query, maxResults },
        });

        return {
          status: 'success',
          action: 'read_emails',
          messages: listRes.data.messages || [],
          resultSizeEstimate: listRes.data.resultSizeEstimate || 0,
        };
      } catch (err) {
        if (err.response && err.response.status === 401) {
          const authErr = new Error('AUTH_EXPIRED: Gmail access token expired');
          authErr.code = 'AUTH_EXPIRED';
          throw authErr;
        }
        throw err;
      }
    }

    throw new Error(`Unsupported Gmail action: ${action}`);
  }
}

module.exports = new GmailIntegration();
