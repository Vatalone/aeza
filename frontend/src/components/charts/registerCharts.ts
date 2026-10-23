/**
 * Registers only the Chart.js pieces the app uses, so the bundle stays small
 * (Chart.js is tree-shakeable). Import this module once before any chart.
 */
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
);

Chart.defaults.font.family =
  "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#6b7280';
Chart.defaults.borderColor = '#e5e7eb';

/** Flat palette that matches the Tailwind theme (no gradients). */
export const CHART_COLORS = {
  paid: '#16a34a',
  remaining: '#ca8a04',
  overdue: '#dc2626',
  accent: '#2563eb',
  grid: '#f3f4f6',
  muted: '#9ca3af',
} as const;

export function formatChartNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value);
}
