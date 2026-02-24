import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, actionButton, className = "" }: EmptyStateProps) {
  return (
    <div className={`p-12 text-center ${className}`}>
      <div className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-[var(--text-muted)] mb-6">{description}</p>
      {actionButton && (
        <button
          onClick={actionButton.onClick}
          className="pp-btn-primary"
        >
          {actionButton.label}
        </button>
      )}
    </div>
  );
}
