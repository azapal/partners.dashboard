import { useState } from "react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { RouteRateModal } from "../components/modal/RouteRateModal";
import { CargoRateModal } from "../components/modal/CargoRateModal";
import { DeliveryMethodRateModal } from "../components/modal/DeliveryMethodRateModal";
import {
  dummyRouteRates,
  dummyCargoTypeRates,
  dummyDeliveryMethodRates,
} from "../lib/data/rates";
import type {
  RouteRate,
  CargoTypeRate,
  DeliveryMethodRate,
  RateStatus,
} from "../lib/data/rates";

type RateTab = "routes" | "cargo" | "methods";

const statusStyles: Record<RateStatus, string> = {
  Active: "bg-green-50 text-green-700",
  Inactive: "bg-gray-100 text-gray-500",
};

function formatPrice(n: number): string {
  return `₦${n.toLocaleString()}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

const StatusBadge = ({ status }: { status: RateStatus }) => (
  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyles[status]}`}>{status}</span>
);

const TABS: { key: RateTab; label: string; icon: string }[] = [
  { key: "routes", label: "Route Rates", icon: "ri-route-line" },
  { key: "cargo", label: "Cargo Rates", icon: "ri-box-3-line" },
  { key: "methods", label: "Delivery Method Rates", icon: "ri-e-bike-2-line" },
];

