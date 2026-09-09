import React, { useState } from 'react';
import {
  Zap,
  Globe,
  Clock,
  Bot,
  Filter,
  FileText,
  Mail,
  MessageSquare,
  MessageCircle,
  Table,
  GitBranch,
  Search,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from 'lucide-react';

export default function NodePalette() {
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState({
    triggers: true,
    agents: true,
    integrations: true,
    logic: true,
  });

  const categories = [
    {
      id: 'triggers',
      name: 'Triggers',
      items: [
        {
          label: 'Manual Trigger',
          type: 'triggerNode',
          nodeType: 'trigger_manual',
          icon: Zap,
          desc: 'Manual operator execution',
          config: { provider: 'manual', action: 'manual_trigger' },
        },
        {
          label: 'Webhook Ingest',
          type: 'triggerNode',
          nodeType: 'trigger_webhook',
          icon: Globe,
          desc: 'HTTP POST webhook payload',
          config: { provider: 'webhook', action: 'receive_webhook', endpoint: '/api/v1/webhook' },
        },
        {
          label: 'Schedule Cron',
          type: 'triggerNode',
          nodeType: 'trigger_schedule',
          icon: Clock,
          desc: 'Time-based automated run',
          config: { provider: 'schedule', cron: '0 * * * *' },
        },
      ],
    },
    {
      id: 'agents',
      name: 'AI Agent Nodes',
      items: [
        {
          label: 'AI Reasoning LLM',
          type: 'agentNode',
          nodeType: 'agent_llm',
          icon: Bot,
          desc: 'Prompt & multi-step thinking',
          config: { provider: 'openrouter', action: 'execute_reasoning', params: { prompt: '' } },
        },
        {
          label: 'Severity Classifier',
          type: 'agentNode',
          nodeType: 'agent_classifier',
          icon: Filter,
          desc: 'Categorizes inputs into classes',
          config: { provider: 'gemini', action: 'classify', params: { categories: ['HIGH', 'MED', 'LOW'] } },
        },
        {
          label: 'Payload Summarizer',
          type: 'agentNode',
          nodeType: 'agent_summarizer',
          icon: FileText,
          desc: 'Condenses logs & data',
          config: { provider: 'openrouter', action: 'summarize', params: { maxTokens: 200 } },
        },
      ],
    },
    {
      id: 'integrations',
      name: 'Third-Party Integrations',
      items: [
        {
          label: 'Gmail Send Email',
          type: 'integrationNode',
          nodeType: 'integration_gmail',
          icon: Mail,
          desc: 'Dispatches emails via OAuth',
          config: { provider: 'gmail', action: 'send_email', params: { to: '', subject: '', body: '' } },
        },
        {
          label: 'Slack Post Message',
          type: 'integrationNode',
          nodeType: 'integration_slack',
          icon: MessageSquare,
          desc: 'Sends message to Slack channel',
          config: { provider: 'slack', action: 'send_message', params: { channel: '#general', text: '' } },
        },
        {
          label: 'Discord Broadcast',
          type: 'integrationNode',
          nodeType: 'integration_discord',
          icon: MessageCircle,
          desc: 'Sends alert to Discord channel',
          config: { provider: 'discord', action: 'send_webhook', params: { content: '' } },
        },
        {
          label: 'Sheets Append Row',
          type: 'integrationNode',
          nodeType: 'integration_sheets',
          icon: Table,
          desc: 'Appends data to spreadsheet',
          config: { provider: 'google-sheets', action: 'append_row', params: { spreadsheetId: '', values: [] } },
        },
      ],
    },
    {
      id: 'logic',
      name: 'Logic & Routing',
      items: [
        {
          label: 'Conditional Branch',
          type: 'conditionNode',
          nodeType: 'condition_check',
          icon: GitBranch,
          desc: 'IF / ELSE conditional branch',
          config: { provider: 'logic', condition: 'status == "success"' },
        },
      ],
    },
  ];

  const onDragStart = (event, nodeData) => {
    event.dataTransfer.setData(
      'application/agentflow-node',
      JSON.stringify({
        type: nodeData.type,
        data: {
          label: nodeData.label,
          nodeType: nodeData.nodeType,
          config: nodeData.config,
        },
      })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  const toggleCategory = (id) => {
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-64 h-full bg-surface border-r border-slate-800/80 flex flex-col select-none">
      <div className="p-3.5 border-b border-slate-800/80">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">
          Node Palette
        </h3>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-elevated border border-slate-700/80 rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {categories.map((cat) => {
          const filteredItems = cat.items.filter(
            (item) =>
              item.label.toLowerCase().includes(search.toLowerCase()) ||
              item.desc.toLowerCase().includes(search.toLowerCase())
          );

          if (filteredItems.length === 0 && search) return null;

          const isOpen = openCategories[cat.id];

          return (
            <div key={cat.id} className="space-y-1.5">
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between text-[11px] font-mono uppercase text-slate-400 font-semibold px-1 py-1 hover:text-slate-200"
              >
                <span>{cat.name}</span>
                {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {isOpen && (
                <div className="space-y-1.5">
                  {filteredItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={idx}
                        draggable
                        onDragStart={(e) => onDragStart(e, item)}
                        className="glass-card p-2.5 rounded-lg border border-slate-800 hover:border-indigo-500/40 cursor-grab active:cursor-grabbing flex items-center space-x-2.5 transition-all group"
                      >
                        <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-400 shrink-0" />
                        <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-indigo-400 shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">{item.label}</p>
                          <p className="text-[10px] text-slate-400 truncate">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
