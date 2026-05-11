import React from 'react';
import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'icon-btn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-gradient-to-r from-cyan-500 to-blue-500',
    'text-slate-950 font-bold',
    'hover:from-cyan-400 hover:to-blue-400',
    'active:scale-95',
    'shadow-[0_0_20px_rgba(6,182,212,0.4)]',
    'hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]',
  ].join(' '),
  ghost: [
    'bg-white/10 border border-white/20',
    'text-slate-200 font-semibold',
    'hover:bg-white/15',
    'active:scale-95',
  ].join(' '),
  danger: [
    'bg-rose-500/15 border border-rose-500/30',
    'text-rose-400 font-semibold',
    'hover:bg-rose-500/25',
    'active:scale-90',
  ].join(' '),
  'icon-btn': [
    'w-11 h-11 rounded-xl',
    'bg-cyan-500/15 border border-cyan-500/30',
    'text-cyan-400',
    'hover:bg-cyan-500/25',
    'active:scale-90',
    'flex items-center justify-center',
  ].join(' '),
};

const sizeStyles = {
  sm: 'px-3 py-2 text-xs rounded-xl',
  md: 'px-5 py-3 text-sm rounded-2xl',
  lg: 'px-6 py-4 text-base rounded-2xl',
};

export default React.memo(function Button({
  variant = 'primary',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'transition-all duration-200',
        variant !== 'icon-btn' && sizeStyles.md,
        variantStyles[variant],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {children}
        </span>
      ) : (
        <span className="flex items-center gap-2 justify-center">
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </span>
      )}
    </button>
  );
