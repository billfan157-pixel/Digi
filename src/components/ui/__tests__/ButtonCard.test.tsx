import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { LiquidProgress } from '@/components/LiquidProgress';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Uống nước</Button>);
    expect(screen.getByText('Uống nước')).toBeInTheDocument();
  });

  it('renders with loading state', () => {
    const { container } = render(<Button loading>Đang xử lý</Button>);
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders with icon', () => {
    const { container } = render(<Button icon={<span data-testid="test-icon">🔥</span>}>Click</Button>);
    expect(container.querySelector('[data-testid="test-icon"]')).toBeTruthy();
  });

  it('applies variant classes', () => {
    const { container } = render(<Button variant="danger">Xóa</Button>);
    expect(container.firstChild).toHaveClass('bg-rose-500/15');
  });
});

describe('Card', () => {
  it('renders children', () => {
    render(<Card><span>Nội dung</span></Card>);
    expect(screen.getByText('Nội dung')).toBeInTheDocument();
  });

  it('applies glass variant by default', () => {
    const { container } = render(<Card>Default</Card>);
    expect(container.firstChild).toHaveClass('glass-card');
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Custom</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('LiquidProgress', () => {
  it('renders with percentage 0', () => {
    const { container } = render(<LiquidProgress percentage={0} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with percentage 50', () => {
    const { container } = render(<LiquidProgress percentage={50} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with percentage 100', () => {
    const { container } = render(<LiquidProgress percentage={100} />);
    expect(container.firstChild).toBeTruthy();
  });
});
