import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Activity, LayoutDashboard, Dumbbell, Target, User, LogOut,
  Menu, X, Users, BarChart3, BookOpen, Library
} from 'lucide-react';
import { NotificationsBell } from './NotificationsBell';

interface NavigationProps {
  currentPage?: string;
  showAuthButtons?: boolean;
}

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/train', icon: Dumbbell, label: 'Workout' },
  { path: '/progress', icon: BarChart3, label: 'Stats' },
  { path: '/habits', icon: Target, label: 'Routines' },
  { path: '/community', icon: Users, label: 'Community' },
];

export function Navigation({ currentPage, showAuthButtons = false }: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (path: string) => {
    if (currentPage === path || location.pathname === path) return true;
    if (path === '/train' && (currentPage === '/workouts' || currentPage === '/active-workout' || location.pathname.startsWith('/train') || location.pathname === '/workouts' || location.pathname === '/active-workout')) return true;
    if (path === '/progress' && (currentPage === '/analytics' || currentPage === '/body-tracking' || currentPage === '/goals' || location.pathname === '/analytics' || location.pathname === '/body-tracking' || location.pathname === '/goals')) return true;
    return false;
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

  const initials = user ? `${(user.firstname?.[0] || '').toUpperCase()}${(user.lastname?.[0] || '').toUpperCase()}` : '';

  return (
    <>
      {/* ── MOBILE TOP BAR ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--bg-secondary)] border-b border-[var(--border-default)] h-14 flex items-center px-4">
        {/* Hamburger — left */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition text-[var(--text-secondary)] flex-shrink-0"
          aria-label="Open menu"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Logo — centered */}
        <Link to="/dashboard" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--brand-primary)] flex items-center justify-center">
            <Activity className="w-4 h-4 text-[var(--text-inverse)]" />
          </div>
          <span className="text-lg font-bold text-[var(--text-primary)]">PeakPath</span>
        </Link>

        {/* Right: Notifications + Profile */}
        <div className="flex items-center gap-1.5 ml-auto">
          <NotificationsBell />
          <Link
            to="/profile"
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-hover)] flex items-center justify-center text-[var(--text-inverse)] text-xs font-bold flex-shrink-0"
            aria-label="Profile"
          >
            {initials || <User className="w-4 h-4" />}
          </Link>
        </div>
      </div>

      {/* ── MOBILE SLIDE-OUT MENU ── */}
      {isMobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileOpen(false)} />
          <div className="fixed top-14 left-0 bottom-0 w-72 max-w-[85vw] bg-[var(--bg-secondary)] border-r border-[var(--border-default)] z-50 overflow-y-auto animate-in slide-in-from-left">
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      active
                        ? 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <Link
                to="/templates"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  location.pathname === '/templates'
                    ? 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span>Templates</span>
              </Link>
              <Link
                to="/exercises"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  location.pathname === '/exercises'
                    ? 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <Library className="w-5 h-5" />
                <span>Exercise Bank</span>
              </Link>

            </nav>
            <div className="p-4 border-t border-[var(--border-default)]">
              <button
                onClick={() => { setIsMobileOpen(false); handleLogout(); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--error)] hover:bg-[var(--error)]/10 transition w-full"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      <aside id="tour-nav-desktop" className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-default)]">
        {/* Logo — height matches top header */}
        <div className="h-16 px-5 flex items-center border-b border-[var(--border-default)] flex-shrink-0">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--brand-primary)] flex items-center justify-center">
              <Activity className="w-5 h-5 text-[var(--text-inverse)]" />
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)]">PeakPath</span>
          </Link>
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
                className={`pp-nav-link ${active ? 'pp-nav-link-active' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <Link
            to="/templates"
            className={`pp-nav-link ${location.pathname === '/templates' || currentPage === '/templates' ? 'pp-nav-link-active' : ''}`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Templates</span>
          </Link>
          <Link
            to="/exercises"
            className={`pp-nav-link ${location.pathname === '/exercises' || currentPage === '/exercises' ? 'pp-nav-link-active' : ''}`}
          >
            <Library className="w-5 h-5" />
            <span>Exercise Bank</span>
          </Link>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-[var(--border-default)] flex-shrink-0">
          <button
            onClick={handleLogout}
            className="pp-nav-link w-full text-left text-[var(--error)] hover:bg-[var(--error)]/10"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── DESKTOP TOP HEADER ── */}
      <header className="hidden lg:flex fixed top-0 left-64 right-0 z-30 h-16 bg-[var(--bg-secondary)] border-b border-[var(--border-default)] items-center px-6 gap-4">
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <NotificationsBell />
          <Link
            to="/profile"
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-hover)] flex items-center justify-center text-[var(--text-inverse)] text-sm font-bold hover:opacity-90 transition"
            aria-label="Profile"
            title="Profile"
          >
            {initials || <User className="w-4 h-4" />}
          </Link>
        </div>
      </header>
    </>
  );
}
