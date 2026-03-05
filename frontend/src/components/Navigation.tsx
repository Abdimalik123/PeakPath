import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Activity, LayoutDashboard, Dumbbell, Target, Calendar, User, LogOut,
  Menu, X, Trophy, BarChart3, Camera, Users, FileText, Bell,
  Heart, MessageCircle, UserPlus, Check, Award, Flame, TrendingUp, CalendarDays
} from 'lucide-react';
import client from '../api/client';
import { NotificationsBell } from './NotificationsBell';

interface NotificationItem {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  priority: string;
  delivered_at: string | null;
}

interface NavigationProps {
  currentPage?: string;
  showAuthButtons?: boolean;
}

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/workouts', icon: Dumbbell, label: 'Workouts' },
  { path: '/cardio', icon: TrendingUp, label: 'Cardio' },
  { path: '/habits', icon: Calendar, label: 'Habits' },
  { path: '/goals', icon: Target, label: 'Goals' },
  { path: '/programs', icon: FileText, label: 'Programs' },
  { path: '/schedule', icon: CalendarDays, label: 'Schedule' },
  { path: '/challenges', icon: Trophy, label: 'Challenges' },
  { path: '/achievements', icon: Award, label: 'Achievements' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/progress-photos', icon: Camera, label: 'Progress' },
  { path: '/social', icon: Users, label: 'Social' },
  { path: '/groups', icon: UserPlus, label: 'Groups' },
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/workout-templates', icon: Bell, label: 'Templates' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function Navigation({ currentPage, showAuthButtons = false }: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (path: string) => currentPage === path || location.pathname === path;

  // Load notifications on mount and every 30s
  useEffect(() => {
    if (!isAuthenticated || showAuthButtons) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, showAuthButtons]);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await client.get('/notifications/unread-count');
      setUnreadCount(res.data.unread_count || 0);
    } catch {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await client.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch {}
  };

  const handleBellClick = async () => {
    if (!showNotifications) {
      await fetchNotifications();
    }
    setShowNotifications((prev) => !prev);
  };

  const markAsRead = async (id: number) => {
    try {
      await client.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await client.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'friend_request': return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'friend_accepted': return <Check className="w-4 h-4 text-green-400" />;
      case 'like': return <Heart className="w-4 h-4 text-red-400" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-purple-400" />;
      case 'achievement': return <Award className="w-4 h-4 text-yellow-400" />;
      case 'goal': return <Target className="w-4 h-4 text-purple-400" />;
      case 'level_up': return <TrendingUp className="w-4 h-4 text-[var(--brand-primary)]" />;
      default: return <Bell className="w-4 h-4 text-[var(--text-muted)]" />;
    }
  };

  const formatNotifTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (showAuthButtons) {
    return (
      <nav className="sticky top-0 z-50 bg-[var(--bg-secondary)] border-b border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--brand-primary)] flex items-center justify-center">
                <Activity className="w-5 h-5 text-[var(--text-inverse)]" />
              </div>
              <span className="text-xl font-bold text-[var(--text-primary)]">PeakPath</span>
            </Link>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link to="/dashboard" className="pp-btn-primary">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="pp-btn-ghost">Sign in</Link>
                  <Link to="/register" className="pp-btn-primary">Get started</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-6 h-6 text-[var(--text-primary)]" /> : <Menu className="w-6 h-6 text-[var(--text-primary)]" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-default)] transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-[var(--border-default)]">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--brand-primary)] flex items-center justify-center">
                <Activity className="w-5 h-5 text-[var(--text-inverse)]" />
              </div>
              <span className="text-lg font-bold text-[var(--text-primary)]">PeakPath</span>
            </Link>
          </div>

          {/* Notifications button + panel */}
          <div className="px-3 py-2">
            <NotificationsBell />
          </div>
          <div className="px-3 py-2 relative hidden" ref={notifRef}>
            <button
              onClick={handleBellClick}
              className="pp-nav-link w-full text-left"
            >
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-auto bg-[var(--brand-primary)] text-[var(--text-inverse)] text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown panel */}
            {showNotifications && (
              <div className="absolute left-full top-0 ml-2 w-80 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl shadow-2xl z-50 overflow-hidden">
                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
                  <h3 className="font-bold text-[var(--text-primary)] text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-[var(--brand-primary)] hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notification list */}
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)] opacity-40" />
                      <p className="text-sm text-[var(--text-muted)]">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => !n.is_read && markAsRead(n.id)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] transition border-b border-[var(--border-default)]/50 last:border-0 ${!n.is_read ? 'bg-[var(--brand-primary)]/5' : ''}`}
                      >
                        <div className="mt-0.5 flex-shrink-0">{getNotifIcon(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${n.is_read ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)] font-medium'}`}>
                            {n.message}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatNotifTime(n.delivered_at)}</p>
                        </div>
                        {!n.is_read && (
                          <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)] flex-shrink-0 mt-1.5" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Nav links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`pp-nav-link ${active ? 'pp-nav-link-active' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-[var(--border-default)]">
            <button
              onClick={handleLogout}
              className="pp-nav-link w-full text-left text-[var(--error)] hover:bg-[var(--error)]/10"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}
    </>
  );
}