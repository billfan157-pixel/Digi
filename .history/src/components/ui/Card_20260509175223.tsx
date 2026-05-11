import React from 'react';
import { clsx } from 'clsx';

type CardVariant = 'glass' | 'glass-strong' | 'glass-control' | 'glass-stat';

interface CardProps {
  variant?: CardVariant;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  padding?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  'glass': 'glass-card',
  'glass-strong': 'glass-card-strong',
  'glass-control': 'glass-control',
  'glass-stat': 'glass-stat',
};

export default React.memo(function Card({
  variant = 'glass',
  className,
  children,
  onClick,
  padding = true,
}: CardProps) {
  return (
    <div
      className={clsx(
        variantClasses[variant],
        padding && 'p-5',
        onClick && 'cursor-pointer active:scale-[0.98] transition-transform',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {children}
    </div>
  );
});