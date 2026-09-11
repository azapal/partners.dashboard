import { useMemo, useState } from "react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { RateModal } from "../components/modal/RateModal";
import { RouteRateCardModal } from "../components/modal/RouteRateCardModal";
import { CargoRateCardModal } from "../components/modal/CargoRateCardModal";
import { DeliveryMethodRateCardModal } from "../components/modal/DeliveryMethodRateCardModal";
import { useGetRates } from "../hooks/useRates";
import { useGetRouteRates, useGetCargoRates, useGetDeliveryMethodRates } from "../hooks/useRateCards";
import type { Rate, RateScope, RouteRateCard, CargoRateCard, DeliveryMethodRateCard, RateCardStatus } from "../service/partnerService";

type Mode = "region" | "cards";
type CardTab = "routes" | "cargo" | "methods";

const scopeStyles: Record<RateScope, string> = {
  intra: "bg-blue-50 text-blue-700",
  international: "bg-purple-50 text-purple-700",
};

const scopeLabels: Record<RateScope, string> = {
  intra: "Intra",
  international: "International",
};

const statusStyles: Record<RateCardStatus, string> = {
  Active: "bg-green-50 text-green-700",
  Inactive: "bg-gray-100 text-gray-500",
};

function formatPrice(n: number): string {
  return `₦${n.toLocaleString()}`;
}

const ScopeBadge = ({ scope }: { scope: RateScope }) => (
  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${scopeStyles[scope]}`}>{scopeLabels[scope]}</span>
);

const StatusBadge = ({ status }: { status: RateCardStatus }) => (
  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyles[status]}`}>{status}</span>
);

