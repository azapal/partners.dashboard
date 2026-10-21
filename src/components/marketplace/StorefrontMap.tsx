import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Storefront } from "../../service/partnerService";
import { BRAND_NAVY, BRAND_ORANGE } from "../../lib/brandColors";
import { toCoord } from "./shared";

/**
 * A partner's HQ and every branch with coordinates, as pins. Fits the view to
 * all of them. Markers are divIcons (a coloured pin with a Remix icon) rather
 * than Leaflet's default image marker, so there's no marker-asset path to fix
 * and HQ reads differently from a branch at a glance.
 */

export interface MapPoint {
  key: string;
  lat: number;
  lon: number;
  kind: "hq" | "branch";
  title: string;
  lines: string[];
}

const NIGERIA_CENTER: [number, number] = [9.082, 8.6753];

const pinIcon = (kind: MapPoint["kind"]) =>
  L.divIcon({
    className: "",
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -36],
    html: `<div style="position:relative;width:34px;height:42px;filter:drop-shadow(0 4px 6px rgba(15,23,42,.25))">
      <svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0">
        <path d="M17 1C8.2 1 1 8 1 16.6 1 28 17 41 17 41s16-13 16-24.4C33 8 25.8 1 17 1z" fill="${kind === "hq" ? BRAND_NAVY : BRAND_ORANGE}" stroke="#fff" stroke-width="2"/>
      </svg>
      <i class="${kind === "hq" ? "ri-building-2-fill" : "ri-store-2-fill"}" style="position:absolute;left:0;right:0;top:7px;text-align:center;color:#fff;font-size:15px;line-height:1"></i>
    </div>`,
  });

export const storefrontPoints = (s: Storefront) => {
  const pinned: MapPoint[] = [];
  const unpinned: Storefront["branches"] = [];
  const hqLat = toCoord(s.hq?.lat);
  const hqLon = toCoord(s.hq?.lon);
  if (hqLat != null && hqLon != null) {
    pinned.push({
      key: "hq",
      lat: hqLat,
      lon: hqLon,
      kind: "hq",
      title: `${s.partner_name} — head office`,
      lines: [s.hq.address ?? "", [s.hq.city, s.hq.state].filter(Boolean).join(", ")].filter(Boolean),
    });
  }
  for (const b of s.branches) {
    const lat = toCoord(b.lat);
    const lon = toCoord(b.lon);
    if (lat == null || lon == null) {
      unpinned.push(b);
      continue;
    }
    pinned.push({
      key: `b-${b.id}`,
      lat,
      lon,
      kind: "branch",
      title: `Branch ${b.branch_code}`,
      lines: [b.address ?? "", [b.lga, b.state].filter(Boolean).join(", ")].filter(Boolean),
    });
  }
  return { pinned, unpinned };
};

function FitToPoints({ points }: { points: MapPoint[] }) {
  const map = useMap();
  const signature = points.map((p) => `${p.lat},${p.lon}`).join("|");
  useEffect(() => {
    if (points.length === 0) return;
    const fit = () => {
      if (points.length === 1) {
        map.setView([points[0].lat, points[0].lon], 12);
      } else {
        map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lon] as [number, number])), { padding: [40, 40], maxZoom: 13 });
      }
    };
    fit();
    // The modal lays out after the map mounts, so the first fit can be made
    // against the wrong size — measure again and refit once it has settled.
    const t = setTimeout(() => { map.invalidateSize(); fit(); }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature]);
  return null;
}

export const StorefrontMap = ({ points, height = 340, focusKey }: { points: MapPoint[]; height?: number; focusKey?: string | null }) => {
  const icons = useMemo(() => ({ hq: pinIcon("hq"), branch: pinIcon("branch") }), []);

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-100" style={{ height }}>
      <MapContainer center={NIGERIA_CENTER} zoom={6} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        />
        <FitToPoints points={points} />
        <FocusPoint points={points} focusKey={focusKey ?? null} />
        {points.map((p) => (
          <Marker key={p.key} position={[p.lat, p.lon]} icon={icons[p.kind]} zIndexOffset={p.kind === "hq" ? 1000 : 0}>
            <Popup>
              <div className="min-w-[180px]">
                <p className="text-xs font-bold text-gray-900">{p.title}</p>
                {p.lines.map((l) => <p key={l} className="!my-0.5 text-[11px] leading-4 text-gray-500">{l}</p>)}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {points.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[500] flex flex-col items-center justify-center gap-1 bg-white/70 text-center backdrop-blur-[1px]">
          <i className="ri-map-pin-line text-2xl text-gray-400" />
          <p className="text-sm font-semibold text-gray-700">No locations pinned yet</p>
          <p className="max-w-xs text-xs text-gray-500">Their branches are listed below.</p>
        </div>
      )}
    </div>
  );
};

/** Pans to a point when a branch row is clicked. */
function FocusPoint({ points, focusKey }: { points: MapPoint[]; focusKey: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (!focusKey) return;
    // `key#n`, so clicking the same branch twice still flies back to it.
    const p = points.find((x) => x.key === focusKey.split("#")[0]);
    if (p) map.flyTo([p.lat, p.lon], Math.max(map.getZoom(), 14), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);
  return null;
}
