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
    <div className={`bg-[#1c1f2e] border border-white/5 p-12 rounded-[2rem] text-center ${className}`}>
      <div className="w-16 h-16 text-gray-600 mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-500 mb-6">{description}</p>
      {actionButton && (
        <button
          onClick={actionButton.onClick}
          className="bg-cyan-500 hover:bg-cyan-400 text-[#121420] px-6 py-2 rounded-xl font-bold text-sm uppercase tracking-wider transition"
        >
          {actionButton.label}
        </button>
      )}
    </div>
  );
}
