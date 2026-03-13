import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] p-4 sm:p-8 ${maxWidthClasses[maxWidth]} w-full max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-2xl font-bold text-[var(--text-primary)]">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] transition"
          >
            <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
