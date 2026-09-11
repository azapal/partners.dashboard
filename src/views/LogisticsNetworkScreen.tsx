import { useMemo, useState } from "react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { AddRouteModal } from "../components/modal/AddRouteModal";
import { BudgetTargetPreviewModal } from "../components/modal/BudgetTargetPreviewModal";
import { DefaultModal } from "../components/modal/DefaultModal";
import { NetworkMap } from "../components/logistics/NetworkMap";
import { useGetPairableGroups } from "../hooks/useLogistics";
import { useGetPairingRoutes, useDeletePairingRoute } from "../hooks/usePairingRoutes";
import type { PairableGroup, PairingRoute } from "../service/partnerService";
import { formatStatusLabel, statusDotClass } from "../lib/orderStatus";
import { FilterPopover } from "../components/filters/FilterPopover";

type MainTab = "routes" | "paired";
type OpenFilter = "All" | "Open" | "Closed";

const FREQUENCY_LABELS: Record<string, string> = {
  one_time: "One-time",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function formatAmount(n: number | null): string {
  return n != null ? `₦${n.toLocaleString()}` : "—";
}

const OpenBadge = ({ isOpen }: { isOpen: boolean }) => (
  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isOpen ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
    {isOpen ? "Open for joining" : "Closed"}
  </span>
);

export const LogisticsNetworkScreen = () => {
  const { data: routes = [], isLoading: routesLoading } = useGetPairingRoutes();
  const deleteRoute = useDeletePairingRoute();

  const [mainTab, setMainTab] = useState<MainTab>("routes");

  const [search, setSearch] = useState("");
  const [openFilter, setOpenFilter] = useState<OpenFilter>("All");
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [editRoute, setEditRoute] = useState<PairingRoute | null>(null);
  const [activeRoute, setActiveRoute] = useState<PairingRoute | null>(null);
  const [previewRoute, setPreviewRoute] = useState<PairingRoute | null>(null);

  const { data: pairableGroups = [], isLoading: pairableLoading } = useGetPairableGroups();

  const filteredRoutes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return routes.filter((r) => {
      const matchesSearch =
        !query ||
        [r.partner_name, r.origin_state, r.destination_state, r.cargo_type]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesOpen =
        openFilter === "All" ||
        (openFilter === "Open" ? r.is_open_for_joining : !r.is_open_for_joining);
      return matchesSearch && matchesOpen;
    });
  }, [routes, search, openFilter]);

  const pairableStats = useMemo(() => {
    const allOrders = pairableGroups.flatMap((g) => g.orders);
    const pricedOrders = allOrders.filter((o) => o.total_amount != null);
    const totalValue = pricedOrders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
    return {
      orderCount: pairableGroups.reduce((sum, g) => sum + g.order_count, 0),
      regionCount: pairableGroups.length,
      // Most seeded orders have no price yet — say so rather than showing a
      // misleading ₦0 when nothing is actually priced.
      valueLabel: pricedOrders.length > 0 ? formatAmount(totalValue) : "Not yet priced",
    };
  }, [pairableGroups]);

  const handleDelete = (route: PairingRoute) => {
    if (window.confirm("Delete this route? This cannot be undone.")) {
      deleteRoute.mutate(route.id, { onSuccess: () => setActiveRoute(null) });
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full flex flex-col gap-5 overflow-y-auto">
        {/* Network map */}
        <NetworkMap />

        {/* Overview stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "My Routes", value: routes.length, icon: "ri-route-line", color: "text-gray-700", bg: "bg-gray-100" },
            { label: "Pairable Orders", value: pairableStats.orderCount, icon: "ri-shuffle-line", color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Regions Clustered", value: pairableStats.regionCount, icon: "ri-map-pin-line", color: "text-brand", bg: "bg-orange-50" },
            { label: "Pairable Value", value: pairableStats.valueLabel, icon: "ri-money-dollar-circle-line", color: "text-green-600", bg: "bg-green-50" },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <i className={`${icon} text-lg ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400 font-medium truncate">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main tabs */}
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit shadow-sm">
          <button
            onClick={() => setMainTab("routes")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mainTab === "routes" ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <i className="ri-route-line text-base" />
            My Routes
          </button>
          <button
            onClick={() => setMainTab("paired")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mainTab === "paired" ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <i className="ri-shuffle-line text-base" />
            Paired Deliveries
          </button>
        </div>

        {mainTab === "routes" ? (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-xs">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search routes…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <FilterPopover activeCount={openFilter !== "All" ? 1 : 0} panelClassName="w-44">
                  {(close) => (
                    <div className="flex flex-col gap-1">
                      {(["All", "Open", "Closed"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => { setOpenFilter(s); close(); }}
                          className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            openFilter === s
                              ? "bg-orange-50 text-brand"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </FilterPopover>
                <button
                  onClick={() => setShowAddRoute(true)}
                  className="flex items-center gap-2 h-11 bg-brand text-white px-5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors"
                >
                  <i className="ri-add-line text-base" />
                  Add Route
                </button>
              </div>
            </div>

            {/* Routes table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-orange-50/60">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Route</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cargo</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Frequency</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Budget</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routesLoading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-14 text-gray-400 text-sm">Loading…</td>
                      </tr>
                    ) : filteredRoutes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-14 text-gray-400 text-sm">
                          No routes found
                        </td>
                      </tr>
                    ) : (
                      filteredRoutes.map((route) => (
                        <tr
                          key={route.id}
                          onClick={() => setActiveRoute(route)}
                          className="border-b border-gray-50 hover:bg-orange-50/40 cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 text-sm">
                              <span className="font-medium text-gray-800">{route.origin_state}</span>
                              <i className="ri-arrow-right-line text-gray-300" />
                              <span className="font-medium text-gray-800">{route.destination_state}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 text-sm">{route.cargo_type}</td>
                          <td className="px-4 py-3.5 text-gray-600 text-sm">{FREQUENCY_LABELS[route.frequency] ?? route.frequency}</td>
                          <td className="px-4 py-3.5 text-gray-600 text-sm">{formatDate(route.preferred_date)}</td>
                          <td className="px-4 py-3.5 text-gray-600 text-sm">
                            {formatAmount(route.min_budget)}–{formatAmount(route.max_budget)}
                          </td>
                          <td className="px-4 py-3.5">
                            <OpenBadge isOpen={route.is_open_for_joining} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-50">
                {routesLoading ? (
                  <p className="text-center py-14 text-gray-400 text-sm">Loading…</p>
                ) : filteredRoutes.length === 0 ? (
                  <p className="text-center py-14 text-gray-400 text-sm">No routes found</p>
                ) : (
                  filteredRoutes.map((route) => (
                    <div
                      key={route.id}
                      onClick={() => setActiveRoute(route)}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-orange-50/40 cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                        <i className="ri-route-line text-lg text-brand" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate flex items-center gap-1">
                          {route.origin_state} <i className="ri-arrow-right-line text-gray-300 text-xs" /> {route.destination_state}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{route.cargo_type} · {formatDate(route.preferred_date)}</p>
                      </div>
                      <OpenBadge isOpen={route.is_open_for_joining} />
                    </div>
                  ))
                )}
              </div>

              {filteredRoutes.length > 0 && (
                <div className="px-5 py-3 border-t border-gray-50">
                  <p className="text-xs text-gray-400">
                    Showing {filteredRoutes.length} of {routes.length} routes
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Paired delivery clusters — real orders grouped by region from
                GET /partner/transactions/pairable (2+ pairable orders per region) */}
            {pairableLoading ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
                <i className="ri-loader-4-line animate-spin text-3xl text-gray-300 mb-2 block" />
                <p className="text-sm text-gray-400">Loading pairable orders…</p>
              </div>
            ) : pairableGroups.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
                <i className="ri-inbox-line text-3xl text-gray-300 mb-2 block" />
                <p className="text-sm text-gray-400">No regions have 2+ pairable orders right now.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pairableGroups.map((group, idx) => (
                  <PairableGroupTable key={`${group.country}-${group.state}-${idx}`} group={group} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showAddRoute && <AddRouteModal onClose={() => setShowAddRoute(false)} />}
      {editRoute && <AddRouteModal route={editRoute} onClose={() => setEditRoute(null)} />}
      {previewRoute && <BudgetTargetPreviewModal route={previewRoute} onClose={() => setPreviewRoute(null)} />}

      {/* Route detail modal */}
      <DefaultModal
        isOpen={!!activeRoute}
        onClose={() => setActiveRoute(null)}
        title={activeRoute ? `${activeRoute.origin_state} → ${activeRoute.destination_state}` : ""}
        subtitle={activeRoute?.partner_name}
      >
        {activeRoute && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <OpenBadge isOpen={activeRoute.is_open_for_joining} />
              <span className="text-xs text-gray-400">Created {formatDate(activeRoute.created_at)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-[11px] text-gray-400 font-medium mb-1">Origin</p>
                <p className="text-sm font-semibold text-gray-900">{activeRoute.origin_state}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-[11px] text-gray-400 font-medium mb-1">Destination</p>
                <p className="text-sm font-semibold text-gray-900">{activeRoute.destination_state}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] text-gray-400 font-medium">Cargo</p>
                <p className="text-sm text-gray-800 font-medium">{activeRoute.cargo_type}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">Frequency</p>
                <p className="text-sm text-gray-800 font-medium">{FREQUENCY_LABELS[activeRoute.frequency] ?? activeRoute.frequency}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">Preferred Date</p>
                <p className="text-sm text-gray-800 font-medium">{formatDate(activeRoute.preferred_date)}</p>
              </div>
            </div>

            <div>
              <p className="text-[11px] text-gray-400 font-medium">Budget range</p>
              <p className="text-sm text-gray-800 font-medium">
                {formatAmount(activeRoute.min_budget)} – {formatAmount(activeRoute.max_budget)}
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-1 border-t border-gray-100">
              <button
                onClick={() => handleDelete(activeRoute)}
                className="px-5 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => { setPreviewRoute(activeRoute); setActiveRoute(null); }}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Preview Pricing
              </button>
              <button
                onClick={() => { setEditRoute(activeRoute); setActiveRoute(null); }}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </DefaultModal>
    </DashboardLayout>
  );
};

/* ---------- Pairable Group Table — real orders clustered by region ---------- */
function PairableGroupTable({ group }: { group: PairableGroup }) {
  const pricedOrders = group.orders.filter((o) => o.total_amount != null);
  const combinedValue = pricedOrders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
  const regionLabel = [group.state, group.country].filter(Boolean).join(", ") || "Unspecified region";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b border-gray-100 bg-orange-50/60">
        <p className="text-sm font-semibold text-gray-900">{regionLabel}</p>
        <div className="flex items-center gap-2 shrink-0">
          {pricedOrders.length > 0 && (
            <span className="text-xs text-gray-500">{formatAmount(combinedValue)} combined</span>
          )}
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-brand">
            {group.order_count} order{group.order_count !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Partner</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pickup</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Driver</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
            </tr>
          </thead>
          <tbody>
            {group.orders.map((order) => {
              const pickup = order.stops?.find((s) => s.stop_type === "pickup");
              const delivery = order.stops?.find((s) => s.stop_type === "delivery");
              return (
                <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-orange-50/40 transition-colors">
                  <td className="px-5 py-3 align-top">
                    <p className="font-medium text-gray-900">{order.dispatch_business_id_no?.name ?? "Unassigned partner"}</p>
                    <p className="text-xs text-gray-400">{order.reference ?? `#${order.id}`}</p>
                  </td>
                  <td className="px-4 py-3 align-top text-gray-600 max-w-55">
                    <p className="truncate" title={pickup?.address}>{pickup?.address ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 align-top text-gray-600 max-w-55">
                    <p className="truncate" title={delivery?.address}>{delivery?.address ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 align-top text-gray-600">{order.driver?.name ?? "Unassigned"}</td>
                  <td className="px-4 py-3 align-top">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotClass(order.status)}`} />
                      <span className="text-xs text-gray-700">{formatStatusLabel(order.status)}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top font-semibold text-gray-800">{formatAmount(order.total_amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
