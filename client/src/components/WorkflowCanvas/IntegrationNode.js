import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Mail, MessageSquare, MessageCircle, Table, Link2 } from 'lucide-react';

function IntegrationNode({ data, selected }) {
  const nodeType = data.nodeType || '';
  const provider = data.config?.provider || (nodeType.includes('gmail') ? 'gmail' : nodeType.includes('slack') ? 'slack' : nodeType.includes('discord') ? 'discord' : 'google-sheets');

  const getProviderMeta = () => {
    switch (provider) {
      case 'gmail':
        return {
          icon: Mail,
          color: 'emerald',
          border: 'border-emerald-500/40',
          selectedBorder: 'border-emerald-400',
          ring: 'ring-emerald-500/20',
          bg: 'bg-emerald-600/20',
          text: 'text-emerald-400',
          label: 'GMAIL',
        };
      case 'slack':
        return {
          icon: MessageSquare,
          color: 'amber',
          border: 'border-amber-500/40',
          selectedBorder: 'border-amber-400',
          ring: 'ring-amber-500/20',
          bg: 'bg-amber-600/20',
          text: 'text-amber-400',
          label: 'SLACK',
        };
      case 'discord':
        return {
          icon: MessageCircle,
          color: 'indigo',
          border: 'border-indigo-500/40',
          selectedBorder: 'border-indigo-400',
          ring: 'ring-indigo-500/20',
          bg: 'bg-indigo-600/20',
          text: 'text-indigo-400',
          label: 'DISCORD',
        };
      case 'google-sheets':
      default:
        return {
          icon: Table,
          color: 'teal',
          border: 'border-teal-500/40',
          selectedBorder: 'border-teal-400',
          ring: 'ring-teal-500/20',
          bg: 'bg-teal-600/20',
          text: 'text-teal-400',
          label: 'SHEETS',
        };
    }
  };

  const meta = getProviderMeta();
  const Icon = meta.icon;

  return (
    <div
      className={`min-w-[220px] rounded-xl bg-slate-900/90 border-2 transition-all p-3.5 shadow-xl backdrop-blur ${
        selected
          ? `${meta.selectedBorder} ring-4 ${meta.ring} shadow-lg`
          : `${meta.border} hover:border-slate-400/80`
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={`!w-3 !h-3 !${meta.bg} !border-2 !border-slate-900`}
      />

      <div className="flex items-center space-x-2.5">
        <div className={`w-8 h-8 rounded-lg ${meta.bg} border ${meta.border} flex items-center justify-center ${meta.text} shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-[10px] font-mono uppercase tracking-wider ${meta.text} font-semibold block`}>
            {meta.label} TOOL
          </span>
          <h4 className="text-xs font-bold text-white truncate">{data.label || `${meta.label} Action`}</h4>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>{data.config?.action || 'execute'}</span>
        <span className="text-slate-300">Tool Node</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className={`!w-3 !h-3 !${meta.bg} !border-2 !border-slate-900`}
      />
    </div>
  );
}

export default memo(IntegrationNode);
