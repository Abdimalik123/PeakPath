import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export function PageHeader({ title, subtitle, actionButton }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-1">{title}</h2>
        {subtitle && (
          <p className="text-[var(--text-muted)] text-sm">{subtitle}</p>
        )}
      </div>
      {actionButton && (
        <button
          onClick={actionButton.onClick}
          className="pp-btn-primary flex items-center gap-2 self-start sm:self-auto whitespace-nowrap"
        >
          {actionButton.icon}
          {actionButton.label}
        </button>
      )}
    </div>
  );
}
