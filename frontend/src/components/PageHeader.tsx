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
        <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
        {subtitle && (
          <p className="text-gray-400 text-sm uppercase tracking-wider">{subtitle}</p>
        )}
      </div>
      {actionButton && (
        <button
          onClick={actionButton.onClick}
          className="bg-cyan-500 hover:bg-cyan-400 text-[#121420] px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-2"
        >
          {actionButton.icon}
          {actionButton.label}
        </button>
      )}
    </div>
  );
}