const CategoryBadge = ({ category }: { category: Rate["category"] }) => (
  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${category ? "bg-orange-50 text-brand" : "bg-gray-100 text-gray-500"}`}>
    {category ? category.name : "Base"}
  </span>
);

const CARD_TABS: { key: CardTab; label: string; icon: string }[] = [
  { key: "routes", label: "Route Rates", icon: "ri-route-line" },
  { key: "cargo", label: "Cargo Rates", icon: "ri-box-3-line" },
  { key: "methods", label: "Delivery Method Rates", icon: "ri-e-bike-2-line" },
];

export const RatesScreen = () => {
  const [mode, setMode] = useState<Mode>("region");

  return (
    <DashboardLayout>
      <div className="w-full flex flex-col gap-5 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          {/* <div>
            <h1 className="text-xl font-bold text-gray-900">Rates</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Set what you charge for deliveries.
            </p>
          </div> */}
          <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit shadow-sm">
            <button
              onClick={() => setMode("region")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mode === "region" ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Region Rates
            </button>
            <button
              onClick={() => setMode("cards")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mode === "cards" ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Rate Cards
            </button>
          </div>
        </div>

        {mode === "region" ? <RegionRatesPanel /> : <RateCardsPanel />}
      </div>
    </DashboardLayout>
  );
};

/* ---------- Region / scope rates (partner/rates) ---------- */
function RegionRatesPanel() {
  const { data, isLoading } = useGetRates();

  const [showAdd, setShowAdd] = useState(false);
  const [editRate, setEditRate] = useState<Rate | null>(null);

  const rates = useMemo(() => {
    return [...(data ?? [])].sort((a, b) => {
      if (a.region !== b.region) return a.region.localeCompare(b.region);
      if (a.scope !== b.scope) return a.scope.localeCompare(b.scope);
      if (!a.category && !b.category) return 0;
      if (!a.category) return -1;
      if (!b.category) return 1;
      return a.category.name.localeCompare(b.category.name);
    });
  }, [data]);

  return (
    <>
      <div className="flex flex-col gap-3">
        {rates.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors"
            >
              <i className="ri-add-line text-base" />
              Add Rate
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <p className="text-center py-14 text-gray-400 text-sm">Loading…</p>
          ) : rates.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14">
              <p className="text-gray-400 text-sm">No price list configured yet.</p>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors"
              >
                <i className="ri-add-line text-base" />
                Add your first rate
              </button>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-orange-50/60">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Region</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Scope</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Window</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pickup Service</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rates.map((rate) => (
                      <tr
                        key={rate.id}
                        onClick={() => setEditRate(rate)}
                        className="border-b border-gray-50 hover:bg-orange-50/40 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5 font-medium text-gray-800">{rate.region}</td>
                        <td className="px-4 py-3.5"><ScopeBadge scope={rate.scope} /></td>
                        <td className="px-4 py-3.5"><CategoryBadge category={rate.category} /></td>
                        <td className="px-4 py-3.5 text-gray-900 font-semibold">{formatPrice(rate.price)}</td>
                        <td className="px-4 py-3.5 text-gray-600">{rate.window || "—"}</td>
                        <td className="px-4 py-3.5 text-gray-600">{rate.pickup_service || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden divide-y divide-gray-50">
                {rates.map((rate) => (
                  <div
                    key={rate.id}
                    onClick={() => setEditRate(rate)}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-orange-50/40 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{rate.region}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatPrice(rate.price)}{rate.window ? ` · ${rate.window}` : ""}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <ScopeBadge scope={rate.scope} />
                      <CategoryBadge category={rate.category} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {showAdd && <RateModal onClose={() => setShowAdd(false)} />}
      {editRate && <RateModal rate={editRate} onClose={() => setEditRate(null)} />}
    </>
  );
}

/* ---------- Route / cargo / delivery-method rate cards (proposed) ---------- */
function RateCardsPanel() {
  const [tab, setTab] = useState<CardTab>("routes");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit shadow-sm flex-wrap">
        {CARD_TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === key ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <i className={`${icon} text-base`} />
            {label}
          </button>
        ))}
      </div>

      {tab === "routes" && <RouteRatesTab />}
      {tab === "cargo" && <CargoRatesTab />}
      {tab === "methods" && <DeliveryMethodRatesTab />}
    </div>
  );
}

function RateCardSection({ addLabel, onAdd, children }: { addLabel: string; onAdd: () => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors"
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

function RouteRatesTab() {
  const { data: rates = [], isLoading } = useGetRouteRates();
  const [showAdd, setShowAdd] = useState(false);
  const [editRate, setEditRate] = useState<RouteRateCard | null>(null);

  return (
    <>
      <RateCardSection addLabel="Add Route Rate" onAdd={() => setShowAdd(true)}>
        {isLoading ? (
          <p className="text-center py-14 text-gray-400 text-sm">Loading…</p>
        ) : rates.length === 0 ? (
          <p className="text-center py-14 text-gray-400 text-sm">No route rates yet</p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-orange-50/60">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Route</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cargo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((rate) => (
                    <tr
                      key={rate.id}
                      onClick={() => setEditRate(rate)}
                      className="border-b border-gray-50 hover:bg-orange-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="font-medium text-gray-800">{rate.origin_state}</span>
                          <i className="ri-arrow-right-line text-gray-300" />
                          <span className="font-medium text-gray-800">{rate.destination_state}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 text-sm">{rate.cargo_type}</td>
                      <td className="px-4 py-3.5 text-gray-900 font-semibold text-sm">{formatPrice(rate.price)}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={rate.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-50">
              {rates.map((rate) => (
                <div
                  key={rate.id}
                  onClick={() => setEditRate(rate)}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-orange-50/40 cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                      {rate.origin_state} <i className="ri-arrow-right-line text-gray-300 text-xs" /> {rate.destination_state}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{rate.cargo_type} · {formatPrice(rate.price)}</p>
                  </div>
                  <StatusBadge status={rate.status} />
                </div>
              ))}
            </div>
          </>
        )}
      </RateCardSection>

      {showAdd && <RouteRateCardModal onClose={() => setShowAdd(false)} />}
      {editRate && <RouteRateCardModal rate={editRate} onClose={() => setEditRate(null)} />}
    </>
  );
}

function CargoRatesTab() {
  const { data: rates = [], isLoading } = useGetCargoRates();
  const [showAdd, setShowAdd] = useState(false);
  const [editRate, setEditRate] = useState<CargoRateCard | null>(null);

  return (
    <>
      <RateCardSection addLabel="Add Cargo Rate" onAdd={() => setShowAdd(true)}>
        {isLoading ? (
          <p className="text-center py-14 text-gray-400 text-sm">Loading…</p>
        ) : rates.length === 0 ? (
          <p className="text-center py-14 text-gray-400 text-sm">No cargo rates yet</p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-orange-50/60">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cargo Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Base Price</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price / KG</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((rate) => (
                    <tr
                      key={rate.id}
                      onClick={() => setEditRate(rate)}
                      className="border-b border-gray-50 hover:bg-orange-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-gray-800 text-sm">{rate.cargo_type}</td>
                      <td className="px-4 py-3.5 text-gray-900 font-semibold text-sm">{formatPrice(rate.base_price)}</td>
                      <td className="px-4 py-3.5 text-gray-600 text-sm">{formatPrice(rate.price_per_kg)}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={rate.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-50">
              {rates.map((rate) => (
                <div
                  key={rate.id}
                  onClick={() => setEditRate(rate)}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-orange-50/40 cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{rate.cargo_type}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatPrice(rate.base_price)} base · {formatPrice(rate.price_per_kg)}/kg</p>
                  </div>
                  <StatusBadge status={rate.status} />
                </div>
              ))}
            </div>
          </>
        )}
      </RateCardSection>

      {showAdd && <CargoRateCardModal onClose={() => setShowAdd(false)} />}
      {editRate && <CargoRateCardModal rate={editRate} onClose={() => setEditRate(null)} />}
    </>
  );
}

function DeliveryMethodRatesTab() {
  const { data: rates = [], isLoading } = useGetDeliveryMethodRates();
  const [showAdd, setShowAdd] = useState(false);
  const [editRate, setEditRate] = useState<DeliveryMethodRateCard | null>(null);

  return (
    <>
      <RateCardSection addLabel="Add Delivery Method Rate" onAdd={() => setShowAdd(true)}>
        {isLoading ? (
          <p className="text-center py-14 text-gray-400 text-sm">Loading…</p>
        ) : rates.length === 0 ? (
          <p className="text-center py-14 text-gray-400 text-sm">No delivery method rates yet</p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-orange-50/60">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery Method</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((rate) => (
                    <tr
                      key={rate.id}
                      onClick={() => setEditRate(rate)}
                      className="border-b border-gray-50 hover:bg-orange-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-gray-800 text-sm">{rate.method}</td>
                      <td className="px-4 py-3.5 text-gray-900 font-semibold text-sm">{formatPrice(rate.price)}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={rate.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-50">
              {rates.map((rate) => (
                <div
                  key={rate.id}
                  onClick={() => setEditRate(rate)}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-orange-50/40 cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{rate.method}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatPrice(rate.price)}</p>
                  </div>
                  <StatusBadge status={rate.status} />
                </div>
              ))}
            </div>
          </>
        )}
      </RateCardSection>

      {showAdd && <DeliveryMethodRateCardModal onClose={() => setShowAdd(false)} />}
      {editRate && <DeliveryMethodRateCardModal rate={editRate} onClose={() => setEditRate(null)} />}
    </>
  );
}
