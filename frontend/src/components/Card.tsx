import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', interactive = false, onClick }: CardProps) {
  const baseClasses = 'bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden';
  const hoverClasses = interactive 
    ? 'cursor-pointer transition-all duration-200 hover:border-[var(--border-brand)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-brand)]' 
    : 'transition-all duration-200 hover:border-[var(--border-hover)]';
  
  return (
    <div 
      className={`${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`p-5 border-b border-[var(--border-default)] ${className}`}>
      {children}
    </div>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`p-5 ${className}`}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`p-5 border-t border-[var(--border-default)] ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-[var(--text-primary)] ${className}`}>
      {children}
    </h3>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <p className={`text-sm text-[var(--text-muted)] mt-1 ${className}`}>
      {children}
    </p>
  );
}
