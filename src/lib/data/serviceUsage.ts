/**
 * Per-service delivery volume for the workspace usage chart.
 *
 * THE VOLUMES ARE SAMPLE DATA. `DashboardServiceStats` only carries
 * `total_active` — there is no per-service, per-month usage endpoint — so the
 * service *names* below are real (pulled from the partner's registered
 * services) while the counts are illustrative. The chart says so on its face.
 *
 * Colour is the validated categorical palette from the data-viz reference
 * instance, in its documented order. It passed the six checks against a white
 * surface (worst adjacent CVD ΔE 9.1, normal-vision ΔE 19.6). Three slots sit
 * below 3:1 contrast on white, which obliges the "relief rule" — hence the
 * table view on the chart. Do not re-order or substitute these without
 * re-running scripts/validate_palette.js.
 */

/** Categorical slots, fixed order, never cycled. */
export const SERIES_COLORS = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
];

/** Anything past the slot count folds here rather than inventing a 7th hue. */
export const OTHER_COLOR = "#8a94a6";
export const OTHER_LABEL = "Other";

export const MAX_SERIES = SERIES_COLORS.length;

export interface UsagePoint {
  month: string;
  [service: string]: string | number;
}

/**
 * Builds six months of plausible volume per service.
 *
 * Seeded off the service name so the shape is stable between renders — a chart
 * that reshuffles on every keystroke reads as broken, and this stands in for a
 * real series that would obviously be stable.
 */
const seededVolume = (seed: string, monthIndex: number) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  const base = 40 + (hash % 90);
  const drift = Math.round(Math.sin((hash % 7) + monthIndex * 0.8) * 18);
  const growth = monthIndex * (3 + (hash % 5));
  return Math.max(8, base + drift + growth);
};

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];

export const buildUsageSeries = (serviceNames: string[]) => {
  const named = serviceNames.slice(0, MAX_SERIES);
  const overflow = serviceNames.slice(MAX_SERIES);
  const series = [...named, ...(overflow.length ? [OTHER_LABEL] : [])];

  const data: UsagePoint[] = MONTHS.map((month, i) => {
    const row: UsagePoint = { month };
    named.forEach((name) => {
      row[name] = seededVolume(name, i);
    });
    if (overflow.length) {
      row[OTHER_LABEL] = overflow.reduce((sum, name) => sum + seededVolume(name, i), 0);
    }
    return row;
  });

  const colorFor = (name: string) =>
    name === OTHER_LABEL ? OTHER_COLOR : SERIES_COLORS[named.indexOf(name)] ?? OTHER_COLOR;

  const totals = series.map((name) => ({
    name,
    total: data.reduce((sum, row) => sum + Number(row[name] ?? 0), 0),
    color: colorFor(name),
  }));

  return { data, series, colorFor, totals, months: MONTHS };
};
