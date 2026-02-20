import React from 'react';

interface FormInputProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'time' | 'textarea' | 'select';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
  min?: string | number;
  max?: string | number;
  className?: string;
  icon?: React.ReactNode;
}

export function FormInput({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required = false,
  options = [],
  rows = 3,
  min,
  max,
  className = '',
  icon
}: FormInputProps) {
  const baseInputClass = `w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/20 transition-all duration-200 ${icon ? 'pl-12' : ''}`;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputClass} resize-none`}
            placeholder={placeholder}
            required={required}
            rows={rows}
          />
        );
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
            required={required}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
            placeholder={placeholder}
            required={required}
            min={min}
            max={max}
          />
        );
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            {icon}
          </div>
        )}
        {renderInput()}
      </div>
    </div>
  );
}
