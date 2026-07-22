import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Polyline, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COUNTRY_MAPS, normalizeRegionName } from '../../lib/data/countryMaps';
import { useGetLogisticsTransactions } from '../../hooks/useLogistics';
import { formatStatusLabel, statusDotClass, statusHexColor } from '../../lib/orderStatus';
import type { LogisticsTransaction, TransactionStop } from '../../service/partnerService';
import { DefaultModal } from '../modal/DefaultModal';

interface RegionInfo {
  key: string;
  displayName: string;
  center: [number, number];
}

interface PlottableOrder {
  order: LogisticsTransaction;
  pickup: TransactionStop;
  delivery: TransactionStop;
}

const STATUS_LEGEND = [
  { label: 'Pending', className: 'bg-yellow-600' },
  { label: 'In progress', className: 'bg-blue-600' },
  { label: 'Delivered', className: 'bg-green-600' },
  { label: 'Canceled', className: 'bg-red-600' },
];

function regionsFromGeoJson(geoData: any): RegionInfo[] {
  return geoData.features.map((feature: any) => {
    const shapeName: string = feature.properties.shapeName;
    const bounds = L.geoJSON(feature).getBounds();
    const center = bounds.getCenter();
    return {
      key: normalizeRegionName(shapeName),
      displayName: shapeName,
      center: [center.lat, center.lng] as [number, number],
    };
  });
}

function formatAmount(n: number | null) {
  return n != null ? `₦${n.toLocaleString()}` : 'Pending price';
}

