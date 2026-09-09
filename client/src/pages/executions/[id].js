import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import api from '../../services/api';
import { getSocket, joinExecutionRoom, leaveExecutionRoom } from '../../services/socket';
import {
  Activity,
  Play,
  Pause,
  XOctagon,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Bot,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Code,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function ExecutionTimelinePage() {
  const router = useRouter();
  const { id } = router.query;

  const [execution, setExecution] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTimeline = async () => {
    if (!id) return;
    try {
      const execRes = await api.get(`/executions/${id}`);
      const timelineRes = await api.get(`/executions/${id}/timeline`);
      setExecution(execRes.data);
      setLogs(timelineRes.data?.logs || []);
    } catch (e) {
      console.error('Failed to load execution timeline:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTimeline();
      joinExecutionRoom(id);

      const socket = getSocket();
      if (socket) {
        const handleAgentEvent = (event) => {
          if (event.executionId === id) {
            setLogs((prev) => [...prev, event]);
          }
        };

        const handleStatusUpdate = (update) => {
          if (update.executionId === id) {
            setExecution((prev) => (prev ? { ...prev, ...update } : prev));
          }
        };

        socket.on('agent_event', handleAgentEvent);
        socket.on('execution_status', handleStatusUpdate);

        return () => {
          leaveExecutionRoom(id);
          socket.off('agent_event', handleAgentEvent);
          socket.off('execution_status', handleStatusUpdate);
        };
      }
    }
  }, [id]);

  const handlePause = async () => {
    setActionLoading(true);
    try {
      await api.post(`/executions/${id}/pause`);
      setExecution((prev) => ({ ...prev, status: 'PAUSED' }));
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await api.post(`/executions/${id}/resume`);
      setExecution((prev) => ({ ...prev, status: 'RUNNING' }));
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this running execution?')) return;
    setActionLoading(true);
    try {
      await api.post(`/executions/${id}/cancel`);
      setExecution((prev) => ({ ...prev, status: 'CANCELLED' }));
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getAgentBadge = (agent) => {
    switch (agent) {
      case 'planner':
        return {
          bg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          title: 'Planner Agent',
        };
      case 'execution':
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          title: 'Execution Agent',
        };
      case 'validation':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          title: 'Validation Agent',
        };
      case 'recovery':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          title: 'Recovery Agent',
        };
      case 'monitoring':
      default:
        return {
          bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          title: 'Monitoring Agent',
        };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>COMPLETED</span>
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-mono font-medium bg-blue-950 text-blue-400 border border-blue-500/30 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>RUNNING</span>
          </span>
        );
      case 'RETRYING':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-950 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>RETRYING BACKOFF</span>
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <Pause className="w-3.5 h-3.5" />
            <span>PAUSED</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
            <span>CANCELLED</span>
          </span>
        );
      case 'FAILED':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-mono font-medium bg-rose-950 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>FAILED</span>
          </span>
        );
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title="Execution Telemetry">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header & Controls Banner */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/executions')}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      {execution?.workflowSnapshot?.name || 'Workflow Execution'}
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      v{execution?.workflowSnapshot?.version || 1}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Execution ID: {id} • Trigger: {execution?.triggerSource || 'manual'}
                  </p>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {getStatusBadge(execution?.status)}

                {execution?.status === 'RUNNING' && (
                  <button
                    onClick={handlePause}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-highlight text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition-colors"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                )}

                {execution?.status === 'PAUSED' && (
                  <button
                    onClick={handleResume}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Resume</span>
                  </button>
                )}

                {(execution?.status === 'RUNNING' || execution?.status === 'PAUSED') && (
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    <XOctagon className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </div>

            {/* Substrate & Telemetry Badges */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-400">
                  Substrate:{' '}
                  <strong className="text-indigo-400">
                    LangGraph ({execution?.langGraphStatus || 'available'})
                  </strong>
                </span>
                <span className="text-slate-400">
                  Confidence Score:{' '}
                  <strong className="text-emerald-400">
                    {((execution?.confidenceScore || 0.95) * 100).toFixed(0)}%
                  </strong>
                </span>
                <span className="text-slate-400">
                  Duration:{' '}
                  <strong className="text-amber-400">
                    {execution?.duration ? `${execution.duration}ms` : 'calculating...'}
                  </strong>
                </span>
              </div>

              <span className="text-slate-400">
                Total Agent Events: <strong className="text-white">{logs.length}</strong>
              </span>
            </div>
          </div>

          {/* Failure / Escalation Alert Banner */}
          {execution?.error && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-2">
              <div className="flex items-center space-x-2 text-rose-300 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>EXECUTION ESCALATION ({execution.error.code || 'API_FAILURE'})</span>
              </div>
              <p className="text-xs text-rose-200 font-mono leading-relaxed">
                {execution.error.message}
              </p>
              {execution.error.suggestedFix && (
                <p className="text-[11px] text-rose-300/80 font-mono">
                  Suggested Action: {execution.error.suggestedFix}
                </p>
              )}
            </div>
          )}

          {/* Live Agent Event Timeline */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Agent Timeline Logs
                </h3>
              </div>
              <div className="flex items-center space-x-1 text-[11px] font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Streaming</span>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-mono">
                Connecting to live agent stream...
              </div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-mono">
                Awaiting first agent event...
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                {logs.map((log, idx) => {
                  const logId = log._id || log.id || `log_${idx}`;
                  const isExpanded = expandedLogId === logId;
                  const agentMeta = getAgentBadge(log.agent);

                  return (
                    <div key={logId} className="relative group">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-background ${
                          log.level === 'success'
                            ? 'bg-emerald-400'
                            : log.level === 'error'
                            ? 'bg-rose-500'
                            : log.level === 'warning'
                            ? 'bg-amber-400'
                            : 'bg-indigo-400'
                        }`}
                      ></div>

                      {/* Log Entry Card */}
                      <div className="glass-card p-3.5 rounded-xl border border-slate-800/90 space-y-2 hover:border-indigo-500/40 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${agentMeta.bg}`}
                            >
                              {agentMeta.title}
                            </span>
                            {log.nodeId && (
                              <span className="text-[10px] font-mono text-slate-400">
                                Node: [{log.nodeId}]
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
                          {log.message}
                        </p>

                        {/* Expandable JSON Metadata Inspector */}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="pt-1">
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : logId)}
                              className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                            >
                              <Code className="w-3 h-3" />
                              <span>{isExpanded ? 'Hide Payload' : 'Inspect Step Payload'}</span>
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </button>

                            {isExpanded && (
                              <pre className="mt-2 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
