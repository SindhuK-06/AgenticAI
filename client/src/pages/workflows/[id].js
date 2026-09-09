import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import NodePalette from '../../components/NodePalette/NodePalette';
import WorkflowCanvas from '../../components/WorkflowCanvas/WorkflowCanvas';
import NodeConfigPanel from '../../components/NodeConfigPanel/NodeConfigPanel';
import { useWorkflowStore } from '../../store/workflowStore';
import {
  Save,
  Play,
  Copy,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Settings,
} from 'lucide-react';

export default function WorkflowEditorPage() {
  const router = useRouter();
  const { id } = router.query;
  const {
    activeWorkflow,
    fetchWorkflowById,
    saveWorkflow,
    executeWorkflow,
    duplicateWorkflow,
    isSaving,
    isLoading,
  } = useWorkflowStore();

  const [workflowName, setWorkflowName] = useState('');
  const [description, setDescription] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  useEffect(() => {
    if (id) {
      fetchWorkflowById(id).then((wf) => {
        if (wf) {
          setWorkflowName(wf.name);
          setDescription(wf.description || '');
        }
      });
    }
  }, [id, fetchWorkflowById]);

  const handleSave = async () => {
    if (!id) return;
    try {
      await saveWorkflow(id, { name: workflowName, description });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const handleExecute = async () => {
    if (!id) return;
    setExecuting(true);
    try {
      // First save active changes
      await saveWorkflow(id, { name: workflowName, description });
      const exec = await executeWorkflow(id, {});
      const execId = exec._id || exec.id;
      router.push(`/executions/${execId}`);
    } catch (err) {
      alert(`Execute failed: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!id) return;
    try {
      const cloned = await duplicateWorkflow(id);
      const clonedId = cloned._id || cloned.id;
      router.push(`/workflows/${clonedId}`);
    } catch (err) {
      alert(`Duplicate failed: ${err.message}`);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title={`Workflow Editor`}>
        <div className="h-[calc(100vh-8rem)] flex flex-col glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          {/* Top Canvas Editor Toolbar */}
          <div className="h-14 px-4 bg-surface-elevated/80 border-b border-slate-800 flex items-center justify-between z-20">
            {/* Left Info */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/workflows')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface transition-colors"
                title="Back to Workflows"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="Workflow Name"
                  className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-indigo-500 font-bold text-xs sm:text-sm text-white px-1 py-0.5 focus:outline-none"
                />
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                  v{activeWorkflow?.version || 1}
                </span>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2.5">
              {savedSuccess && (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Saved</span>
                </span>
              )}

              <button
                onClick={handleDuplicate}
                className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-highlight border border-slate-700 text-slate-300 text-xs font-medium transition-colors hidden sm:flex items-center space-x-1"
                title="Duplicate Workflow"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Clone</span>
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-3.5 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-highlight border border-slate-700 text-slate-100 font-semibold text-xs transition-colors flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>

              <button
                onClick={handleExecute}
                disabled={executing}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                {executing ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Workflow</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3-Column Studio Layout */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left: Node Palette */}
            <NodePalette />

            {/* Center: React Flow Canvas */}
            <div className="flex-1 h-full relative bg-slate-950">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-slate-400 z-30 bg-background/60 backdrop-blur-sm">
                  Loading workflow graph...
                </div>
              ) : (
                <WorkflowCanvas />
              )}
            </div>

            {/* Right: Node Inspector Panel */}
            <NodeConfigPanel />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
