import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot, Sparkles, Filter, FileText } from 'lucide-react';

function AgentNode({ data, selected }) {
  const nodeType = data.nodeType || 'agent_llm';

  return (
    <div
      className={`min-w-[220px] rounded-xl bg-slate-900/90 border-2 transition-all p-3.5 shadow-xl backdrop-blur ${
        selected
          ? 'border-purple-400 ring-4 ring-purple-500/20 shadow-purple-500/20'
          : 'border-purple-500/40 hover:border-purple-400/80'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-slate-900"
      />

      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
          {nodeType.includes('classifier') ? (
            <Filter className="w-4 h-4" />
          ) : nodeType.includes('summarizer') ? (
            <FileText className="w-4 h-4" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-semibold block">
            AI AGENT
          </span>
          <h4 className="text-xs font-bold text-white truncate">{data.label || 'Reasoning Agent'}</h4>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>{data.config?.action || 'reasoning'}</span>
        <span className="text-purple-300 capitalize">{data.config?.provider || 'AI Core'}</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-slate-900"
      />
    </div>
  );
}

export default memo(AgentNode);
