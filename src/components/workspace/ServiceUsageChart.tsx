import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildUsageSeries, OTHER_LABEL } from "../../lib/data/serviceUsage";

/**
 * Deliveries per service, stacked by month.
 *
 * Stacked rather than one bar per service on purpose: with services as *series*
 * the colour carries identity across six months, which is what categorical
 * colour is for. A single-series bar over named categories would show the same
 * numbers with the axis already naming each bar, so per-bar colour there would
 * be decoration — and the palette's free channel is worth more than that.
 *
 * Three palette slots fall below 3:1 against white, so the relief rule applies:
 * the table view below is not optional garnish, it is how those series stay
 * readable. Identity is never colour-alone — legend, tooltip and table all name
 * the service.
 */

const SURFACE = "#ffffff";
const AXIS_INK = "#8a94a6";
const GRID = "#eef1f5";

interface TooltipEntry {
  name?: string | number;
  value?: string | number;
  color?: string;
}

const UsageTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, row) => sum + Number(row.value ?? 0), 0);
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg shadow-slate-900/10">
      <p className="text-[11px] font-semibold text-slate-900">{label}</p>
      <div className="mt-1.5 space-y-1">
        {payload
          .slice()
          .reverse()
          .map((row) => (
            <div key={String(row.name)} className="flex items-center gap-2 text-[11px]">
              <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: row.color }} />
              <span className="flex-1 text-slate-500">{row.name}</span>
              <span className="font-semibold text-slate-800">{Number(row.value).toLocaleString()}</span>
            </div>
          ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[11px]">
        <span className="text-slate-500">Total</span>
        <span className="font-semibold text-slate-900">{total.toLocaleString()}</span>
      </div>
    </div>
  );
};

export const ServiceUsageChart = ({ serviceNames }: { serviceNames: string[] }) => {
  const [showTable, setShowTable] = useState(false);
  const { data, series, colorFor, totals, months } = useMemo(
    () => buildUsageSeries(serviceNames),
    [serviceNames],
  );

  const grandTotal = totals.reduce((sum, t) => sum + t.total, 0);

  if (!serviceNames.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">
          Register a service and your delivery volume will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Deliveries by service</h3>
          <p className="mt-0.5 text-xs text-slate-400">Last six months · {grandTotal.toLocaleString()} total</p>
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          aria-pressed={showTable}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          <i className={`${showTable ? "ri-bar-chart-2-line" : "ri-table-line"} mr-1`} />
          {showTable ? "Chart" : "Table"}
        </button>
      </div>

      {/* Legend — always present for >= 2 series, so identity is never colour-alone. */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {totals.map((entry) => (
          <span key={entry.name} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: entry.color }} />
            <span className="text-[11px] font-medium text-slate-600">{entry.name}</span>
            <span className="text-[11px] text-slate-400">{entry.total.toLocaleString()}</span>
          </span>
        ))}
      </div>

      {showTable ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left">
            <caption className="sr-only">Deliveries by service, last six months</caption>
            <thead>
              <tr className="border-b border-slate-100">
                <th scope="col" className="py-2 pr-3 text-[11px] font-semibold text-slate-500">Service</th>
                {months.map((m) => (
                  <th key={m} scope="col" className="py-2 px-2 text-right text-[11px] font-semibold text-slate-500">
                    {m}
                  </th>
                ))}
                <th scope="col" className="py-2 pl-2 text-right text-[11px] font-semibold text-slate-500">Total</th>
              </tr>
            </thead>
            <tbody>
              {series.map((name) => (
                <tr key={name} className="border-b border-slate-50 last:border-b-0">
                  <th scope="row" className="py-2 pr-3 text-xs font-medium text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: colorFor(name) }} />
                      {name}
                    </span>
                  </th>
                  {data.map((row) => (
                    <td key={row.month} className="py-2 px-2 text-right text-xs text-slate-600">
                      {Number(row[name] ?? 0).toLocaleString()}
                    </td>
                  ))}
                  <td className="py-2 pl-2 text-right text-xs font-semibold text-slate-800">
                    {totals.find((t) => t.name === name)?.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }} barCategoryGap="28%">
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: AXIS_INK, fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: AXIS_INK, fontSize: 11 }}
                width={46}
              />
              <Tooltip cursor={{ fill: "rgba(15,23,42,0.04)" }} content={<UsageTooltip />} />
              {series.map((name, i) => (
                <Bar
                  key={name}
                  dataKey={name}
                  stackId="usage"
                  fill={colorFor(name)}
                  // 2px surface gap between stacked segments.
                  stroke={SURFACE}
                  strokeWidth={2}
                  // Only the topmost segment carries the rounded data-end.
                  radius={i === series.length - 1 ? [4, 4, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="mt-3 text-[10px] leading-4 text-slate-400">
        Service names are yours; the volumes are sample data until per-service metering ships.
      </p>
    </div>
  );
};
