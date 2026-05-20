import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AnimatedCounter } from '@/components/AnimatedCounter';

vi.mock('framer-motion', () => ({
  motion: { span: ({ children, className }: { children: React.ReactNode; className?: string }) => <span className={className}>{children}</span> },
  useSpring: () => ({ set: vi.fn() }),
  useTransform: () => '100',
}));

describe('AnimatedCounter', () => {
  it('renders with a numeric value', () => {
    const { container } = render(<AnimatedCounter value={100} />);
    expect(container.querySelector('span')).toBeTruthy();
  });

  it('accepts custom className', () => {
    const { container } = render(<AnimatedCounter value={50} className="text-lg" />);
    expect(container.querySelector('span')).toHaveClass('text-lg');
  });
});
