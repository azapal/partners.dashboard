import { useMemo, useState } from "react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { AddRouteModal } from "../components/modal/AddRouteModal";
import { BulkRouteImportModal } from "../components/modal/BulkRouteImportModal";
import { DefaultModal } from "../components/modal/DefaultModal";
import { NetworkMap } from "../components/logistics/NetworkMap";
import { useGetPairableGroups } from "../hooks/useLogistics";
import type { PairableGroup } from "../service/partnerService";
import { formatStatusLabel, statusDotClass } from "../lib/orderStatus";
import { dummyRoutes } from "../lib/data/logisticsNetwork";
import type { LogisticsRoute, RouteStatus } from "../lib/data/logisticsNetwork";

type MainTab = "routes" | "paired";

const routeStatusStyles: Record<RouteStatus, string> = {
  Active: "bg-blue-50 text-blue-600",
  Paired: "bg-green-50 text-green-700",
  Pending: "bg-yellow-50 text-yellow-700",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function formatAmount(n: number | null): string {
  return n != null ? `₦${n.toLocaleString()}` : "—";
}

export const LogisticsNetworkScreen = () => {
  const [routes, setRoutes] = useState<LogisticsRoute[]>(dummyRoutes);

  const [mainTab, setMainTab] = useState<MainTab>("routes");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | RouteStatus>("All");
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [activeRoute, setActiveRoute] = useState<LogisticsRoute | null>(null);

  const { data: pairableGroups = [], isLoading: pairableLoading } = useGetPairableGroups();

  const filteredRoutes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return routes.filter((r) => {
      const matchesSearch =
        !query ||
        [r.businessName, r.originState, r.destinationState, r.originAddress, r.destinationAddress, r.id]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [routes, search, statusFilter]);

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

  const addRoute = (route: LogisticsRoute) => setRoutes((prev) => [route, ...prev]);
  const addBulkRoutes = (newRoutes: LogisticsRoute[]) => setRoutes((prev) => [...newRoutes, ...prev]);

  return (
    <DashboardLayout>
      <div className="w-full flex flex-col gap-5 overflow-y-auto">
        {/* Header */}
        {/* <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Logistics Network</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Upload your delivery routes and get paired with other partners heading to the same destinations.
            </p>
          </div>
        </div> */}

        {/* Network map */}
        <NetworkMap />

        {/* Overview stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "My Routes", value: routes.length, icon: "ri-route-line", color: "text-gray-700", bg: "bg-gray-100" },
            { label: "Pairable Orders", value: pairableStats.orderCount, icon: "ri-shuffle-line", color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Regions Clustered", value: pairableStats.regionCount, icon: "ri-map-pin-line", color: "text-[#F14724]", bg: "bg-orange-50" },
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
              mainTab === "routes" ? "bg-[#F14724] text-white" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <i className="ri-route-line text-base" />
            My Routes
          </button>
          <button
            onClick={() => setMainTab("paired")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mainTab === "paired" ? "bg-[#F14724] text-white" : "text-gray-500 hover:bg-gray-50"
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
                  placeholder="Search routes, businesses…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <div className="flex items-center gap-1">
                  {(["All", "Active", "Paired", "Pending"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`h-9 px-3 rounded-xl text-sm font-medium border transition ${
                        statusFilter === s
                          ? "border-[#F14724] bg-orange-50 text-[#F14724]"
                          : "border-gray-200 text-gray-500 hover:bg-gray-50 bg-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowBulkImport(true)}
                  className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  <i className="ri-file-upload-line text-base" />
                  Bulk Upload
                </button>
                <button
                  onClick={() => setShowAddRoute(true)}
                  className="flex items-center gap-2 bg-[#F14724] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#d63d1e] transition-colors"
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
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Business</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Route</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cargo</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Frequency</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.length === 0 ? (
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
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                                <i className="ri-building-2-line text-base text-[#F14724]" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{route.businessName}</p>
                                <p className="text-xs text-gray-400">{route.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 text-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-gray-800">{route.originState}</span>
                              <i className="ri-arrow-right-line text-gray-300" />
                              <span className="font-medium text-gray-800">{route.destinationState}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 text-sm">{route.cargoType}</td>
                          <td className="px-4 py-3.5 text-gray-600 text-sm">{route.frequency}</td>
                          <td className="px-4 py-3.5 text-gray-600 text-sm">{formatDate(route.preferredDate)}</td>
                          <td className="px-4 py-3.5">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${routeStatusStyles[route.status]}`}>
                              {route.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-50">
                {filteredRoutes.length === 0 ? (
                  <p className="text-center py-14 text-gray-400 text-sm">No routes found</p>
                ) : (
                  filteredRoutes.map((route) => (
                    <div
                      key={route.id}
                      onClick={() => setActiveRoute(route)}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-orange-50/40 cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                        <i className="ri-building-2-line text-lg text-[#F14724]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{route.businessName}</p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          {route.originState} <i className="ri-arrow-right-line text-gray-300" /> {route.destinationState}
                        </p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${routeStatusStyles[route.status]}`}>
                        {route.status}
                      </span>
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

      {showAddRoute && <AddRouteModal onClose={() => setShowAddRoute(false)} onAdd={addRoute} />}
      <BulkRouteImportModal isOpen={showBulkImport} onClose={() => setShowBulkImport(false)} onImport={addBulkRoutes} />

      {/* Route detail modal */}
      <DefaultModal
        isOpen={!!activeRoute}
        onClose={() => setActiveRoute(null)}
        title={activeRoute?.businessName ?? ""}
        subtitle={activeRoute?.id}
      >
        {activeRoute && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${routeStatusStyles[activeRoute.status]}`}>
                {activeRoute.status}
              </span>
              <span className="text-xs text-gray-400">Uploaded {formatDate(activeRoute.createdAt)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-[11px] text-gray-400 font-medium mb-1">Departure</p>
                <p className="text-sm font-semibold text-gray-900">{activeRoute.originState}</p>
                <p className="text-xs text-gray-500">{activeRoute.originAddress}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-[11px] text-gray-400 font-medium mb-1">Arrival</p>
                <p className="text-sm font-semibold text-gray-900">{activeRoute.destinationState}</p>
                <p className="text-xs text-gray-500">{activeRoute.destinationAddress}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] text-gray-400 font-medium">Cargo</p>
                <p className="text-sm text-gray-800 font-medium">{activeRoute.cargoType}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">Frequency</p>
                <p className="text-sm text-gray-800 font-medium">{activeRoute.frequency}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">Preferred Date</p>
                <p className="text-sm text-gray-800 font-medium">{formatDate(activeRoute.preferredDate)}</p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setActiveRoute(null)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Close
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
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-[#F14724]">
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
