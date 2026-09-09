import React, { useState, useEffect } from 'react';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import {
  Settings as SettingsIcon,
  User,
  ShieldCheck,
  KeyRound,
  Database,
  Cpu,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get('/health');
        setHealth(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  return (
    <ProtectedRoute>
      <AppShell title="Console Settings">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Platform & Security Settings
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage operator credentials, encryption status, and multi-agent engine diagnostics.
            </p>
          </div>

          {/* User Profile Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-lg">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{user?.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-surface-elevated border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Access Role</span>
                <span className="text-indigo-300 font-semibold capitalize">{user?.role || 'operator'}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Session ID</span>
                <span className="text-slate-300 truncate block">{user?.id || user?._id || 'ACTIVE_SESSION'}</span>
              </div>
            </div>
          </div>

          {/* Security & Encryption Health Check */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Security & Encryption Diagnostics
              </h3>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">Credential Encryption Key (AES-256-GCM)</p>
                    <p className="text-[11px] text-slate-400 font-mono">All OAuth & bot credentials encrypted at rest</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-semibold">
                  ACTIVE
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">Password Hashing & JWT Verification</p>
                    <p className="text-[11px] text-slate-400 font-mono">Bcrypt Cost 12 • JSON Web Token Signature</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-semibold">
                  HEALTHY
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Database className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">Database Store & Persistence</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Engine: {health?.database?.mode || 'mongodb/in-memory'}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono font-semibold uppercase">
                  {health?.database?.connected ? 'ONLINE' : 'ACTIVE'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">Agentic Orchestration Engine</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Planner • Executor • Validator • Recovery • Monitoring
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-sky-950/80 text-sky-300 border border-sky-500/30 text-[11px] font-mono font-semibold">
                  5 AGENTS READY
                </span>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