export const RatesScreen = () => {
  const [routeRates, setRouteRates] = useState<RouteRate[]>(dummyRouteRates);
  const [cargoRates, setCargoRates] = useState<CargoTypeRate[]>(dummyCargoTypeRates);
  const [methodRates, setMethodRates] = useState<DeliveryMethodRate[]>(dummyDeliveryMethodRates);

  const [tab, setTab] = useState<RateTab>("routes");

  const [showAddRoute, setShowAddRoute] = useState(false);
  const [showAddCargo, setShowAddCargo] = useState(false);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [editRoute, setEditRoute] = useState<RouteRate | null>(null);
  const [editCargo, setEditCargo] = useState<CargoTypeRate | null>(null);
  const [editMethod, setEditMethod] = useState<DeliveryMethodRate | null>(null);

  const upsertRoute = (rate: RouteRate) =>
    setRouteRates((prev) => (prev.some((r) => r.id === rate.id) ? prev.map((r) => (r.id === rate.id ? rate : r)) : [rate, ...prev]));
  const upsertCargo = (rate: CargoTypeRate) =>
    setCargoRates((prev) => (prev.some((r) => r.id === rate.id) ? prev.map((r) => (r.id === rate.id ? rate : r)) : [rate, ...prev]));
  const upsertMethod = (rate: DeliveryMethodRate) =>
    setMethodRates((prev) => (prev.some((r) => r.id === rate.id) ? prev.map((r) => (r.id === rate.id ? rate : r)) : [rate, ...prev]));

  const activeCount =
    tab === "routes" ? routeRates.filter((r) => r.status === "Active").length
    : tab === "cargo" ? cargoRates.filter((r) => r.status === "Active").length
    : methodRates.filter((r) => r.status === "Active").length;

  const totalCount = tab === "routes" ? routeRates.length : tab === "cargo" ? cargoRates.length : methodRates.length;

  return (
    <DashboardLayout>
      <div className="w-full flex flex-col gap-5 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Rates</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Set what you charge for deliveries — by route, cargo type, or delivery method.
            </p>
          </div>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Route Rates", value: routeRates.length, icon: "ri-route-line", color: "text-gray-700", bg: "bg-gray-100" },
            { label: "Cargo Rates", value: cargoRates.length, icon: "ri-box-3-line", color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Delivery Method Rates", value: methodRates.length, icon: "ri-e-bike-2-line", color: "text-[#F14724]", bg: "bg-orange-50" },
            { label: "Active in this tab", value: `${activeCount}/${totalCount}`, icon: "ri-checkbox-circle-line", color: "text-green-600", bg: "bg-green-50" },
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

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit shadow-sm flex-wrap">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === key ? "bg-[#F14724] text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <i className={`${icon} text-base`} />
              {label}
            </button>
          ))}
        </div>

        {tab === "routes" && (
          <RateSection
            addLabel="Add Route Rate"
            onAdd={() => setShowAddRoute(true)}
          >
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-orange-50/60">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Route</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cargo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Updated</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {routeRates.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-14 text-gray-400 text-sm">No route rates yet</td></tr>
                  ) : (
                    routeRates.map((rate) => (
                      <tr
                        key={rate.id}
                        onClick={() => setEditRoute(rate)}
                        className="border-b border-gray-50 hover:bg-orange-50/40 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-sm">
                            <span className="font-medium text-gray-800">{rate.originState}</span>
                            <i className="ri-arrow-right-line text-gray-300" />
                            <span className="font-medium text-gray-800">{rate.destinationState}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{rate.id}</p>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 text-sm">{rate.cargoType}</td>
                        <td className="px-4 py-3.5 text-gray-900 font-semibold text-sm">{formatPrice(rate.price)}</td>
                        <td className="px-4 py-3.5 text-gray-500 text-sm">{formatDate(rate.createdAt)}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={rate.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-50">
              {routeRates.length === 0 ? (
                <p className="text-center py-14 text-gray-400 text-sm">No route rates yet</p>
              ) : (
                routeRates.map((rate) => (
                  <div
                    key={rate.id}
                    onClick={() => setEditRoute(rate)}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-orange-50/40 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                        {rate.originState} <i className="ri-arrow-right-line text-gray-300 text-xs" /> {rate.destinationState}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{rate.cargoType} · {formatPrice(rate.price)}</p>
                    </div>
                    <StatusBadge status={rate.status} />
                  </div>
                ))
              )}
            </div>
          </RateSection>
        )}

        {tab === "cargo" && (
          <RateSection addLabel="Add Cargo Rate" onAdd={() => setShowAddCargo(true)}>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-orange-50/60">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cargo Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Base Price</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price / KG</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Updated</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cargoRates.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-14 text-gray-400 text-sm">No cargo rates yet</td></tr>
                  ) : (
                    cargoRates.map((rate) => (
                      <tr
                        key={rate.id}
                        onClick={() => setEditCargo(rate)}
                        className="border-b border-gray-50 hover:bg-orange-50/40 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-800 text-sm">{rate.cargoType}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{rate.id}</p>
                        </td>
                        <td className="px-4 py-3.5 text-gray-900 font-semibold text-sm">{formatPrice(rate.basePrice)}</td>
                        <td className="px-4 py-3.5 text-gray-600 text-sm">{formatPrice(rate.pricePerKg)}</td>
                        <td className="px-4 py-3.5 text-gray-500 text-sm">{formatDate(rate.createdAt)}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={rate.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-50">
              {cargoRates.length === 0 ? (
                <p className="text-center py-14 text-gray-400 text-sm">No cargo rates yet</p>
              ) : (
                cargoRates.map((rate) => (
                  <div
                    key={rate.id}
                    onClick={() => setEditCargo(rate)}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-orange-50/40 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{rate.cargoType}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatPrice(rate.basePrice)} base · {formatPrice(rate.pricePerKg)}/kg</p>
                    </div>
                    <StatusBadge status={rate.status} />
                  </div>
                ))
              )}
            </div>
          </RateSection>
        )}

        {tab === "methods" && (
          <RateSection addLabel="Add Delivery Method Rate" onAdd={() => setShowAddMethod(true)}>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-orange-50/60">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery Method</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Updated</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {methodRates.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-14 text-gray-400 text-sm">No delivery method rates yet</td></tr>
                  ) : (
                    methodRates.map((rate) => (
                      <tr
                        key={rate.id}
                        onClick={() => setEditMethod(rate)}
                        className="border-b border-gray-50 hover:bg-orange-50/40 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-800 text-sm">{rate.method}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{rate.id}</p>
                        </td>
                        <td className="px-4 py-3.5 text-gray-900 font-semibold text-sm">{formatPrice(rate.price)}</td>
                        <td className="px-4 py-3.5 text-gray-500 text-sm">{formatDate(rate.createdAt)}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={rate.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-50">
              {methodRates.length === 0 ? (
                <p className="text-center py-14 text-gray-400 text-sm">No delivery method rates yet</p>
              ) : (
                methodRates.map((rate) => (
                  <div
                    key={rate.id}
                    onClick={() => setEditMethod(rate)}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-orange-50/40 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{rate.method}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatPrice(rate.price)}</p>
                    </div>
                    <StatusBadge status={rate.status} />
                  </div>
                ))
              )}
            </div>
          </RateSection>
        )}
      </div>

      {showAddRoute && <RouteRateModal onClose={() => setShowAddRoute(false)} onSave={upsertRoute} />}
      {editRoute && (
        <RouteRateModal
          rate={editRoute}
          onClose={() => setEditRoute(null)}
          onSave={upsertRoute}
          onDelete={(id) => setRouteRates((prev) => prev.filter((r) => r.id !== id))}
        />
      )}

      {showAddCargo && <CargoRateModal onClose={() => setShowAddCargo(false)} onSave={upsertCargo} />}
      {editCargo && (
        <CargoRateModal
          rate={editCargo}
          onClose={() => setEditCargo(null)}
          onSave={upsertCargo}
          onDelete={(id) => setCargoRates((prev) => prev.filter((r) => r.id !== id))}
        />
      )}

      {showAddMethod && <DeliveryMethodRateModal onClose={() => setShowAddMethod(false)} onSave={upsertMethod} />}
      {editMethod && (
        <DeliveryMethodRateModal
          rate={editMethod}
          onClose={() => setEditMethod(null)}
          onSave={upsertMethod}
          onDelete={(id) => setMethodRates((prev) => prev.filter((r) => r.id !== id))}
        />
      )}
    </DashboardLayout>
  );
};

/* ---------- Shared card wrapper for each tab's table + Add button ---------- */
function RateSection({ addLabel, onAdd, children }: { addLabel: string; onAdd: () => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-[#F14724] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#d63d1e] transition-colors"
        >
          <i className="ri-add-line text-base" />
          {addLabel}
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {children}
      </div>
    </div>
  );
}
