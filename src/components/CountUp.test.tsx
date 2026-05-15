import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CountUp from '@/components/CountUp';

describe('CountUp', () => {
  it('renders the initial value', () => {
    render(<CountUp value={100} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('formats number with Vietnamese locale', () => {
    render(<CountUp value={1000} />);
    expect(screen.getByText('1.000')).toBeInTheDocument();
  });
});
