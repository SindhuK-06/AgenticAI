import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

function ConditionNode({ data, selected }) {
  return (
    <div
      className={`min-w-[210px] rounded-xl bg-slate-900/90 border-2 transition-all p-3.5 shadow-xl backdrop-blur ${
        selected
          ? 'border-amber-400 ring-4 ring-amber-500/20 shadow-amber-500/20'
          : 'border-amber-500/40 hover:border-amber-400/80'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-slate-900"
      />

      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
          <GitBranch className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-semibold block">
            CONDITION
          </span>
          <h4 className="text-xs font-bold text-white truncate">{data.label || 'Decision Rule'}</h4>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>Branch Router</span>
        <span className="text-amber-400">IF / ELSE</span>
      </div>

      {/* True / False Output Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-slate-900 !top-[30%]"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="!w-3 !h-3 !bg-rose-500 !border-2 !border-slate-900 !top-[70%]"
      />
    </div>
  );
}

export default memo(ConditionNode);
