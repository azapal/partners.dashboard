import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BRAND_NAVY } from "../../lib/brandColors";
import type { PlatformPriceKind, PlatformUsageDay } from "../../service/partnerService";

/**
 * The billing month, one bar per day.
 *
 * One measure (₦ that day) in two states, so one hue in two strengths rather
 * than two categorical colours: solid navy is what was really run up, a pale
 * tint of the same navy is what the estimate expects. They stack, because today
 * can hold both — what's been counted so far, and the quote-page day still to
 * be counted tonight. Identity is never tint-alone: the legend, the tooltip and
 * the table all say "so far" or "expected".
 */

const ACTUAL = BRAND_NAVY;
const EXPECTED = "#c9cfdd";
const SURFACE = "#ffffff";
const AXIS_INK = "#8a94a6";
const GRID = "#eef1f5";

const naira = (n: number) =>
  `₦${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const nairaShort = (n: number) =>
  n >= 1000 ? `₦${(n / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k` : `₦${Math.round(n)}`;

/** "2026-10-06" read as local midnight — `new Date()` alone reads it as UTC and can land on the 5th. */
const localDay = (iso: string) => new Date(`${iso}T00:00:00`);

interface Row {
  label: string;
  date: string;
  actual: number;
  expected: number;
  byKind: PlatformUsageDay["by_kind"];
}

interface TooltipProps {
  active?: boolean;
  payload?: { payload: Row }[];
  priceLabel: (kind: PlatformPriceKind) => string;
}

const DayTooltip = ({ active, payload, priceLabel }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const kinds = Object.entries(row.byKind) as [PlatformPriceKind, number][];
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg shadow-slate-900/10">
      <p className="text-[11px] font-semibold text-slate-900">
        {localDay(row.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
      </p>
      <div className="mt-1.5 space-y-1 text-[11px]">
        {kinds.map(([kind, amount]) => (
          <div key={kind} className="flex items-center justify-between gap-4">
            <span className="text-slate-500">{priceLabel(kind)}</span>
            <span className="font-semibold text-slate-800">{naira(amount)}</span>
          </div>
        ))}
        {row.actual > 0 && kinds.length > 1 && (
          <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-1">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="h-2 w-2 rounded-sm" style={{ background: ACTUAL }} />
              So far
            </span>
            <span className="font-semibold text-slate-900">{naira(row.actual)}</span>
          </div>
        )}
        {row.expected > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="h-2 w-2 rounded-sm" style={{ background: EXPECTED }} />
              Expected
            </span>
            <span className="font-semibold text-slate-700">{naira(row.expected)}</span>
          </div>
        )}
        {row.actual === 0 && row.expected === 0 && <p className="text-slate-400">Nothing charged</p>}
      </div>
    </div>
  );
};

export const DailyBillingChart = ({
  days,
  priceLabel,
}: {
  days: PlatformUsageDay[];
  priceLabel: (kind: PlatformPriceKind) => string;
}) => {
  const [showTable, setShowTable] = useState(false);

  const rows = useMemo<Row[]>(
    () =>
      days.map((d) => ({
        label: String(localDay(d.date).getDate()),
        date: d.date,
        actual: d.amount,
        expected: d.projected,
        byKind: d.by_kind,
      })),
    [days],
  );
  // The last day that isn't in the future is today (or the month's last day, once it's over).
  const todayLabel = rows.filter((_, i) => !days[i].is_future).at(-1)?.label;
  const hasExpected = rows.some((r) => r.expected > 0);
  const busiest = rows.reduce((max, r) => (r.actual > max.actual ? r : max), rows[0]);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Day by day</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            {busiest && busiest.actual > 0
              ? `Highest so far: ${naira(busiest.actual)} on the ${busiest.label}${ordinal(Number(busiest.label))}`
              : "Nothing charged yet this month"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          aria-pressed={showTable}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          <i className={`${showTable ? "ri-bar-chart-2-line" : "ri-table-line"} mr-1`} aria-hidden="true" />
          {showTable ? "Chart" : "Table"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-medium text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: ACTUAL }} />
          Run up so far
        </span>
        {hasExpected && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: EXPECTED }} />
            Expected, if nothing changes
          </span>
        )}
      </div>

      {showTable ? (
        <div className="mt-4 max-h-72 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Platform charges per day this month</caption>
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-slate-100">
                <th scope="col" className="py-2 pr-3 text-[11px] font-semibold text-slate-500">Day</th>
                <th scope="col" className="py-2 px-2 text-right text-[11px] font-semibold text-slate-500">So far</th>
                <th scope="col" className="py-2 pl-2 text-right text-[11px] font-semibold text-slate-500">Expected</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date} className="border-b border-slate-50 last:border-b-0">
                  <th scope="row" className="py-1.5 pr-3 text-xs font-medium text-slate-700">
                    {localDay(r.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </th>
                  <td className="py-1.5 px-2 text-right text-xs text-slate-700">{r.actual ? naira(r.actual) : "—"}</td>
                  <td className="py-1.5 pl-2 text-right text-xs text-slate-500">{r.expected ? naira(r.expected) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -8 }} barCategoryGap="18%">
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={8}
                tick={{ fill: AXIS_INK, fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={nairaShort}
                tick={{ fill: AXIS_INK, fontSize: 11 }}
              />
              {todayLabel && (
                <ReferenceLine
                  x={todayLabel}
                  stroke={AXIS_INK}
                  strokeDasharray="3 3"
                  label={{ value: "Today", position: "top", fill: AXIS_INK, fontSize: 10 }}
                />
              )}
              <Tooltip cursor={{ fill: "rgba(15,23,42,0.04)" }} content={<DayTooltip priceLabel={priceLabel} />} />
              <Bar dataKey="actual" stackId="day" fill={ACTUAL} stroke={SURFACE} strokeWidth={1} />
              <Bar dataKey="expected" stackId="day" fill={EXPECTED} stroke={SURFACE} strokeWidth={1} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};

const ordinal = (n: number) => {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return "th";
  return ["th", "st", "nd", "rd"][n % 10] ?? "th";
};
