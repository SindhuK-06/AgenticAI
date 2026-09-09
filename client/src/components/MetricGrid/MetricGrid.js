import React from 'react';
import { GitMerge, PlayCircle, CheckCircle2, RefreshCw, Zap, Clock } from 'lucide-react';

export default function MetricGrid({ metrics = {} }) {
  const {
    totalWorkflows = 0,
    activeWorkflows = 0,
    totalExecutions = 0,
    completedExecutions = 0,
    failedExecutions = 0,
    runningExecutions = 0,
    successRate = 100,
    avgDurationMs = 850,
  } = metrics;

  const cards = [
    {
      label: 'Active Workflows',
      value: activeWorkflows,
      subValue: `${totalWorkflows} total registered`,
      icon: GitMerge,
      color: 'from-blue-500/20 to-indigo-500/20',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Total Executions',
      value: totalExecutions,
      subValue: `${runningExecutions} currently active`,
      icon: PlayCircle,
      color: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
    },
    {
      label: 'Success Rate',
      value: `${successRate}%`,
      subValue: `${completedExecutions} succeeded, ${failedExecutions} escalated`,
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-teal-500/20',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Avg Agent Duration',
      value: `${(avgDurationMs / 1000).toFixed(2)}s`,
      subValue: 'DAG pipeline traversal',
      icon: Clock,
      color: 'from-amber-500/20 to-orange-500/20',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`glass-card p-5 rounded-xl border ${card.borderColor} bg-gradient-to-br ${card.color} transition-all duration-200 hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {card.label}
              </span>
              <div className={`p-2 rounded-lg bg-surface/80 border border-slate-700/60 ${card.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl md:text-3xl font-bold tracking-tight text-white font-mono">
                {card.value}
              </span>
              <p className="text-xs text-slate-400 mt-1 font-medium">{card.subValue}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
