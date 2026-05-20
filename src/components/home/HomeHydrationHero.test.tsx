import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HomeHydrationHero from './HomeHydrationHero';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { initial?: unknown; animate?: unknown; transition?: unknown; whileHover?: unknown }) => <div {...props}>{children}</div>,
    circle: ({ children, ...props }: React.SVGAttributes<SVGCircleElement> & { initial?: unknown; animate?: unknown; transition?: unknown }) => <circle {...props}>{children}</circle>,
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement> & { initial?: unknown; animate?: unknown; transition?: unknown }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../CountUp', () => ({
  default: ({ value }: { value: number }) => <span>{value}</span>,
}));

vi.mock('../DeviceComponents', () => ({
  BottleVisualizer: vi.fn(() => <div data-testid="bottle-visualizer" />),
  DeviceConnectionBadge: vi.fn(() => <div />),
  DeviceMetricsGrid: vi.fn(() => <div />),
}));

const baseProps = {
  isConnected: false,
  waterIntake: 1500,
  waterGoal: 2000,
  progress: 75,
  bottleCapacity: 500,
  onConnectBottle: vi.fn(),
};

describe('HomeHydrationHero', () => {
  it('renders disconnected state with ring and intake', () => {
    const { container } = render(<HomeHydrationHero {...baseProps} />);
    expect(screen.getByText('1500')).toBeInTheDocument();
    expect(screen.getByText('/ 2000 ml')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Bật DigiBottle Demo')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders connected state with BottleVisualizer', () => {
    render(<HomeHydrationHero {...baseProps} isConnected={true} metrics={{ currentVolume: 300 }} />);
    expect(screen.getByTestId('bottle-visualizer')).toBeInTheDocument();
    expect(screen.queryByText('/ 2000 ml')).not.toBeInTheDocument();
    expect(screen.queryByText('Bật DigiBottle Demo')).not.toBeInTheDocument();
  });

  it('renders connecting state', () => {
    render(<HomeHydrationHero {...baseProps} connectionState="connecting" />);
    expect(screen.getByText('Đang kết nối...')).toBeInTheDocument();
    expect(screen.queryByText('Bật DigiBottle Demo')).not.toBeInTheDocument();
  });

  it('renders reconnecting state', () => {
    render(<HomeHydrationHero {...baseProps} connectionState="reconnecting" />);
    expect(screen.getByText('Đang kết nối lại...')).toBeInTheDocument();
  });

  it('renders error state with retry button', () => {
    const onRetry = vi.fn();
    render(
      <HomeHydrationHero
        {...baseProps}
        connectionState="error"
        lastError="Bluetooth timeout"
        onRetryConnection={onRetry}
      />
    );
    expect(screen.getByText('Kết nối thất bại')).toBeInTheDocument();
    expect(screen.getByText('Bluetooth timeout')).toBeInTheDocument();
    const retryBtn = screen.getByText('Thử lại');
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onConnectBottle when connect button clicked', () => {
    const onConnect = vi.fn();
    render(<HomeHydrationHero {...baseProps} onConnectBottle={onConnect} />);
    const connectBtn = screen.getByText('Bật DigiBottle Demo');
    fireEvent.click(connectBtn);
    expect(onConnect).toHaveBeenCalledTimes(1);
  });
});
