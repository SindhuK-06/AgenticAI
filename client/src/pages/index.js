import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';
import {
  Activity,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Bot,
  Zap,
  Play,
  Layers,
  Cpu,
  RefreshCw,
  Mail,
  MessageSquare,
  MessageCircle,
  Table,
  CheckCircle2,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [promptInput, setPromptInput] = useState(
    'When an invoice arrives by email, parse the amount with AI, append to Google Sheets, and notify Slack'
  );
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const presetPrompts = [
    'When an invoice arrives by email, parse amount with AI and append to Google Sheets',
    'Classify critical server incidents with AI and dispatch alerts to Slack & Discord',
    'Analyze customer support ticket sentiment and draft automated Gmail replies',
  ];

  const agentChain = [
    { name: 'Planner Agent', desc: 'Computes DAG topological ordering & confidence score (99%)', color: 'from-blue-500 to-indigo-500', badge: 'PLANNER' },
    { name: 'Execution Agent', desc: 'Invokes AI reasoning & encrypted OAuth integrations', color: 'from-emerald-500 to-teal-500', badge: 'EXECUTION' },
    { name: 'Validation Agent', desc: 'Ensures schema compliance and required data outputs', color: 'from-amber-500 to-orange-500', badge: 'VALIDATION' },
    { name: 'Recovery Agent', desc: 'Classifies failure taxonomy and applies exponential backoff', color: 'from-rose-500 to-pink-500', badge: 'RECOVERY' },
    { name: 'Monitoring Agent', desc: 'Streams live audit telemetry and websocket timeline events', color: 'from-purple-500 to-indigo-500', badge: 'MONITORING' },
  ];

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="h-20 border-b border-slate-800/80 px-6 lg:px-12 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-surface rounded-[11px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-white flex items-center gap-1.5 text-lg">
              Agentflow<span className="text-xs bg-indigo-500/20 text-indigo-300 font-mono px-1.5 py-0.5 rounded border border-indigo-500/30">AI</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">OPERATIONS SUITE</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-surface-elevated transition-colors"
          >
            Operator Sign In
          </Link>
          <Link
            href="/register"
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-1.5"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-6 lg:px-12 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-mono mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Multi-Agent Visual Operations Orchestration Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Turn Plain English Into <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
            Autonomous AI Workflows
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Describe an operational workflow in natural language. Agentflow AI generates visual DAGs, executes them through cooperating agent chains, integrates tools over encrypted OAuth, and streams live telemetry.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/register"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
          >
            <span>Start Building for Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-surface-elevated hover:bg-surface-highlight border border-slate-700 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center space-x-2"
          >
            <span>Explore Demo Console</span>
          </Link>
        </div>
      </section>

      {/* Interactive AI Prompt Simulator Preview */}
      <section className="py-8 px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-700/80 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              <span className="text-xs font-mono text-slate-400 ml-2">Prompt-to-Graph Generation Studio</span>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
              Deterministic & LLM Ready
            </span>
          </div>

          {/* Prompt input */}
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 pr-28 shadow-inner"
              />
              <Link
                href={`/login`}
                className="absolute right-2 top-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate</span>
              </Link>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {presetPrompts.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setPromptInput(preset)}
                  className="text-[11px] text-slate-400 hover:text-indigo-300 bg-surface-elevated hover:bg-indigo-950/40 border border-slate-800 rounded-lg px-2.5 py-1 transition-colors text-left"
                >
                  ⚡ {preset.substring(0, 48)}...
                </button>
              ))}
            </div>
          </div>

          {/* Interactive DAG Pipeline Flow */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-4">
              Generated Multi-Agent DAG Pipeline Simulation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="glass-card p-3 rounded-xl border border-indigo-500/40 bg-indigo-950/20">
                <span className="text-[10px] font-mono text-indigo-400 font-bold block">01. INGEST</span>
                <p className="text-xs font-bold text-white mt-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  Email / Webhook Trigger
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Ingests invoice payload</p>
              </div>

              <div className="glass-card p-3 rounded-xl border border-purple-500/40 bg-purple-950/20">
                <span className="text-[10px] font-mono text-purple-400 font-bold block">02. REASONING</span>
                <p className="text-xs font-bold text-white mt-1 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                  AI Data Extractor
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Parses amount & vendor</p>
              </div>

              <div className="glass-card p-3 rounded-xl border border-teal-500/40 bg-teal-950/20">
                <span className="text-[10px] font-mono text-teal-400 font-bold block">03. DATA SYNC</span>
                <p className="text-xs font-bold text-white mt-1 flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-teal-400" />
                  Google Sheets Row
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Appends to ledger</p>
              </div>

              <div className="glass-card p-3 rounded-xl border border-amber-500/40 bg-amber-950/20">
                <span className="text-[10px] font-mono text-amber-400 font-bold block">04. NOTIFY</span>
                <p className="text-xs font-bold text-white mt-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  Slack Channel Alert
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Broadcasts invoice status</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Agent Architecture Section */}
      <section className="py-16 px-6 lg:px-12 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            The 5-Stage Agentic Orchestration Chain
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            Every workflow execution is coordinated through specialized cooperating AI agents for deterministic reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {agentChain.map((agent, idx) => (
            <div
              key={idx}
              className="glass-card p-4 rounded-xl border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {agent.badge}
                </span>
                <h3 className="text-sm font-bold text-white mt-3">{agent.name}</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{agent.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                Step 0{idx + 1}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations Banner */}
      <section className="py-12 px-6 lg:px-12 max-w-5xl mx-auto w-full text-center border-t border-slate-800">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-6">
          Enterprise Integrations Encrypted at Rest
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
            <Mail className="w-5 h-5 text-red-400" />
            <span>Gmail</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <span>Slack</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
            <MessageCircle className="w-5 h-5 text-indigo-400" />
            <span>Discord</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
            <Table className="w-5 h-5 text-emerald-400" />
            <span>Google Sheets</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
            <Bot className="w-5 h-5 text-purple-400" />
            <span>OpenRouter & Gemini</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-800/80 px-6 text-center text-xs text-slate-400 font-mono">
        Agentflow AI • Autonomous Operations Platform • Single Source of Truth
      </footer>
    </div>
  );
}
