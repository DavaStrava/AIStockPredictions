import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PerformanceChart, getWeekKey, getMonthKey, aggregateData } from '../PerformanceChart';
import { BenchmarkDataPoint } from '@/types/portfolio';

// Mock Recharts to avoid canvas/SVG issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="line-chart" data-count={data?.length ?? 0}>{children}</div>
  ),
  Line: ({ dataKey, strokeDasharray, strokeWidth }: { dataKey: string; strokeDasharray?: string; strokeWidth?: number }) => (
    <div data-testid={`line-${dataKey}`} data-dasharray={strokeDasharray ?? ''} data-strokewidth={strokeWidth} />
  ),
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ReferenceLine: () => <div data-testid="reference-line" />,
}));

function makePoint(date: string, portfolioReturn: number, spyReturn = 0, qqqReturn = 0): BenchmarkDataPoint {
  return {
    date,
    portfolioValue: 10000 + portfolioReturn * 100,
    portfolioReturn,
    spyReturn,
    qqqReturn,
  };
}

// Generate daily points for a range of dates
function generateDailyPoints(startDate: string, count: number): BenchmarkDataPoint[] {
  const points: BenchmarkDataPoint[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    points.push(makePoint(dateStr, i * 0.5, i * 0.3, i * 0.4));
  }
  return points;
}

