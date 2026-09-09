import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, Clock, Globe, Play } from 'lucide-react';

function TriggerNode({ data, selected }) {
  const iconName = data.icon || 'Zap';
  const nodeType = data.nodeType || 'trigger_manual';

  return (
    <div
      className={`min-w-[210px] rounded-xl bg-slate-900/90 border-2 transition-all p-3.5 shadow-xl backdrop-blur ${
        selected
          ? 'border-indigo-400 ring-4 ring-indigo-500/20 shadow-indigo-500/20'
          : 'border-indigo-500/40 hover:border-indigo-400/80'
      }`}
    >
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
          {nodeType.includes('schedule') ? (
            <Clock className="w-4 h-4" />
          ) : nodeType.includes('webhook') ? (
            <Globe className="w-4 h-4" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-semibold block">
            TRIGGER
          </span>
          <h4 className="text-xs font-bold text-white truncate">{data.label || 'Workflow Trigger'}</h4>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>{data.config?.provider || 'manual'}</span>
        <span className="text-emerald-400">Entry Point</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-slate-900"
      />
    </div>
  );
}

export default memo(TriggerNode);
