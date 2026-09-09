import React, { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import WorkflowCanvas from '../../components/WorkflowCanvas/WorkflowCanvas';
import { useWorkflowStore } from '../../store/workflowStore';
import api from '../../services/api';
import {
  Sparkles,
  Play,
  Save,
  Wand2,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  Zap,
} from 'lucide-react';

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const {
    nodes,
    edges,
    activeWorkflow,
    generateWorkflowFromPrompt,
    saveWorkflow,
    isGenerating,
    isSaving,
  } = useWorkflowStore();

  const [prompt, setPrompt] = useState(
    'When an invoice arrives by email, parse the amount with AI, append to Google Sheets, and notify Slack'
  );
  const [model, setModel] = useState('auto');
  const [generatorBadge, setGeneratorBadge] = useState(null);

  const samplePrompts = [
    {
      title: 'Invoice Processing & Sheets Sync',
      prompt: 'When an invoice arrives by email, parse the amount with AI, append to Google Sheets, and notify Slack',
    },
    {
      title: 'Incident Classifier & Multi-Alert',
      prompt: 'Classify critical server incidents with AI and dispatch alerts to Slack & Discord',
    },
    {
      title: 'Support Ticket Sentiment & Gmail Reply',
      prompt: 'Analyze customer support ticket sentiment and draft automated Gmail replies',
    },
  ];

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    try {
      const generated = await generateWorkflowFromPrompt(prompt, model);
      setGeneratorBadge(generated.generator || 'AI Core');
    } catch (err) {
      alert(`Generation failed: ${err.message}`);
    }
  };

  const handleSaveAndOpen = async () => {
    try {
      const saved = await saveWorkflow(null, {
        name: activeWorkflow?.name || 'AI Generated Automation',
        description: activeWorkflow?.description || prompt,
        tags: activeWorkflow?.tags || ['AI Generated'],
        triggerConfig: activeWorkflow?.triggerConfig || { type: 'manual' },
      });
      const id = saved._id || saved.id;
      router.push(`/workflows/${id}`);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title="AI Prompt Studio">
        <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
          {/* Top Prompt Input Panel */}
          <div className="glass-panel p-4 md:p-5 rounded-2xl border border-slate-800 space-y-3 shrink-0 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Describe Desired Automation
                </h3>
              </div>

              {generatorBadge && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1 self-start sm:self-auto">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Engine: {generatorBadge}</span>
                </span>
              )}
            </div>

            <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. When a new ticket is opened in Discord, run sentiment analysis and log to Sheets..."
                className="flex-1 bg-surface-elevated border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-inner"
              />

              <button
                type="submit"
                disabled={isGenerating}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Generate Graph</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Presets:</span>
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p.prompt);
                  }}
                  className="text-[11px] text-slate-400 hover:text-indigo-300 bg-surface-elevated hover:bg-indigo-950/30 border border-slate-800 rounded-lg px-2.5 py-1 transition-colors text-left"
                >
                  ⚡ {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas Preview Area & Toolbar */}
          <div className="flex-1 glass-panel rounded-2xl border border-slate-800 overflow-hidden relative flex flex-col">
            {/* Top Canvas Toolbar */}
            <div className="h-12 px-4 border-b border-slate-800 bg-surface/80 flex items-center justify-between z-10">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white">
                  {activeWorkflow?.name || 'Canvas Preview'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  ({nodes.length} nodes, {edges.length} edges)
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveAndOpen}
                  disabled={nodes.length === 0 || isSaving}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-40"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save & Open Editor'}</span>
                </button>
              </div>
            </div>

            {/* Visual Canvas */}
            <div className="flex-1 w-full h-full relative">
              {nodes.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 z-10 pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Interactive Graph Preview</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Type your workflow requirements above or select a preset to generate a full visual graph.
                    </p>
                  </div>
                </div>
              ) : null}

              <WorkflowCanvas readOnly={false} />
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