describe('PerformanceChart', () => {
  describe('Aggregation helpers', () => {
    it('getWeekKey returns year-week format', () => {
      expect(getWeekKey('2025-01-01')).toBe('2025-W01');
      expect(getWeekKey('2025-01-08')).toMatch(/^2025-W0[12]$/);
      expect(getWeekKey('2025-06-15')).toMatch(/^2025-W\d{2}$/);
    });

    it('getMonthKey returns year-month format', () => {
      expect(getMonthKey('2025-01-15')).toBe('2025-01');
      expect(getMonthKey('2025-12-31')).toBe('2025-12');
      expect(getMonthKey('2025-06-01')).toBe('2025-06');
    });

    it('aggregateData with daily returns original data', () => {
      const data = generateDailyPoints('2025-01-01', 10);
      const result = aggregateData(data, 'daily');
      expect(result).toBe(data); // same reference
    });

    it('weekly aggregation reduces ~30 daily points', () => {
      const data = generateDailyPoints('2025-01-01', 30);
      const result = aggregateData(data, 'weekly');
      expect(result.length).toBeGreaterThanOrEqual(4);
      expect(result.length).toBeLessThanOrEqual(6);
    });

    it('monthly aggregation reduces ~90 daily points to ~3', () => {
      const data = generateDailyPoints('2025-01-01', 90);
      const result = aggregateData(data, 'monthly');
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result.length).toBeLessThanOrEqual(4);
    });

    it('aggregateData keeps last point per group', () => {
      const data = [
        makePoint('2025-01-01', 1),
        makePoint('2025-01-15', 2),
        makePoint('2025-01-31', 3),
        makePoint('2025-02-10', 4),
      ];
      const result = aggregateData(data, 'monthly');
      expect(result).toHaveLength(2);
      expect(result[0].portfolioReturn).toBe(3); // last Jan point
      expect(result[1].portfolioReturn).toBe(4); // last Feb point
    });

    it('aggregateData returns empty for empty input', () => {
      expect(aggregateData([], 'weekly')).toEqual([]);
    });
  });

  describe('Component rendering', () => {
    it('shows loading state', () => {
      render(<PerformanceChart data={[]} loading={true} />);
      expect(document.querySelector('.animate-pulse')).not.toBeNull();
    });

    it('shows empty state when no data', () => {
      render(<PerformanceChart data={[]} />);
      expect(screen.getByText(/no performance history/i)).toBeDefined();
    });

    it('renders all 3 lines enabled by default in percent mode', () => {
      const data = generateDailyPoints('2025-01-01', 10);
      render(<PerformanceChart data={data} />);

      expect(screen.getByTestId('line-portfolioReturn')).toBeDefined();
      expect(screen.getByTestId('line-spyReturn')).toBeDefined();
      expect(screen.getByTestId('line-qqqReturn')).toBeDefined();
    });

    it('portfolio line is thick solid, benchmarks are dashed', () => {
      const data = generateDailyPoints('2025-01-01', 10);
      render(<PerformanceChart data={data} />);

      const portfolio = screen.getByTestId('line-portfolioReturn');
      expect(portfolio.getAttribute('data-strokewidth')).toBe('3');
      expect(portfolio.getAttribute('data-dasharray')).toBe('');

      const spy = screen.getByTestId('line-spyReturn');
      expect(spy.getAttribute('data-strokewidth')).toBe('1.5');
      expect(spy.getAttribute('data-dasharray')).toBe('6 3');
    });

    it('shows YTD button in time range selector', () => {
      const data = generateDailyPoints('2025-01-01', 10);
      render(<PerformanceChart data={data} />);
      expect(screen.getByText('YTD')).toBeDefined();
    });

    it('shows aggregation buttons D, W, M', () => {
      const data = generateDailyPoints('2025-01-01', 10);
      render(<PerformanceChart data={data} />);
      expect(screen.getByText('D')).toBeDefined();
      expect(screen.getByText('W')).toBeDefined();
      expect(screen.getByText('M')).toBeDefined();
    });

    it('shows display mode toggle buttons', () => {
      const data = generateDailyPoints('2025-01-01', 10);
      render(<PerformanceChart data={data} />);
      expect(screen.getByText('%')).toBeDefined();
      expect(screen.getByText('$')).toBeDefined();
    });

    it('switches to absolute mode and renders portfolioValue line', () => {
      const data = generateDailyPoints('2025-01-01', 10);
      render(<PerformanceChart data={data} />);

      fireEvent.click(screen.getByText('$'));

      expect(screen.getByTestId('line-portfolioValue')).toBeDefined();
      expect(screen.queryByTestId('line-spyReturn')).toBeNull();
      expect(screen.queryByTestId('line-qqqReturn')).toBeNull();
    });

    it('hides benchmark toggles in absolute mode', () => {
      const data = generateDailyPoints('2025-01-01', 10);
      render(<PerformanceChart data={data} />);

      // In percent mode, benchmark toggles visible
      expect(screen.getByText('S&P 500')).toBeDefined();
      expect(screen.getByText('Nasdaq 100')).toBeDefined();

      // Switch to absolute mode
      fireEvent.click(screen.getByText('$'));

      expect(screen.queryByText('S&P 500')).toBeNull();
      expect(screen.queryByText('Nasdaq 100')).toBeNull();
    });

    it('zero reference line shown only in percent mode', () => {
      const data = generateDailyPoints('2025-01-01', 10);
      render(<PerformanceChart data={data} />);

      // In percent mode - reference line present
      expect(screen.getByTestId('reference-line')).toBeDefined();

      // Switch to absolute
      fireEvent.click(screen.getByText('$'));
      expect(screen.queryByTestId('reference-line')).toBeNull();
    });

    it('YTD filtering shows only current-year data', () => {
      const currentYear = new Date().getFullYear();
      const data = [
        makePoint(`${currentYear - 1}-06-15`, 5, 3, 4),
        makePoint(`${currentYear - 1}-12-31`, 8, 5, 6),
        makePoint(`${currentYear}-01-15`, 10, 7, 8),
        makePoint(`${currentYear}-02-01`, 12, 9, 10),
      ];

      render(<PerformanceChart data={data} />);

      // Click YTD button
      fireEvent.click(screen.getByText('YTD'));

      // The chart should now only have current year data
      const chart = screen.getByTestId('line-chart');
      expect(chart.getAttribute('data-count')).toBe('2');
    });
  });
});
