import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';
import { Activity, Mail, Lock, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, isLoading, error: authError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setLocalError(res.error || 'Login failed');
    }
  };

  const handleQuickDemoLogin = async () => {
    setSubmitting(true);
    setLocalError('');
    // Try logging in with demo account, or auto-register if it doesn't exist yet
    const demoEmail = 'operator@agentflow.ai';
    const demoPass = 'password123!';
    let res = await login(demoEmail, demoPass);
    if (!res.success) {
      res = await register('Lead Operator', demoEmail, demoPass, 'operator');
    }
    setSubmitting(false);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setLocalError(res.error || 'Demo login failed');
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-3 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center">
              <Activity className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold tracking-tight text-white flex items-center gap-1.5 text-xl">
              Agentflow<span className="text-xs bg-indigo-500/20 text-indigo-300 font-mono px-1.5 py-0.5 rounded border border-indigo-500/30">AI</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">OPERATIONS SUITE</span>
          </div>
        </Link>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-white">
          Operator Console Sign In
        </h2>
        <p className="mt-2 text-xs text-slate-400">
          Enter credentials or launch the instant demo workspace.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="glass-panel py-8 px-6 sm:px-10 rounded-2xl border border-slate-700/80 shadow-2xl space-y-6">
          {/* Quick Demo Login Preset Button */}
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-emerald-600/30 hover:from-indigo-600/40 hover:via-purple-600/40 hover:to-emerald-600/40 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md group"
          >
            <Sparkles className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>1-Click Operator Demo Login</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-surface px-3 text-[11px] font-mono uppercase text-slate-400">or sign in with email</span>
          </div>

          {(localError || authError) && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{localError || authError}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="operator@agentflow.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-elevated border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-elevated border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400">
            Don't have an operator account?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
