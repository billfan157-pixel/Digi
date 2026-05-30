import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { LiquidProgress } from '@/components/LiquidProgress';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => (key === 'common.liquid_progress_aria' ? 'Tiến độ nước' : key),
  }),
}));

describe('LiquidProgress', () => {
  it('renders with 0%', () => {
    const { container } = render(<LiquidProgress percentage={0} />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toBeTruthy();
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('renders with 50%', () => {
    const { container } = render(<LiquidProgress percentage={50} />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toHaveAttribute('aria-valuenow', '50');
  });

  it('renders with 100%', () => {
    const { container } = render(<LiquidProgress percentage={100} />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
  });

  it('clamps percentage to 0-100', () => {
    const { container } = render(<LiquidProgress percentage={-10} />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('clamps percentage above 100', () => {
    const { container } = render(<LiquidProgress percentage={150} />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
  });

  it('has correct aria attributes', () => {
    const { container } = render(<LiquidProgress percentage={75} />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toHaveAttribute('aria-label', 'Tiến độ nước');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });
});
