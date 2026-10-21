import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useWorkspaceFeatureUsage } from "../../hooks/useDashboard";
import { OTHER_COLOR, OTHER_LABEL, SERIES_COLORS } from "../../lib/data/serviceUsage";

/**
 * The parts of Azapal this partner actually uses — six months of real activity,
 * stacked by feature.
 *
 * "Activity" is one unit across every feature: a thing created that month (an
 * order, a quote request, an invoice, a route, a team member…). That is what
 * makes stacking them honest. The *totals* — 40 rate cards, 3 live pages — are
 * different units, so they stay in the table and never share an axis.
 *
 * Colour follows the feature, not its rank: six features own the six validated
 * palette slots in a fixed order, so a partner's "Orders" is the same blue every
 * month whatever else they did. The other three fold into "Other" in the chart
 * (never a generated seventh hue) and get their own rows in the table.
 */

const SLOT_ORDER = ["orders", "quote_page", "invoices", "network", "stakeholders", "team"];

const colorFor = (key: string) => {
  const slot = SLOT_ORDER.indexOf(key);
  return slot === -1 ? OTHER_COLOR : SERIES_COLORS[slot];
};

const SURFACE = "#ffffff";
const AXIS_INK = "#8a94a6";
const GRID = "#eef1f5";

const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "short" });
};

interface TooltipEntry {
  name?: string | number;
  value?: string | number;
  color?: string;
}

const ActivityTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((r) => Number(r.value) > 0);
  const total = rows.reduce((sum, r) => sum + Number(r.value ?? 0), 0);
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg shadow-slate-900/10">
      <p className="text-[11px] font-semibold text-slate-900">{label}</p>
      {rows.length === 0 ? (
        <p className="mt-1 text-[11px] text-slate-400">No activity</p>
      ) : (
        <>
          <div className="mt-1.5 space-y-1">
            {rows
              .slice()
              .reverse()
              .map((r) => (
                <div key={String(r.name)} className="flex items-center gap-2 text-[11px]">
                  <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: r.color }} />
                  <span className="flex-1 text-slate-500">{r.name}</span>
                  <span className="font-semibold text-slate-800">{Number(r.value).toLocaleString()}</span>
                </div>
              ))}
          </div>
          <div className="mt-1.5 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[11px]">
            <span className="text-slate-500">Total</span>
            <span className="font-semibold text-slate-900">{total.toLocaleString()}</span>
          </div>
        </>
      )}
    </div>
  );
};

export const FeatureUsagePanel = () => {
  const navigate = useNavigate();
  const [showTable, setShowTable] = useState(false);
  const { data, isPending, isError } = useWorkspaceFeatureUsage();
  const months = data?.months ?? [];
  const features = data?.features ?? [];

  const untried = features.filter((f) => !f.in_use);
  const active = useMemo(() => features.filter((f) => f.in_use || f.monthly.some((n) => n > 0)), [features]);

  const { rows, series } = useMemo(() => {
    // Named series in palette order; everything else is "Other".
    const named = SLOT_ORDER.map((key) => active.find((f) => f.key === key)).filter(
      (f): f is NonNullable<typeof f> => !!f && f.monthly.some((n) => n > 0),
    );
    const others = active.filter((f) => !SLOT_ORDER.includes(f.key));
    const otherMonthly = months.map((_, i) => others.reduce((sum, f) => sum + (f.monthly[i] ?? 0), 0));

    const series = [
      ...named.map((f) => ({ name: f.label, color: colorFor(f.key), monthly: f.monthly })),
      ...(otherMonthly.some((n) => n > 0) ? [{ name: OTHER_LABEL, color: OTHER_COLOR, monthly: otherMonthly }] : []),
    ];
    const rows = months.map((m, i) => {
      const row: Record<string, string | number> = { month: monthLabel(m) };
      series.forEach((s) => {
        row[s.name] = s.monthly[i] ?? 0;
      });
      return row;
    });
    return { rows, series };
  }, [active, months]);

  const thisMonth = series.reduce((sum, s) => sum + (s.monthly.at(-1) ?? 0), 0);

  return (
    <div className="h-full rounded-2xl bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Activity by feature</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {isPending || isError
              ? "Last six months"
              : `Last six months · ${thisMonth.toLocaleString()} this month · ${active.length} of ${features.length} features in use`}
          </p>
        </div>
        {series.length > 0 && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            aria-pressed={showTable}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <i className={`${showTable ? "ri-bar-chart-2-line" : "ri-table-line"} mr-1`} aria-hidden="true" />
            {showTable ? "Chart" : "Table"}
          </button>
        )}
      </div>

      {isPending ? (
        <p className="py-16 text-center text-sm text-slate-400">Loading…</p>
      ) : isError ? (
        <p className="py-16 text-center text-sm text-slate-500">Couldn't load your activity just now.</p>
      ) : series.length === 0 ? (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          No activity yet. Pick something below to get started.
        </p>
      ) : (
        <>
          {/* Legend — always present for >= 2 series, so identity is never colour-alone. */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {series.map((s) => (
              <span key={s.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
                <span className="text-[11px] font-medium text-slate-600">{s.name}</span>
              </span>
            ))}
          </div>

          {showTable ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-left">
                <caption className="sr-only">Activity per feature, last six months</caption>
                <thead>
                  <tr className="border-b border-slate-100">
                    <th scope="col" className="py-2 pr-3 text-[11px] font-semibold text-slate-500">Feature</th>
                    {months.map((m) => (
                      <th key={m} scope="col" className="px-2 py-2 text-right text-[11px] font-semibold text-slate-500">
                        {monthLabel(m)}
                      </th>
                    ))}
                    <th scope="col" className="py-2 pl-2 text-right text-[11px] font-semibold text-slate-500">In total</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Every feature on its own row — the table is where "Other" comes apart. */}
                  {active.map((f) => (
                    <tr
                      key={f.key}
                      onClick={() => navigate(f.route)}
                      className="cursor-pointer border-b border-slate-50 last:border-b-0 hover:bg-slate-50"
                    >
                      <th scope="row" className="py-2 pr-3 text-xs font-medium text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: colorFor(f.key) }} />
                          {f.label}
                        </span>
                      </th>
                      {f.monthly.map((n, i) => (
                        <td key={months[i]} className="px-2 py-2 text-right text-xs text-slate-600">
                          {n.toLocaleString()}
                        </td>
                      ))}
                      <td className="py-2 pl-2 text-right text-xs font-semibold text-slate-800">
                        {f.count.toLocaleString()} <span className="font-normal text-slate-400">{f.unit}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -18 }} barCategoryGap="28%">
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: AXIS_INK, fontSize: 11 }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={46}
                    tick={{ fill: AXIS_INK, fontSize: 11 }}
                  />
                  <Tooltip cursor={{ fill: "rgba(15,23,42,0.04)" }} content={<ActivityTooltip />} />
                  {series.map((s, i) => (
                    <Bar
                      key={s.name}
                      dataKey={s.name}
                      stackId="activity"
                      fill={s.color}
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
        </>
      )}

      {untried.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Not tried yet</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {untried.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => navigate(f.route)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-brand hover:text-brand"
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
