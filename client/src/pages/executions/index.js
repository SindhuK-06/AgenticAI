import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import {
  PlayCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  ChevronRight,
  Filter,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

export default function ExecutionsListPage() {
  const [executions, setExecutions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchExecutions = async () => {
    try {
      const res = await api.get('/executions', {
        params: { status: filterStatus !== 'all' ? filterStatus : undefined, limit: 50 },
      });
      setExecutions(res.data?.executions || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      console.error('Failed to load executions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();

    const socket = getSocket();
    if (socket) {
      const handleUpdate = () => {
        fetchExecutions();
      };
      socket.on('execution_status', handleUpdate);
      socket.on('execution_event', handleUpdate);

      return () => {
        socket.off('execution_status', handleUpdate);
        socket.off('execution_event', handleUpdate);
      };
    }
  }, [filterStatus]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>COMPLETED</span>
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-blue-950/60 text-blue-400 border border-blue-500/30 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>RUNNING</span>
          </span>
        );
      case 'RETRYING':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-amber-950/60 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>RETRYING</span>
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <span>PAUSED</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
            <span>CANCELLED</span>
          </span>
        );
      case 'FAILED':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-rose-950/60 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>FAILED</span>
          </span>
        );
    }
  };

  const statuses = ['all', 'COMPLETED', 'RUNNING', 'FAILED', 'RETRYING', 'PAUSED'];

  return (
    <ProtectedRoute>
      <AppShell title="Execution Runs">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Workflow Execution History
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time timeline, audit trails, retry classifications, and performance metrics.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-400">Total Runs:</span>
              <span className="text-xs font-mono font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/30">
                {total}
              </span>
            </div>
          </div>

          {/* Status Filter Toolbar */}
          <div className="flex items-center space-x-1.5 overflow-x-auto glass-panel p-2 rounded-xl border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`text-xs px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-colors ${
                  filterStatus === st
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Executions Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400 font-mono">
                Loading executions log...
              </div>
            ) : executions.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                <PlayCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No executions matching selected filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-elevated/60 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Workflow Name</th>
                      <th className="py-3.5 px-4 font-semibold">Status</th>
                      <th className="py-3.5 px-4 font-semibold">Trigger</th>
                      <th className="py-3.5 px-4 font-semibold">Duration</th>
                      <th className="py-3.5 px-4 font-semibold">Started At</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {executions.map((exec) => {
                      const id = exec._id || exec.id;
                      return (
                        <tr
                          key={id}
                          className="hover:bg-surface-elevated/30 transition-colors group cursor-pointer"
                          onClick={() => router.push(`/executions/${id}`)}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                                {exec.workflowSnapshot?.name || 'Automation Run'}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                v{exec.workflowSnapshot?.version || 1}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              ID: {id.substring(0, 12)}...
                            </span>
                          </td>

                          <td className="py-3.5 px-4">{getStatusBadge(exec.status)}</td>

                          <td className="py-3.5 px-4 font-mono text-slate-300 capitalize">
                            {exec.triggerSource || 'manual'}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {exec.duration ? `${exec.duration}ms` : 'active'}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-400">
                            {new Date(exec.createdAt).toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <Link
                              href={`/executions/${id}`}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-indigo-600 hover:text-white text-slate-300 transition-colors text-xs font-semibold"
                            >
                              <span>Timeline</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
