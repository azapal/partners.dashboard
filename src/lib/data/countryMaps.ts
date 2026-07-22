// Real administrative boundary data (ADM1 — states/regions/counties),
// sourced from geoBoundaries.org (CC BY 4.0, © geoBoundaries) and
// simplified for web rendering. Files live in /public/geo and are fetched
// at runtime per country rather than bundled, since each is tens of KB.

export interface CountryMapMeta {
  code: string;
  name: string;
  regionLabel: string;
  geoUrl: string;
  center: [number, number];
  zoom: number;
  attribution: string;
  // Route data comes from multiple sources (seeded dummy data, the
  // states.json picker used by AddRouteModal, free-text bulk-import CSVs)
  // that don't all spell region names the same way as the boundary file's
  // `shapeName` property — e.g. "Akwa-Ibom" vs "Akwa Ibom", or "Port
  // Harcourt" (a city) standing in for "Rivers" (its state). This maps
  // those known synonyms, keyed by normalized name, onto the normalized
  // shapeName they should resolve to.
  aliases?: Record<string, string>;
}

export const COUNTRY_MAPS: CountryMapMeta[] = [
  {
    code: 'NG',
    name: 'Nigeria',
    regionLabel: 'State',
    geoUrl: '/geo/nigeria.geojson',
    center: [9.082, 8.6753],
    zoom: 6,
    attribution: '© geoBoundaries.org (CC BY 4.0)',
    aliases: {
      'port harcourt': 'rivers',
      'fct': 'abuja',
    },
  },
  {
    code: 'GH',
    name: 'Ghana',
    regionLabel: 'Region',
    geoUrl: '/geo/ghana.geojson',
    center: [7.9465, -1.0232],
    zoom: 6,
    attribution: '© geoBoundaries.org (CC BY 4.0)',
  },
  {
    code: 'KE',
    name: 'Kenya',
    regionLabel: 'County',
    geoUrl: '/geo/kenya.geojson',
    center: [0.0236, 37.9062],
    zoom: 6,
    attribution: '© geoBoundaries.org (CC BY 4.0)',
  },
];

// Strips common admin-level suffixes and hyphens so names from different
// sources compare equal regardless of exact formatting — e.g. "Akwa-Ibom",
// "Akwa Ibom" and "Akwa Ibom State" all normalize to "akwa ibom"; "Abuja
// Federal Capital Territory" normalizes to "abuja". Real order data often
// has a null/empty stop.state (never geocoded) — that's expected, not an
// error, so this returns '' rather than throwing.
export function normalizeRegionName(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/\b(region|state|province|county|federal capital territory)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveRegionName(country: CountryMapMeta, raw: string | null | undefined): string {
  const normalized = normalizeRegionName(raw);
  return country.aliases?.[normalized] ?? normalized;
}
