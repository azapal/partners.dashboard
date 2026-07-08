import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Location {
  lat: string;
  lon: string;
  address: string;
}

interface MapLocationPickerProps {
  value: Location;
  onChange: (loc: Location) => void;
}

const DEFAULT_CENTER: [number, number] = [9.082, 8.6753]; // Nigeria centre

// Inner component — must live inside MapContainer to use hooks
function MapInteraction({ lat, lon, onMove }: {
  lat: number; lon: number;
  onMove: (lat: number, lon: number) => void;
}) {
  const map = useMapEvents({
    click(e) { onMove(e.latlng.lat, e.latlng.lng); },
  });

  useEffect(() => {
    if (lat && lon) map.flyTo([lat, lon], map.getZoom());
  }, [lat, lon]);

  return (
    <Marker
      position={[lat || DEFAULT_CENTER[0], lon || DEFAULT_CENTER[1]]}
      draggable
      eventHandlers={{
        dragend(e) {
          const m = e.target as L.Marker;
          const p = m.getLatLng();
          onMove(p.lat, p.lng);
        },
      }}
    />
  );
}

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ value, onChange }) => {
  const [query, setQuery] = useState(value.address);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reverse geocode: coords → address
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const addr = data.display_name ?? `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      setQuery(addr);
      onChange({ lat: String(lat), lon: String(lon), address: addr });
    } catch {
      onChange({ lat: String(lat), lon: String(lon), address: query });
    }
  };

  // Forward geocode: address → coords
  const search = async (q: string) => {
    if (q.trim().length < 3) { setSuggestions([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
      );
      setSuggestions(await res.json());
    } finally {
      setSearching(false);
    }
  };

  const handleQueryChange = (v: string) => {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 500);
  };

  const pickSuggestion = (s: any) => {
    setSuggestions([]);
    setQuery(s.display_name);
    onChange({ lat: s.lat, lon: s.lon, address: s.display_name });
  };

  const handleMapMove = (lat: number, lon: number) => {
    reverseGeocode(lat, lon);
  };

  const lat = parseFloat(value.lat) || DEFAULT_CENTER[0];
  const lon = parseFloat(value.lon) || DEFAULT_CENTER[1];

  return (
    <div className="space-y-2">
      {/* Address search */}
      <div className="relative">
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 h-11 bg-white focus-within:ring-2 focus-within:ring-gray-200">
          <i className="ri-search-line text-gray-400 text-base shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search address…"
            className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder:text-gray-400"
          />
          {searching && <i className="ri-loader-4-line animate-spin text-gray-400 text-base" />}
        </div>

        {suggestions.length > 0 && (
          <ul className="absolute z-[9999] top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
            {suggestions.map((s, i) => (
              <li
                key={i}
                onClick={() => pickSuggestion(s)}
                className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-start gap-2"
              >
                <i className="ri-map-pin-line text-[#F14724] text-base mt-0.5 shrink-0" />
                <span>{s.display_name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-gray-100" style={{ height: 280 }}>
        <MapContainer
          center={[lat, lon]}
          zoom={value.lat ? 14 : 6}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          />
          <MapInteraction lat={lat} lon={lon} onMove={handleMapMove} />
        </MapContainer>
      </div>

      {/* Coords display */}
      {value.lat && value.lon && (
        <div className="flex items-center gap-3">
          <CoordBadge label="Lat" value={value.lat} />
          <CoordBadge label="Lon" value={value.lon} />
        </div>
      )}
    </div>
  );
};

function CoordBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 flex-1">
      <span className="text-[11px] font-semibold text-gray-400 uppercase">{label}</span>
      <span className="text-sm font-mono text-gray-700">{parseFloat(value).toFixed(6)}</span>
    </div>
  );
}
