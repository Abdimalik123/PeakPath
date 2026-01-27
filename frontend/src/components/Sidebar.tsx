import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('onboarding_complete');
    localStorage.removeItem('user');
    // Redirect to homepage
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/workouts', icon: Dumbbell, label: 'Workouts' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/habits', icon: Calendar, label: 'Habits' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8 border-b border-emerald-900/50">
        <Activity className="w-8 h-8 text-emerald-400" />
        <span className="text-2xl font-bold text-white">Elevate</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="px-4 py-6 border-t border-emerald-900/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900/90 backdrop-blur-sm border border-emerald-900/50 rounded-lg text-white"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900/50 backdrop-blur-md border-r border-emerald-900/50 h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-40 w-64 h-screen bg-slate-900/95 backdrop-blur-md border-r border-emerald-900/50 transform transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent />
      </aside>
    </>
  );
}
