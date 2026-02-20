import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Activity, 
  LayoutDashboard, 
  Dumbbell, 
  Target, 
  Calendar, 
  User, 
  LogOut,
  Menu,
  X,
  Trophy,
  BarChart3,
  Camera,
  Users,
  FileText
} from 'lucide-react';

interface NavigationProps {
  currentPage?: string;
  showAuthButtons?: boolean;
}

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/workouts', icon: Dumbbell, label: 'Workouts' },
  { path: '/habits', icon: Calendar, label: 'Habits' },
  { path: '/goals', icon: Target, label: 'Goals' },
  { path: '/achievements', icon: Trophy, label: 'Achievements' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/progress-photos', icon: Camera, label: 'Progress' },
  { path: '/social', icon: Users, label: 'Social' },
  { path: '/workout-templates', icon: FileText, label: 'Templates' },
  { path: '/profile', icon: User, label: 'Profile' }
];

export function Navigation({ currentPage, showAuthButtons = false }: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('onboarding_complete');
    localStorage.removeItem('user');
    navigate('/');
  };

  const isActive = (path: string) => {
    return currentPage === path || location.pathname === path;
  };

  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');

  // Public navigation (top nav for homepage/login pages)
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
              <Link 
                to="/login" 
                className="pp-btn-ghost"
              >
                Sign in
              </Link>
              <Link 
                to="/register" 
                className="pp-btn-primary"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Authenticated sidebar navigation
  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-md)]"
      >
        {isMobileOpen ? (
          <X className="w-5 h-5 text-[var(--text-primary)]" />
        ) : (
          <Menu className="w-5 h-5 text-[var(--text-primary)]" />
        )}
      </button>

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-default)] transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
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

          {/* Navigation */}
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

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
