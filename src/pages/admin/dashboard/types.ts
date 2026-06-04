/**
 * UI Types - Admin Dashboard screen
 * Chart display models, label mappings
 */

/** Course status label mapping for chart display (UI-only) */
export interface CourseStatusChartItem {
  name: string;
  value: number;
}

/** Period label for charts (e.g. "T1", "T2") */
export type ChartPeriodLabel = string;
