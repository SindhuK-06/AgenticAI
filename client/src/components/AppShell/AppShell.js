import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import {
  LayoutDashboard,
  GitMerge,
  Sparkles,
  PlayCircle,
  KeyRound,
  Settings,
  Bell,
  LogOut,
  User,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

export default function AppShell({ children, title = 'Operator Console' }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [systemHealth, setSystemHealth] = useState({ online: true, langGraph: 'available' });

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Workflows', href: '/workflows', icon: GitMerge },
    { label: 'AI Builder', href: '/workflows/builder', icon: Sparkles, highlight: true },
    { label: 'Executions', href: '/executions', icon: PlayCircle },
    { label: 'Integrations', href: '/integrations', icon: KeyRound },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  // Fetch notifications and system status
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications');
        const list = res.data || [];
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.isRead).length);
      } catch (e) {
        // ignore
      }
    };

    const fetchHealth = async () => {
      try {
        const res = await api.get('/health');
        setSystemHealth({
          online: true,
          langGraph: res.orchestration?.langGraph || 'available',
        });
      } catch (e) {
        setSystemHealth({ online: false, langGraph: 'offline' });
      }
    };

    fetchNotifs();
    fetchHealth();

    // Listen to real-time notifications via Socket.IO
    const socket = getSocket();
    if (socket) {
      const handleNewNotif = (notif) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((c) => c + 1);
      };
      socket.on('notification', handleNewNotif);
      socket.on('global_notification', handleNewNotif);

      return () => {
        socket.off('notification', handleNewNotif);
        socket.off('global_notification', handleNewNotif);
      };
    }
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      // ignore
    }
  };

  const markSingleRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen w-64 bg-surface border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo & Brand Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-surface rounded-[7px] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-white flex items-center gap-1.5 text-base">
                  Agentflow<span className="text-xs bg-indigo-500/20 text-indigo-300 font-mono px-1.5 py-0.5 rounded border border-indigo-500/30">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">OPERATIONS SUITE</span>
              </div>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href || (item.href !== '/dashboard' && router.pathname.startsWith(item.href) && item.href !== '/workflows');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.highlight && (
                    <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-purple-300 border border-purple-500/30">
                      AI Gen
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User / Engine Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-surface/40">
          <div className="bg-surface-elevated/60 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Multi-Agent</span>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-mono text-emerald-400">Active</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Planner • Executor • Validator • Recovery • Monitoring
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 px-4 md:px-8 bg-surface/80 backdrop-blur border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-surface-elevated"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-slate-400 hidden sm:inline">Platform</span>
              <ChevronRight className="w-4 h-4 text-slate-600 hidden sm:inline" />
              <h1 className="font-semibold text-white text-base tracking-tight">{title}</h1>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Quick Action Button */}
            <Link
              href="/workflows/builder"
              className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Workflow</span>
            </Link>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-surface animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Slideout Drawer / Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-elevated border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-3.5 border-b border-slate-700/80 flex items-center justify-between bg-surface/80">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-indigo-400" />
                      <span className="font-semibold text-xs tracking-wide text-white">EXECUTION NOTIFICATIONS</span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        No notifications yet. Workflow events will appear here.
                      </div>
                    ) : (
                      notifications.slice(0, 15).map((n) => (
                        <div
                          key={n._id || n.id}
                          onClick={() => markSingleRead(n._id || n.id)}
                          className={`p-3 text-xs transition-colors cursor-pointer hover:bg-surface/60 ${
                            !n.isRead ? 'bg-indigo-950/20' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-2.5">
                            {n.type === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : n.type === 'failure' ? (
                              <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            ) : n.type === 'recovery' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            ) : (
                              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-200 truncate">{n.title}</p>
                              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                                {new Date(n.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5"></span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-semibold text-slate-200 leading-tight">{user?.name || 'Operator'}</p>
                  <p className="text-[10px] text-slate-400 font-mono capitalize">{user?.role || 'operator'}</p>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-surface-elevated border border-slate-700/80 rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 border-b border-slate-800">
                    <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center space-x-2.5 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-surface"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Account Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                      router.push('/login');
                    }}
                    className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-surface text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
