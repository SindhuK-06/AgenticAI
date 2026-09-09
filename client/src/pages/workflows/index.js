import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import api from '../../services/api';
import {
  GitMerge,
  Sparkles,
  Plus,
  Play,
  Copy,
  Trash2,
  Search,
  Filter,
  ExternalLink,
  Clock,
  Layers,
} from 'lucide-react';

export default function WorkflowsListPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [executingId, setExecutingId] = useState(null);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workflows', {
        params: { search, tag: filterTag !== 'all' ? filterTag : undefined },
      });
      setWorkflows(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [search, filterTag]);

  const handleExecute = async (id) => {
    setExecutingId(id);
    try {
      const res = await api.post(`/workflows/${id}/execute`, {});
      const executionId = res.data?._id || res.data?.id;
      router.push(`/executions/${executionId}`);
    } catch (err) {
      alert(`Execution failed: ${err.message}`);
    } finally {
      setExecutingId(null);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/workflows/${id}/duplicate`);
      await fetchWorkflows();
    } catch (err) {
      alert(`Duplicate failed: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await api.delete(`/workflows/${id}`);
      setWorkflows((prev) => prev.filter((w) => (w._id || w.id) !== id));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const allTags = ['all', ...Array.from(new Set(workflows.flatMap((w) => w.tags || [])))];

  return (
    <ProtectedRoute>
      <AppShell title="Workflow Directory">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Workflows & Pipelines
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage, version, edit, and trigger your visual agentic automation graphs.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/workflows/builder"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/25 flex items-center space-x-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Prompt Builder</span>
              </Link>
              <button
                onClick={async () => {
                  try {
                    const res = await api.post('/workflows', {
                      name: 'Untitled Pipeline',
                      description: 'Custom visual workflow pipeline',
                      nodes: [
                        {
                          id: 'node_trigger',
                          type: 'triggerNode',
                          position: { x: 100, y: 150 },
                          data: { label: 'Manual Trigger', nodeType: 'trigger_manual', icon: 'Zap' },
                        },
                      ],
                      edges: [],
                    });
                    const newId = res.data?._id || res.data?.id;
                    router.push(`/workflows/${newId}`);
                  } catch (e) {
                    alert(e.message);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-highlight border border-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Blank Canvas</span>
              </button>
            </div>
          </div>

          {/* Search & Tag Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-panel p-3.5 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search workflows by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-elevated border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag)}
                  className={`text-xs px-2.5 py-1 rounded-lg capitalize whitespace-nowrap transition-colors ${
                    filterTag === tag
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-surface-elevated text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Workflows Grid */}
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400 font-mono">
              Loading workflows catalog...
            </div>
          ) : workflows.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-4 max-w-md mx-auto">
              <GitMerge className="w-10 h-10 text-indigo-400 mx-auto opacity-60" />
              <div>
                <h3 className="text-sm font-bold text-white">No Workflows Found</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Start by typing an automation requirement or create a blank workflow canvas.
                </p>
              </div>
              <Link
                href="/workflows/builder"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch AI Builder</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {workflows.map((wf) => {
                const id = wf._id || wf.id;
                return (
                  <div
                    key={id}
                    className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/40 flex flex-col justify-between transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                          v{wf.version || 1} • {wf.status?.toUpperCase() || 'ACTIVE'}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDuplicate(id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-highlight transition-colors"
                            title="Duplicate Workflow"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                            title="Delete Workflow"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <Link href={`/workflows/${id}`}>
                        <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors mt-3 line-clamp-1">
                          {wf.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {wf.description || 'No description provided.'}
                        </p>
                      </Link>

                      {/* Tag pills */}
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {(wf.tags || ['Automation']).slice(0, 3).map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-slate-300 border border-slate-700/60"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-mono text-slate-400">
                        {wf.nodes?.length || 0} nodes
                      </span>

                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/workflows/${id}`}
                          className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-highlight text-slate-300 font-medium text-xs transition-colors"
                        >
                          Canvas
                        </Link>
                        <button
                          onClick={() => handleExecute(id)}
                          disabled={executingId === id}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 flex items-center space-x-1 transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Run</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
