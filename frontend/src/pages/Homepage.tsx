import React from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Card, CardContent } from '../components/Card';
import { Zap, CheckCircle, TrendingUp, BarChart3 } from 'lucide-react';

const HomePage: React.FC = () => {
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');

  const features = [
    {
      icon: Zap,
      title: 'Workout Analytics',
      description: 'Precision logging for every rep. View progress through interactive heatmaps and progress charts.',
      color: 'green' as const,
    },
    {
      icon: CheckCircle,
      title: 'Daily Rituals',
      description: 'Build unbreakable habits with visual streak tracking and automated smart-reminders.',
      color: 'blue' as const,
    },
    {
      icon: TrendingUp,
      title: 'Milestones',
      description: 'Set complex multi-stage goals and watch your progress unfold in high-fidelity charts.',
      color: 'purple' as const,
    },
    {
      icon: BarChart3,
      title: 'Performance Dashboard',
      description: 'An all-in-one command center. Filter your bio-data by day, week, or year.',
      color: 'orange' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation showAuthButtons={true} />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-[var(--text-primary)] mb-6">
            Track. <span className="text-gradient-brand">Analyze.</span> Conquer.
          </h1>
          <p className="text-lg text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto">
            A high-performance interface for monitoring your physical evolution. 
            Real-time analytics for the modern athlete.
          </p>
          <div className="flex justify-center gap-4">
            {hasToken ? (
              <Link to="/dashboard" className="pp-btn-primary text-base px-8 py-4">
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="pp-btn-primary text-base px-8 py-4">
                  Start Tracking
                </Link>
                <Link to="/login" className="pp-btn-secondary text-base px-8 py-4">
                  View Demo
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} interactive className="h-full">
                <CardContent className="flex flex-col h-full">
                  <div className={`p-3 rounded-[var(--radius-md)] w-fit mb-4 ${
                    feature.color === 'green' ? 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]' :
                    feature.color === 'blue' ? 'bg-[var(--brand-secondary)]/15 text-[var(--brand-secondary)]' :
                    feature.color === 'purple' ? 'bg-purple-500/15 text-purple-400' :
                    'bg-orange-500/15 text-orange-400'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-grow">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-default)] bg-[var(--bg-secondary)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--brand-primary)] flex items-center justify-center">
                <Zap className="w-4 h-4 text-[var(--text-inverse)]" />
              </div>
              <span className="text-lg font-bold text-[var(--text-primary)]">PeakPath</span>
            </div>
            <div className="flex gap-6 text-sm text-[var(--text-muted)]">
              <a href="#" className="hover:text-[var(--text-primary)] transition">Privacy</a>
              <a href="#" className="hover:text-[var(--text-primary)] transition">Terms</a>
              <a href="#" className="hover:text-[var(--text-primary)] transition">Support</a>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              © 2026 PeakPath. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;