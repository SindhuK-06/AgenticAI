import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import MetricGrid from '../components/MetricGrid/MetricGrid';
import api from '../services/api';
import { getSocket } from '../services/socket';
import {
  Sparkles,
  Plus,
  Play,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  GitMerge,
  ExternalLink,
  Bot,
  Activity,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState({
    metrics: {},
    recentWorkflows: [],
    recentExecutions: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [executingId, setExecutingId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/workflows/dashboard');
      setData(res.data || {});
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen to real-time execution updates and activity
    const socket = getSocket();
    if (socket) {
      const handleEvent = () => {
        fetchDashboardData();
      };
      socket.on('execution_status', handleEvent);
      socket.on('agent_event', handleEvent);

      return () => {
        socket.off('execution_status', handleEvent);
        socket.off('agent_event', handleEvent);
      };
    }
  }, []);

  const handleQuickExecute = async (e, workflowId) => {
    e.preventDefault();
    e.stopPropagation();
    setExecutingId(workflowId);
    try {
      const res = await api.post(`/workflows/${workflowId}/execute`, {});
      const executionId = res.data?._id || res.data?.id;
      router.push(`/executions/${executionId}`);
    } catch (err) {
      alert(`Execution failed: ${err.message}`);
    } finally {
      setExecutingId(null);
    }
  };

  const getAgentBadge = (agent) => {
    switch (agent) {
      case 'planner':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'execution':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'validation':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'recovery':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'monitoring':
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>COMPLETED</span>
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-950/60 text-blue-400 border border-blue-500/30 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>RUNNING</span>
          </span>
        );
      case 'RETRYING':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-950/60 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            <span>RETRYING</span>
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <span>PAUSED</span>
          </span>
        );
      case 'FAILED':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-rose-950/60 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            <span>FAILED</span>
          </span>
        );
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title="Dashboard & Metrics">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Action Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-mono uppercase text-emerald-400 tracking-wider font-semibold">
                  Autonomous Operations Active
                </span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white mt-1">
                Operator Mission Control
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Monitor multi-agent execution pipelines, trigger automated runs, and generate workflows from prompts.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/workflows/builder"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/25 flex items-center space-x-2 group"
              >
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span>Prompt to Workflow</span>
              </Link>
              <Link
                href="/workflows"
                className="px-4 py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-highlight border border-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center space-x-1.5"
              >
                <GitMerge className="w-4 h-4 text-indigo-400" />
                <span>All Workflows</span>
              </Link>
            </div>
          </div>

          {/* Metric Grid */}
          <MetricGrid metrics={data.metrics} />

          {/* Dual Panel: Active Workflows & Recent Executions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workflows Card */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <GitMerge className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Active Workflows
                    </h3>
                  </div>
                  <Link
                    href="/workflows"
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-medium"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-slate-800/80 mt-2">
                  {loading ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-mono">
                      Loading workflows...
                    </div>
                  ) : data.recentWorkflows.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 space-y-3">
                      <p>No workflows created yet.</p>
                      <Link
                        href="/workflows/builder"
                        className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate your first workflow</span>
                      </Link>
                    </div>
                  ) : (
                    data.recentWorkflows.map((wf) => {
                      const id = wf._id || wf.id;
                      return (
                        <div
                          key={id}
                          className="py-3.5 flex items-center justify-between group hover:bg-surface-elevated/40 px-2 rounded-lg transition-colors"
                        >
                          <Link href={`/workflows/${id}`} className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 truncate transition-colors">
                                {wf.name}
                              </h4>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                                v{wf.version || 1}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-[11px] text-slate-400 truncate">
                                {wf.nodes?.length || 0} nodes • {wf.triggerConfig?.type || 'manual'} trigger
                              </span>
                            </div>
                          </Link>

                          <button
                            onClick={(e) => handleQuickExecute(e, id)}
                            disabled={executingId === id}
                            className="p-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all flex items-center space-x-1 text-xs shrink-0"
                            title="Execute Workflow Now"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span className="hidden sm:inline font-mono text-[11px]">Run</span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Recent Executions Stream */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Recent Executions
                    </h3>
                  </div>
                  <Link
                    href="/executions"
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center space-x-1 font-medium"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-slate-800/80 mt-2">
                  {loading ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-mono">
                      Loading executions...
                    </div>
                  ) : data.recentExecutions.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                      <p>No executions recorded yet.</p>
                      <p className="text-[11px] text-slate-400">Run any workflow to stream agent execution telemetry.</p>
                    </div>
                  ) : (
                    data.recentExecutions.map((exec) => {
                      const id = exec._id || exec.id;
                      return (
                        <Link
                          key={id}
                          href={`/executions/${id}`}
                          className="py-3 flex items-center justify-between group hover:bg-surface-elevated/40 px-2 rounded-lg transition-colors block"
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 truncate">
                                {exec.workflowSnapshot?.name || 'Automation Run'}
                              </h4>
                            </div>
                            <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-400 font-mono">
                              <span>{new Date(exec.createdAt).toLocaleTimeString()}</span>
                              <span>•</span>
                              <span>{exec.duration ? `${exec.duration}ms` : 'active'}</span>
                            </div>
                          </div>

                          <div className="shrink-0">{getStatusBadge(exec.status)}</div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Multi-Agent Activity Feed */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Live Multi-Agent Event Stream
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Socket.IO Connected
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {data.recentActivity.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 font-mono">
                  Agent event stream waiting for trigger signals...
                </div>
              ) : (
                data.recentActivity.map((log, idx) => (
                  <div
                    key={log._id || log.id || idx}
                    className="p-2.5 rounded-lg bg-surface-elevated/50 border border-slate-800/80 flex items-start justify-between text-xs space-x-3 font-mono"
                  >
                    <div className="flex items-start space-x-2.5 min-w-0">
                      <span
                        className={`text-[10px] uppercase px-1.5 py-0.5 rounded border font-semibold shrink-0 mt-0.5 ${getAgentBadge(
                          log.agent
                        )}`}
                      >
                        {log.agent}
                      </span>
                      <p className="text-slate-300 text-xs truncate leading-relaxed">
                        {log.message}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(log.timestamp || log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