export function NetworkMap() {
  const [countryCode, setCountryCode] = useState(COUNTRY_MAPS[0].code);
  const country = COUNTRY_MAPS.find((c) => c.code === countryCode) ?? COUNTRY_MAPS[0];

  const [geoData, setGeoData] = useState<any | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<LogisticsTransaction | null>(null);

  const { data: page, isLoading: ordersLoading, isError: ordersError } = useGetLogisticsTransactions({
    country: country.name,
    page_size: 100,
  });
  const orders = page?.results ?? [];

  useEffect(() => {
    let cancelled = false;
    setGeoLoading(true);
    setGeoError(null);
    setGeoData(null);

    fetch(country.geoUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Could not load map boundaries for this country.');
        return res.json();
      })
      .then((data) => { if (!cancelled) { setGeoData(data); setGeoLoading(false); } })
      .catch((err) => { if (!cancelled) { setGeoError(err.message); setGeoLoading(false); } });

    return () => { cancelled = true; };
  }, [country.geoUrl]);

  const regions = useMemo(() => (geoData ? regionsFromGeoJson(geoData) : []), [geoData]);
  const regionByKey = useMemo(() => new Map(regions.map((r) => [r.key, r])), [regions]);

  const plottable = useMemo<PlottableOrder[]>(() => {
    const result: PlottableOrder[] = [];
    for (const order of orders) {
      const pickup = order.stops?.find((s) => s.stop_type === 'pickup');
      const delivery = order.stops?.find((s) => s.stop_type === 'delivery');
      if (!pickup || !delivery) continue;
      if (pickup.lat == null || pickup.lon == null || delivery.lat == null || delivery.lon == null) continue;
      result.push({ order, pickup, delivery });
    }
    return result;
  }, [orders]);

  const touchedRegionKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const order of orders) {
      for (const stop of order.stops ?? []) {
        if (!stop.state) continue; // frequently null — never geocoded
        keys.add(normalizeRegionName(stop.state));
      }
    }
    return keys;
  }, [orders]);

  const ordersByRegionKey = useMemo(() => {
    const map = new Map<string, LogisticsTransaction[]>();
    for (const order of orders) {
      for (const stop of order.stops ?? []) {
        if (!stop.state) continue;
        const key = normalizeRegionName(stop.state);
        const list = map.get(key) ?? [];
        if (!list.some((o) => o.id === order.id)) list.push(order);
        map.set(key, list);
      }
    }
    return map;
  }, [orders]);

  const bounds = useMemo(() => (geoData ? L.geoJSON(geoData).getBounds() : undefined), [geoData]);

  const geoStyle = (feature: any): L.PathOptions => {
    const connected = touchedRegionKeys.has(normalizeRegionName(feature.properties.shapeName));
    return {
      color: '#ffffff',
      weight: 1,
      fillColor: connected ? '#F14724' : '#94a3b8',
      fillOpacity: connected ? 0.35 : 0.2,
    };
  };

  const loading = geoLoading || ordersLoading;
  const connectedRegions = regions.filter((r) => touchedRegionKeys.has(r.key));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="network-map-country" className="text-xs font-medium text-gray-500 shrink-0">
            Country
          </label>
          <select
            id="network-map-country"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            {COUNTRY_MAPS.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
          {STATUS_LEGEND.map(({ label, className }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${className}`} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="rounded-xl overflow-hidden border border-gray-100" style={{ height: 480 }}>
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm gap-2">
              <i className="ri-loader-4-line animate-spin text-xl" /> Loading {country.name} orders…
            </div>
          ) : geoError ? (
            <div className="w-full h-full flex items-center justify-center text-red-500 text-sm text-center px-6">
              {geoError}
            </div>
          ) : ordersError ? (
            <div className="w-full h-full flex items-center justify-center text-red-500 text-sm text-center px-6">
              Could not load orders for this country.
            </div>
          ) : (
            <MapContainer
              key={country.code}
              bounds={bounds}
              center={country.center}
              zoom={country.zoom}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution={`&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors · ${country.attribution}`}
              />
              <GeoJSON
                key={`${country.code}-geo`}
                data={geoData}
                style={geoStyle}
                onEachFeature={(feature, layer) => {
                  const shapeName = feature.properties.shapeName;
                  const count = ordersByRegionKey.get(normalizeRegionName(shapeName))?.length ?? 0;
                  layer.bindTooltip(
                    `${shapeName}${count > 0 ? ` — ${count} order${count !== 1 ? 's' : ''}` : ''}`
                  );
                  layer.on({
                    mouseover: (e) => (e.target as L.Path).setStyle({ fillOpacity: 0.55 }),
                    mouseout: (e) => (e.target as L.Path).setStyle(geoStyle(feature)),
                  });
                }}
              />

              {plottable.map(({ order, pickup, delivery }) => (
                <Polyline
                  key={order.id}
                  positions={[[pickup.lat as number, pickup.lon as number], [delivery.lat as number, delivery.lon as number]]}
                  pathOptions={{ color: statusHexColor(order.status), weight: 3, opacity: 0.85 }}
                >
                  <Popup>
                    <div className="flex flex-col gap-1.5 min-w-[180px]">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                        {pickup.state ?? 'Pickup'} → {delivery.state ?? 'Delivery'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {order.dispatch_business_id_no?.name ?? `Order #${order.id}`}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotClass(order.status)}`} />
                        <span className="text-[11px] text-gray-500">{formatStatusLabel(order.status)}</span>
                      </div>
                      <button
                        onClick={() => setActiveOrder(order)}
                        className="text-left text-xs font-semibold text-[#F14724] hover:text-[#d63d1e] transition-colors mt-0.5"
                      >
                        View order details
                      </button>
                    </div>
                  </Popup>
                </Polyline>
              ))}

              {connectedRegions.map((region) => (
                <CircleMarker
                  key={region.key}
                  center={region.center}
                  radius={6}
                  pathOptions={{ color: '#ffffff', weight: 1.5, fillColor: '#F14724', fillOpacity: 1 }}
                >
                  <Popup>
                    <div className="flex flex-col gap-1 min-w-[180px]">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                        {region.displayName}
                      </p>
                      {(ordersByRegionKey.get(region.key) ?? []).map((order) => (
                        <button
                          key={order.id}
                          onClick={() => setActiveOrder(order)}
                          className="flex items-center justify-between gap-2 text-left text-xs font-medium text-gray-800 hover:text-[#F14724] transition-colors"
                        >
                          {order.dispatch_business_id_no?.name ?? `Order #${order.id}`}
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotClass(order.status)}`} />
                        </button>
                      ))}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </div>

        {!loading && !geoError && !ordersError && plottable.length === 0 ? (
          <p className="text-center text-sm text-gray-400 mt-3">
            No orders with pickup and delivery stops in {country.name} yet.
          </p>
        ) : !loading && !geoError && !ordersError ? (
          <p className="text-center text-[11px] text-gray-400 mt-3">
            {plottable.length} order{plottable.length !== 1 ? 's' : ''} plotted
            {page && page.count > orders.length ? ` of ${page.count} total in ${country.name}` : ''}
          </p>
        ) : null}
      </div>

      <DefaultModal
        isOpen={!!activeOrder}
        onClose={() => setActiveOrder(null)}
        title={activeOrder ? `Order #${activeOrder.id}` : ''}
        subtitle={activeOrder?.sender_id}
      >
        {activeOrder && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <span className={`w-2 h-2 rounded-full ${statusDotClass(activeOrder.status)}`} />
                {formatStatusLabel(activeOrder.status)}
              </span>
              <span className="text-sm font-semibold text-gray-900">{formatAmount(activeOrder.total_amount)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-[11px] text-gray-400 font-medium mb-1">Fulfilling partner</p>
                <p className="text-sm font-semibold text-gray-900">{activeOrder.dispatch_business_id_no?.name ?? 'Unassigned'}</p>
                {activeOrder.dispatch_business_id_no?.phone && (
                  <p className="text-xs text-gray-500">{activeOrder.dispatch_business_id_no.phone}</p>
                )}
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-[11px] text-gray-400 font-medium mb-1">Driver</p>
                <p className="text-sm font-semibold text-gray-900">{activeOrder.driver?.name ?? 'Unassigned'}</p>
                {activeOrder.driver?.phone && <p className="text-xs text-gray-500">{activeOrder.driver.phone}</p>}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Stops</p>
              <div className="flex flex-col gap-2">
                {(activeOrder.stops ?? []).map((stop) => {
                  const location = [stop.state, stop.country].filter(Boolean).join(', ');
                  return (
                    <div key={stop.id} className="flex items-start gap-2 rounded-xl border border-gray-100 px-3 py-2">
                      <i className={`text-sm mt-0.5 shrink-0 ${stop.stop_type === 'pickup' ? 'ri-arrow-up-circle-line text-blue-500' : 'ri-arrow-down-circle-line text-green-600'}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 capitalize">{stop.stop_type}</p>
                        <p className="text-xs text-gray-500 truncate">{stop.address}</p>
                        {location && <p className="text-[11px] text-gray-400">{location}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setActiveOrder(null)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </DefaultModal>
    </div>
  );
}
