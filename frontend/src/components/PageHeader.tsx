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
    <div className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{title}</h2>
        {subtitle && (
          <p className="text-[var(--text-muted)] text-sm uppercase tracking-wider">{subtitle}</p>
        )}
      </div>
      {actionButton && (
        <button
          onClick={actionButton.onClick}
          className="pp-btn-primary flex items-center gap-2"
        >
          {actionButton.icon}
          {actionButton.label}
        </button>
      )}
    </div>
  );
}
