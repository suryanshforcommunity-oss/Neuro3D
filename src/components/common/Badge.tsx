import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'violet' | 'amber' | 'emerald' | 'rose' | 'slate' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    cyan: 'bg-sky-50 text-sky-700 border-sky-200/80 font-semibold',
    violet: 'bg-violet-50 text-violet-700 border-violet-200/80 font-semibold',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/80 font-semibold',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-semibold',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80 font-semibold',
    slate: 'bg-slate-100 text-slate-700 border-slate-200 font-semibold',
    outline: 'bg-transparent text-slate-600 border-slate-300',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 tracking-wider uppercase font-semibold font-mono',
    md: 'text-xs px-2.5 py-1 tracking-wide font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
