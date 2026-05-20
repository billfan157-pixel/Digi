import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import CountUp from '@/components/CountUp';

describe('CountUp', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the initial value', () => {
    render(<CountUp value={100} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('formats number with Vietnamese locale', () => {
    render(<CountUp value={1000} />);
    expect(screen.getByText('1.000')).toBeInTheDocument();
  });

  it('animates from previous value to new value', () => {
    vi.useFakeTimers();
    const { rerender } = render(<CountUp value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();

    rerender(<CountUp value={100} />);

    // Advance animation by a few frames
    act(() => { vi.advanceTimersByTime(200); });
    // Should be somewhere between 0 and 100
    const text = screen.getByText(/^\d+$/);
    const num = parseInt(text.textContent || '0', 10);
    expect(num).toBeGreaterThan(0);

    // Advance to completion
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
