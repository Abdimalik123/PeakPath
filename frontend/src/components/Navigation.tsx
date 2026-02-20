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
  X
} from 'lucide-react';

interface NavigationProps {
  currentPage?: string;
  showAuthButtons?: boolean;
  mode?: 'topnav' | 'sidebar';
}

export function Navigation({ currentPage, showAuthButtons = false, mode = 'topnav' }: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('onboarding_complete');
    localStorage.removeItem('user');
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/workouts', icon: Dumbbell, label: 'Workouts' },
    { path: '/habits', icon: Calendar, label: 'Habits' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/achievements', icon: Activity, label: 'Achievements' },
    { path: '/analytics', icon: Activity, label: 'Analytics' },
    { path: '/progress-photos', icon: Activity, label: 'Progress Photos' },
    { path: '/social', icon: Activity, label: 'Social' },
    { path: '/workout-templates', icon: Activity, label: 'Templates' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  const isActive = (path: string) => {
    return currentPage === path || location.pathname === path;
  };

  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');

  if (mode === 'sidebar') {
    return (
      <>
        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900/90 backdrop-blur-sm rounded-lg border border-emerald-500/20"
        >
          {isMobileOpen ? <X className="w-6 h-6 text-emerald-400" /> : <Menu className="w-6 h-6 text-emerald-400" />}
        </button>

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-emerald-500/20 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-emerald-500/20">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-slate-900" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">LifeTracker</h1>
                  <p className="text-xs text-emerald-400">Fitness Dashboard</p>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      active
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-emerald-500/20">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile overlay */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </>
    );
  }

  // Top navigation mode
  return (
    <nav className="border-b border-white/5 bg-[#121420]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
              <h1 className="text-xl font-bold tracking-tight text-white">LIFE<span className="text-cyan-400">TRACKER</span></h1>
            </Link>
            
            {!showAuthButtons && (
              <div className="hidden md:flex items-center gap-6">
                {navItems.slice(0, 4).map((item) => (
                  <Link 
                    key={item.path}
                    to={item.path}
                    className={`font-medium text-sm transition uppercase ${
                      isActive(item.path)
                        ? 'text-cyan-400 border-b-2 border-cyan-400 pb-1' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {showAuthButtons ? (
              <>
                <Link to="/login" className="text-sm font-medium hover:text-cyan-400 transition">Login</Link>
                <Link 
                  to="/register" 
                  className="bg-cyan-500 hover:bg-cyan-400 text-[#121420] px-6 py-2 rounded-full text-sm font-bold transition shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/profile" 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)] ${
                    isActive('/profile')
                      ? 'bg-cyan-400 text-[#121420]'
                      : 'bg-gradient-to-br from-cyan-400 to-blue-500 text-[#121420]'
                  }`}
                >
                  U
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition text-red-400"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
