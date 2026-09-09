import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { X, Trash2, Sliders, CheckCircle2, Sparkles, HelpCircle } from 'lucide-react';

export default function NodeConfigPanel() {
  const { selectedNode, selectNode, updateNodeData, deleteNode } = useWorkflowStore();

  const [label, setLabel] = useState('');
  const [provider, setProvider] = useState('');
  const [action, setAction] = useState('');
  const [params, setParams] = useState({});
  const [rawJson, setRawJson] = useState('');
  const [tab, setTab] = useState('form'); // 'form' | 'json'

  useEffect(() => {
    if (selectedNode) {
      const data = selectedNode.data || {};
      const config = data.config || {};
      setLabel(data.label || selectedNode.id);
      setProvider(config.provider || '');
      setAction(config.action || '');
      setParams(config.params || {});
      setRawJson(JSON.stringify(config.params || {}, null, 2));
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="w-80 h-full bg-surface border-l border-slate-800/80 p-6 flex flex-col items-center justify-center text-center">
        <Sliders className="w-8 h-8 text-slate-400 mb-3" />
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">No Node Selected</h4>
        <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
          Click any node on the canvas to configure its AI prompts, parameters, and credentials.
        </p>
      </div>
    );
  }

  const handleLabelChange = (newLabel) => {
    setLabel(newLabel);
    updateNodeData(selectedNode.id, { label: newLabel });
  };

  const handleParamChange = (key, value) => {
    const updated = { ...params, [key]: value };
    setParams(updated);
    setRawJson(JSON.stringify(updated, null, 2));
    updateNodeData(selectedNode.id, {
      config: {
        ...(selectedNode.data?.config || {}),
        provider,
        action,
        params: updated,
      },
    });
  };

  const handleJsonChange = (val) => {
    setRawJson(val);
    try {
      const parsed = JSON.parse(val);
      setParams(parsed);
      updateNodeData(selectedNode.id, {
        config: {
          ...(selectedNode.data?.config || {}),
          provider,
          action,
          params: parsed,
        },
      });
    } catch (e) {
      // ignore JSON parse error while typing
    }
  };

  const insertVariable = (varName) => {
    const templateVar = `{{${varName}}}`;
    if (provider === 'gmail') {
      handleParamChange('body', (params.body || '') + ' ' + templateVar);
    } else if (provider === 'slack') {
      handleParamChange('text', (params.text || '') + ' ' + templateVar);
    } else if (provider === 'discord') {
      handleParamChange('content', (params.content || '') + ' ' + templateVar);
    } else {
      handleParamChange('prompt', (params.prompt || '') + ' ' + templateVar);
    }
  };

  const sampleVariables = ['invoice_number', 'vendor', 'amount', 'due_date', 'ticket_id', 'customer_email', 'severity'];

  return (
    <div className="w-84 md:w-96 h-full bg-surface border-l border-slate-800/80 flex flex-col z-20 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-surface-elevated/40">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Node Inspector</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => deleteNode(selectedNode.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            title="Delete Node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => selectNode(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Node Info & Label */}
      <div className="p-4 border-b border-slate-800 space-y-3 bg-surface/50">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            Node Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full bg-surface-elevated border border-slate-700/80 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Type: <strong className="text-slate-300">{selectedNode.type}</strong></span>
          <span>ID: <strong className="text-indigo-400">{selectedNode.id}</strong></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-surface-elevated/20 text-xs">
        <button
          onClick={() => setTab('form')}
          className={`flex-1 py-2 font-medium transition-colors ${
            tab === 'form'
              ? 'text-indigo-400 border-b-2 border-indigo-500 bg-surface'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Form Config
        </button>
        <button
          onClick={() => setTab('json')}
          className={`flex-1 py-2 font-medium transition-colors ${
            tab === 'json'
              ? 'text-indigo-400 border-b-2 border-indigo-500 bg-surface'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Raw JSON
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Dynamic Context Variables Pill Helper */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
            Available Pipeline Variables
          </label>
          <div className="flex flex-wrap gap-1.5">
            {sampleVariables.map((v) => (
              <button
                key={v}
                onClick={() => insertVariable(v)}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/20 transition-colors"
                title={`Click to insert {{${v}}}`}
              >
                + {v}
              </button>
            ))}
          </div>
        </div>

        {tab === 'form' ? (
          <div className="space-y-3.5">
            {/* GMAIL FORM */}
            {provider === 'gmail' && (
              <>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Recipient (To)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. operator@company.com or {{customer_email}}"
                    value={params.to || ''}
                    onChange={(e) => handleParamChange('to', e.target.value)}
                    className="w-full bg-surface-elevated border border-slate-700/80 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Invoice Approval for {{vendor}}"
                    value={params.subject || ''}
                    onChange={(e) => handleParamChange('subject', e.target.value)}
                    className="w-full bg-surface-elevated border border-slate-700/80 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Email Body Content
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter email content..."
                    value={params.body || ''}
                    onChange={(e) => handleParamChange('body', e.target.value)}
                    className="w-full bg-surface-elevated border border-slate-700/80 rounded-md p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </>
            )}

            {/* SLACK FORM */}
            {provider === 'slack' && (
              <>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Slack Channel
                  </label>
                  <input
                    type="text"
                    placeholder="#general or #ops-alerts"
                    value={params.channel || '#general'}
                    onChange={(e) => handleParamChange('channel', e.target.value)}
                    className="w-full bg-surface-elevated border border-slate-700/80 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Message Text
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter Slack markdown message..."
                    value={params.text || ''}
                    onChange={(e) => handleParamChange('text', e.target.value)}
                    className="w-full bg-surface-elevated border border-slate-700/80 rounded-md p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </>
            )}

            {/* DISCORD FORM */}
            {provider === 'discord' && (
              <>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Embed Title / Header
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 🚨 Urgent Incident: {{service}}"
                    value={params.title || ''}
                    onChange={(e) => handleParamChange('title', e.target.value)}
                    className="w-full bg-surface-elevated border border-slate-700/80 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Message Content
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter Discord content..."
                    value={params.content || ''}
                    onChange={(e) => handleParamChange('content', e.target.value)}
                    className="w-full bg-surface-elevated border border-slate-700/80 rounded-md p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </>
            )}

            {/* GOOGLE SHEETS FORM */}
            {provider === 'google-sheets' && (
              <>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Spreadsheet ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    value={params.spreadsheetId || ''}
                    onChange={(e) => handleParamChange('spreadsheetId', e.target.value)}
                    className="w-full bg-surface-elevated border border-slate-700/80 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Range (Sheet & Cells)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Invoices!A:F"
                    value={params.range || 'Sheet1!A:Z'}
                    onChange={(e) => handleParamChange('range', e.target.value)}
                    className="w-full bg-surface-elevated border border-slate-700/80 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </>
            )}

            {/* AI AGENT FORM */}
            {selectedNode.type === 'agentNode' || selectedNode.type === 'agent' ? (
              <>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Agent Instruction / System Prompt
                  </label>
                  <textarea
                    rows={5}
                    placeholder="e.g. Analyze incoming customer feedback, extract sentiment score and categorize urgency..."
                    value={params.prompt || params.instruction || ''}
                    onChange={(e) => handleParamChange('prompt', e.target.value)}
                    className="w-full bg-surface-elevated border border-slate-700/80 rounded-md p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </>
            ) : null}

            {/* GENERIC ACTION / PARAMS IF NOT MATCHED */}
            {!['gmail', 'slack', 'discord', 'google-sheets'].includes(provider) &&
              selectedNode.type !== 'agentNode' &&
              selectedNode.type !== 'agent' && (
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Action Configuration
                  </label>
                  <textarea
                    rows={6}
                    value={rawJson}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    className="w-full bg-surface-elevated border border-slate-700/80 rounded-md p-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
          </div>
        ) : (
          <div>
            <textarea
              rows={14}
              value={rawJson}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="w-full bg-surface-elevated border border-slate-700/80 rounded-md p-3 text-xs text-emerald-400 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-surface-elevated/40 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-1.5 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="text-[11px] font-mono">Auto-saved to Canvas</span>
        </div>
      </div>
    </div>
  );
}
