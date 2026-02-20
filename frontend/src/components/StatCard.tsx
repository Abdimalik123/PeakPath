import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: 'green' | 'blue' | 'purple' | 'orange' | 'red';
  badge?: string;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

const iconColorClasses = {
  green: 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]',
  blue: 'bg-[var(--brand-secondary)]/15 text-[var(--brand-secondary)]',
  purple: 'bg-purple-500/15 text-purple-400',
  orange: 'bg-orange-500/15 text-orange-400',
  red: 'bg-[var(--error)]/15 text-[var(--error)]',
};

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = 'green',
  badge,
  trend,
  className = '' 
}: StatCardProps) {
  return (
    <div className={`bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5 transition-all duration-200 hover:border-[var(--border-hover)] ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-[var(--radius-md)] ${iconColorClasses[iconColor]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <span className="pp-badge pp-badge-success">
            {badge}
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
          {title}
        </p>
        <p className="text-2xl font-bold text-[var(--text-primary)]">
          {value}
        </p>
      </div>
      
      {trend && (
        <div className="mt-3 flex items-center gap-2">
          <span className={`text-xs font-medium ${trend.value >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
  className?: string;
}

export function StatsGrid({ children, className = '' }: StatsGridProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {children}
    </div>
  );
}
