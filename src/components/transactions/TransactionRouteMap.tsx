import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TransactionStop } from '../../service/partnerService';

// Fix default marker icons broken by webpack/vite — only needed here (and in
// MapLocationPicker) because we render real Markers; NetworkMap only uses
// Polyline/CircleMarker so it doesn't need this.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface TransactionRouteMapProps {
  pickup: TransactionStop & { lat: number; lon: number };
  delivery: TransactionStop & { lat: number; lon: number };
  routeColor: string;
}

export function TransactionRouteMap({ pickup, delivery, routeColor }: TransactionRouteMapProps) {
  const pickupPos: [number, number] = [pickup.lat, pickup.lon];
  const deliveryPos: [number, number] = [delivery.lat, delivery.lon];
  const bounds = L.latLngBounds([pickupPos, deliveryPos]).pad(0.25);

  return (
    <div className="h-56 w-full rounded-xl overflow-hidden border border-gray-100">
      <MapContainer bounds={bounds} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        />
        <Polyline positions={[pickupPos, deliveryPos]} pathOptions={{ color: routeColor, weight: 3, dashArray: '6 6' }} />
        <Marker position={pickupPos}>
          <Popup>
            <span className="text-xs font-medium">Pickup</span>
            <br />
            {pickup.address}
          </Popup>
        </Marker>
        <Marker position={deliveryPos}>
          <Popup>
            <span className="text-xs font-medium">Delivery</span>
            <br />
            {delivery.address}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
