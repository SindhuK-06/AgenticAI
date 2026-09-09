import React, { useState, useEffect } from 'react';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import api from '../services/api';
import {
  KeyRound,
  Mail,
  MessageSquare,
  MessageCircle,
  Table,
  Bot,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Unlink,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalProvider, setModalProvider] = useState(null);
  const [manualCreds, setManualCreds] = useState({});
  const [testingProvider, setTestingProvider] = useState(null);
  const [savingManual, setSavingManual] = useState(false);

  const fetchIntegrations = async () => {
    try {
      const res = await api.get('/integrations');
      setIntegrations(res.data || []);
    } catch (e) {
      console.error('Failed to load integrations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleTest = async (provider) => {
    setTestingProvider(provider);
    try {
      const res = await api.post(`/integrations/${provider}/test`);
      if (res.data?.success) {
        alert(`✅ ${provider.toUpperCase()} connection test successful!`);
      } else {
        alert(`❌ ${provider.toUpperCase()} test failed: ${res.data?.error || 'Unknown error'}`);
      }
      await fetchIntegrations();
    } catch (err) {
      alert(`Test error: ${err.message}`);
    } finally {
      setTestingProvider(null);
    }
  };

  const handleDisconnect = async (provider) => {
    if (!confirm(`Disconnect ${provider}? Existing workflows using this integration may pause.`)) return;
    try {
      await api.delete(`/integrations/${provider}`);
      await fetchIntegrations();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOAuthConnect = async (provider) => {
    try {
      const res = await api.get(`/integrations/oauth/${provider}/start`);
      if (res.data?.authUrl) {
        window.location.href = res.data.authUrl;
      }
    } catch (err) {
      alert(`OAuth Error: ${err.message}. You can configure manual credentials using the Setup modal.`);
      setModalProvider(provider);
    }
  };

  const handleSaveManual = async (e) => {
    e.preventDefault();
    setSavingManual(true);
    try {
      await api.post('/integrations', {
        provider: modalProvider,
        credentials: manualCreds,
        authDetails: {
          label: `${modalProvider.toUpperCase()} Custom Token`,
          channel: manualCreds.channel || '#general',
          email: manualCreds.email || 'operator@company.com',
        },
      });
      setModalProvider(null);
      setManualCreds({});
      await fetchIntegrations();
      alert(`✅ ${modalProvider.toUpperCase()} credentials encrypted and connected successfully.`);
    } catch (err) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSavingManual(false);
    }
  };

  const getProviderInfo = (provider) => {
    switch (provider) {
      case 'gmail':
        return {
          name: 'Gmail',
          desc: 'Automated email dispatch, inbox reader, and customer triage',
          icon: Mail,
          color: 'text-red-400',
          bg: 'bg-red-950/20',
          border: 'border-red-500/30',
        };
      case 'slack':
        return {
          name: 'Slack',
          desc: 'Channel notifications, bot alerts, and workflow triggers',
          icon: MessageSquare,
          color: 'text-amber-400',
          bg: 'bg-amber-950/20',
          border: 'border-amber-500/30',
        };
      case 'discord':
        return {
          name: 'Discord',
          desc: 'War-room alerts, channel broadcasts, and bot interactions',
          icon: MessageCircle,
          color: 'text-indigo-400',
          bg: 'bg-indigo-950/20',
          border: 'border-indigo-500/30',
        };
      case 'google-sheets':
        return {
          name: 'Google Sheets',
          desc: 'Spreadsheet ledger sync, row appending, and analytics reads',
          icon: Table,
          color: 'text-emerald-400',
          bg: 'bg-emerald-950/20',
          border: 'border-emerald-500/30',
        };
      case 'openrouter':
        return {
          name: 'OpenRouter AI',
          desc: 'Llama 3.3, Claude 3.5, and DeepSeek model access',
          icon: Bot,
          color: 'text-purple-400',
          bg: 'bg-purple-950/20',
          border: 'border-purple-500/30',
        };
      case 'gemini':
      default:
        return {
          name: 'Google Gemini AI',
          desc: 'Gemini 1.5 Pro and Flash multimodal intelligence',
          icon: Bot,
          color: 'text-sky-400',
          bg: 'bg-sky-950/20',
          border: 'border-sky-500/30',
        };
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title="Integrations & OAuth">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Connected Tools & OAuth Credentials
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                All tokens are encrypted at rest with AES-256 using an application-level key.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>AES-256 Encryption Active</span>
            </div>
          </div>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {integrations.map((item) => {
              const info = getProviderInfo(item.provider);
              const Icon = info.icon;
              const isConnected = item.isConnected;

              return (
                <div
                  key={item.provider}
                  className={`glass-panel p-5 rounded-2xl border ${
                    isConnected ? 'border-emerald-500/40' : 'border-slate-800'
                  } flex flex-col justify-between transition-all`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl ${info.bg} border ${info.border} ${info.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {isConnected ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>CONNECTED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          <span>DISCONNECTED</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white mt-4">{info.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{info.desc}</p>

                    {isConnected && (
                      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1 text-[11px] font-mono text-slate-400">
                        {item.authDetails?.accountName && (
                          <p>Account: <strong className="text-slate-200">{item.authDetails.accountName}</strong></p>
                        )}
                        {item.authDetails?.channel && (
                          <p>Target: <strong className="text-slate-200">{item.authDetails.channel}</strong></p>
                        )}
                        {item.lastTestedAt && (
                          <p>Tested: <strong className="text-slate-300">{new Date(item.lastTestedAt).toLocaleDateString()}</strong></p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {isConnected ? (
                      <>
                        <button
                          onClick={() => handleTest(item.provider)}
                          disabled={testingProvider === item.provider}
                          className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-highlight text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition-colors"
                        >
                          {testingProvider === item.provider ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                          <span>Test</span>
                        </button>
                        <button
                          onClick={() => handleDisconnect(item.provider)}
                          className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-950 text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center space-x-1 transition-colors"
                        >
                          <Unlink className="w-3 h-3" />
                          <span>Disconnect</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOAuthConnect(item.provider)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-1 shadow-md shadow-indigo-600/20"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Connect OAuth</span>
                        </button>
                        <button
                          onClick={() => setModalProvider(item.provider)}
                          className="py-1.5 px-2.5 rounded-lg bg-surface-elevated hover:bg-surface-highlight border border-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                          title="Manual API Key / Webhook Config"
                        >
                          Manual
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Manual Credential Configuration Modal */}
          {modalProvider && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-100">
              <div className="w-full max-w-md bg-surface-elevated border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <div className="flex items-center space-x-2">
                    <KeyRound className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                      Configure {modalProvider.toUpperCase()} Credentials
                    </h3>
                  </div>
                  <button
                    onClick={() => setModalProvider(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  Credentials provided here are encrypted at rest using AES-256 and will never be logged or exposed.
                </p>

                <form onSubmit={handleSaveManual} className="space-y-3.5">
                  {modalProvider === 'slack' && (
                    <>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-300 mb-1">
                          Incoming Webhook URL
                        </label>
                        <input
                          type="url"
                          required
                          placeholder="https://hooks.slack.com/services/..."
                          value={manualCreds.webhookUrl || ''}
                          onChange={(e) => setManualCreds({ ...manualCreds, webhookUrl: e.target.value })}
                          className="w-full bg-surface border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-300 mb-1">
                          Default Channel
                        </label>
                        <input
                          type="text"
                          placeholder="#operations"
                          value={manualCreds.channel || ''}
                          onChange={(e) => setManualCreds({ ...manualCreds, channel: e.target.value })}
                          className="w-full bg-surface border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </>
                  )}

                  {modalProvider === 'discord' && (
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-300 mb-1">
                        Discord Webhook URL
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://discord.com/api/webhooks/..."
                        value={manualCreds.webhookUrl || ''}
                        onChange={(e) => setManualCreds({ ...manualCreds, webhookUrl: e.target.value })}
                        className="w-full bg-surface border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {(modalProvider === 'gmail' || modalProvider === 'google-sheets') && (
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-300 mb-1">
                        Google Access Token / API Key
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ya29.a0AfH6..."
                        value={manualCreds.accessToken || ''}
                        onChange={(e) => setManualCreds({ ...manualCreds, accessToken: e.target.value })}
                        className="w-full bg-surface border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {(modalProvider === 'openrouter' || modalProvider === 'gemini') && (
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-300 mb-1">
                        API Secret Key
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="sk-or-v1-..."
                        value={manualCreds.apiKey || ''}
                        onChange={(e) => setManualCreds({ ...manualCreds, apiKey: e.target.value })}
                        className="w-full bg-surface border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setModalProvider(null)}
                      className="px-3.5 py-2 rounded-lg bg-surface hover:bg-surface-highlight text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingManual}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
                    >
                      {savingManual ? 'Encrypting & Saving...' : 'Save & Encrypt'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
