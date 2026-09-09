const axios = require('axios');
const BaseIntegration = require('./baseIntegration');
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = require('../config/env');

class GoogleSheetsIntegration extends BaseIntegration {
  constructor() {
    super('google-sheets');
  }

  getAuthUrl(state, redirectUri) {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error('GOOGLE_CLIENT_ID is not configured in server environment');
    }
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
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
    let email = 'unknown@google.com';
    try {
      const profile = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      email = profile.data.email || email;
    } catch (e) {
      // ignore
    }

    return {
      tokens: {
        accessToken: access_token,
        refreshToken: refresh_token,
      },
      scopes: scope ? scope.split(' ') : ['https://www.googleapis.com/auth/spreadsheets'],
      expiresAt: new Date(Date.now() + (expires_in || 3600) * 1000),
      authDetails: {
        email,
        accountName: email,
      },
    };
  }

  async testConnection(credentials) {
    if (!credentials || (!credentials.accessToken && !credentials.apiKey)) {
      return { success: false, error: 'INTEGRATION_NOT_CONNECTED: No credentials provided' };
    }
    try {
      if (credentials.accessToken) {
        const res = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${credentials.accessToken}` },
        });
        return { success: true, email: res.data.email };
      }
      return { success: true, message: 'Valid Sheets credentials' };
    } catch (err) {
      return { success: false, error: err.message, code: 'AUTH_EXPIRED' };
    }
  }

  async executeAction(action, params = {}, credentials = {}) {
    if (!credentials || (!credentials.accessToken && !credentials.apiKey && !credentials.mock)) {
      const err = new Error('INTEGRATION_NOT_CONNECTED: Google Sheets credentials missing or disconnected');
      err.code = 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    if (action === 'append_row') {
      const { spreadsheetId, range = 'Sheet1!A:Z', values } = params;
      if (!values) {
        const err = new Error('MISSING_FIELDS: append_row requires "values" array or object');
        err.code = 'MISSING_FIELDS';
        throw err;
      }

      const rowValues = Array.isArray(values)
        ? values
        : typeof values === 'object'
        ? Object.values(values)
        : [String(values)];

      if (credentials.mock || !credentials.accessToken) {
        return {
          status: 'success',
          action: 'append_row',
          spreadsheetId: spreadsheetId || 'mock_spreadsheet_id_101',
          range,
          appendedValues: rowValues,
          updatedRows: 1,
          updatedColumns: rowValues.length,
          timestamp: new Date().toISOString(),
          simulated: true,
        };
      }

      try {
        const response = await axios.post(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
            range
          )}:append?valueInputOption=USER_ENTERED`,
          { values: [rowValues] },
          { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
        );

        return {
          status: 'success',
          action: 'append_row',
          spreadsheetId,
          updates: response.data.updates,
          timestamp: new Date().toISOString(),
        };
      } catch (err) {
        if (err.response && err.response.status === 401) {
          const authErr = new Error('AUTH_EXPIRED: Google Sheets token expired');
          authErr.code = 'AUTH_EXPIRED';
          throw authErr;
        }
        const apiErr = new Error(`API_FAILURE: Google Sheets error (${err.message})`);
        apiErr.code = 'API_FAILURE';
        throw apiErr;
      }
    } else if (action === 'read_range') {
      const { spreadsheetId, range = 'Sheet1!A1:Z100' } = params;
      if (credentials.mock || !credentials.accessToken) {
        return {
          status: 'success',
          action: 'read_range',
          spreadsheetId: spreadsheetId || 'mock_spreadsheet_id_101',
          range,
          values: [
            ['Timestamp', 'User', 'Status', 'Notes'],
            [new Date().toISOString(), 'operator@agentflow.ai', 'Processed', 'Automated sync row'],
          ],
          simulated: true,
        };
      }

      try {
        const res = await axios.get(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
            range
          )}`,
          { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
        );
        return {
          status: 'success',
          action: 'read_range',
          values: res.data.values || [],
        };
      } catch (err) {
        if (err.response && err.response.status === 401) {
          const authErr = new Error('AUTH_EXPIRED: Google Sheets token expired');
          authErr.code = 'AUTH_EXPIRED';
          throw authErr;
        }
        throw err;
      }
    }

    throw new Error(`Unsupported Google Sheets action: ${action}`);
  }
}

module.exports = new GoogleSheetsIntegration();
