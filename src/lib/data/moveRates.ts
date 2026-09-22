/**
 * Move rates — pricing a relocation rather than a consignment.
 *
 * The four existing rate surfaces (region, route, cargo, delivery method) all
 * assume freight: something with a weight and two points. A move has neither in
 * any useful sense. "Three-bedroom flat, Lekki to Ikeja, third floor, no lift,
 * two-man crew" is priced on *volume, access and labour*, which is why movers
 * quote from a grid rather than a per-kg figure.
 *
 * The model here is the one a moving company actually publishes:
 *
 *   base            a grid of property size × distance band
 *   modifiers       what changes that base — stairs, packing, storage
 *   custom fields   whatever this partner asks that we didn't anticipate
 *
 * ── Country and currency ───────────────────────────────────────────────────
 * A price list belongs to a country, and a country carries a currency. This is
 * deliberately not one global list with a conversion: a mover in Accra sets
 * Ghanaian prices in cedis, not Nigerian prices converted. The PRD already
 * points this way — LogN expands past Nigeria into East and Francophone West
 * Africa — so multi-country is the shape from the start rather than a retrofit.
 *
 * ── The numbers below are a template, not a price list ─────────────────────
 * Defaults are a plausible starting grid drawn from how relocation companies
 * structure quotes. They exist so a partner edits rather than starts blank.
 * Nothing here is a recommendation about what to charge.
 */

export interface Currency {
  code: string;
  symbol: string;
  country: string;
}

export const COUNTRIES: Currency[] = [
  { country: "Nigeria", code: "NGN", symbol: "₦" },
  { country: "Ghana", code: "GHS", symbol: "GH₵" },
  { country: "Kenya", code: "KES", symbol: "KSh" },
  { country: "South Africa", code: "ZAR", symbol: "R" },
  { country: "United Kingdom", code: "GBP", symbol: "£" },
  { country: "United States", code: "USD", symbol: "$" },
  { country: "United Arab Emirates", code: "AED", symbol: "AED " },
];

/** What is being moved. Volume is the estimate a surveyor would start from. */
export interface PropertySize {
  id: string;
  label: string;
  /** Typical load in cubic metres — the unit movers actually think in. */
  volumeCbm: number;
}

export const PROPERTY_SIZES: PropertySize[] = [
  { id: "studio", label: "Studio / single room", volumeCbm: 8 },
  { id: "1bed", label: "1 bedroom", volumeCbm: 15 },
  { id: "2bed", label: "2 bedrooms", volumeCbm: 25 },
  { id: "3bed", label: "3 bedrooms", volumeCbm: 35 },
  { id: "4bed", label: "4+ bedrooms", volumeCbm: 50 },
  { id: "office-s", label: "Office — small", volumeCbm: 20 },
  { id: "office-l", label: "Office — large", volumeCbm: 60 },
];

export interface DistanceBand {
  id: string;
  label: string;
  hint: string;
}

export const DISTANCE_BANDS: DistanceBand[] = [
  { id: "local", label: "Within city", hint: "Same metro area" },
  { id: "intercity", label: "Intercity", hint: "Neighbouring state or region" },
  { id: "long", label: "Long distance", hint: "Cross-country" },
];

export type ModifierKind = "flat" | "per_floor" | "per_hour" | "per_week" | "percent";

export interface MoveModifier {
  id: string;
  label: string;
  hint: string;
  kind: ModifierKind;
  /** In the set's own currency for flat kinds; a percentage of base for `percent`. */
  amount: number;
  enabled: boolean;
}

export type CustomFieldType = "text" | "number" | "select" | "boolean";

export interface MoveCustomField {
  id: string;
  label: string;
  type: CustomFieldType;
  /**
   * The answers a `select` offers. Trimmed and non-empty by the time they're
   * saved; read through `fieldOptions`, which also tidies lists kept in the
   * browser before there was a backend.
   */
  options?: string[];
  /** Charged per unit for `number`, once for `boolean`. 0 = informational only. */
  amount: number;
}

/**
 * Only a count or a yes/no has an obvious price. A text answer has nothing to
 * multiply, and a choice would need a price per option rather than one amount
 * for the whole question — so both are recorded, never charged.
 */
export const isPricedFieldType = (type: CustomFieldType) => type === "number" || type === "boolean";

export const fieldOptions = (field: MoveCustomField) =>
  (field.options ?? []).map((o) => o.trim()).filter(Boolean);

/** One country's complete price list. */
export interface MoveRateSet {
  country: string;
  currency: string;
  symbol: string;
  /** Keyed `${propertySizeId}:${distanceBandId}`. */
  base: Record<string, number>;
  modifiers: MoveModifier[];
  customFields: MoveCustomField[];
  /** When the account's copy was last saved. Absent on a list never saved. */
  updatedAt?: string;
}

export const currencySymbol = (code: string) =>
  COUNTRIES.find((c) => c.code === code)?.symbol ?? `${code} `;

/**
 * A list reduced to what it means. The server drops zero cells, trims text and
 * hands JSON back in its own key order (Postgres jsonb reorders object keys),
 * so comparing bytes would call a list that was just saved "changed".
 */
const canonical = (s: MoveRateSet) =>
  JSON.stringify([
    Object.entries(s.base)
      .filter(([, v]) => v > 0)
      .sort(([a], [b]) => (a < b ? -1 : 1)),
    s.modifiers.map((m) => [m.id, m.label.trim(), (m.hint ?? "").trim(), m.kind, m.amount, m.enabled]),
    s.customFields.map((f) => [
      f.id,
      f.label.trim(),
      f.type,
      isPricedFieldType(f.type) ? f.amount : 0,
      f.type === "select" ? fieldOptions(f) : [],
    ]),
  ]);

/** Whether two lists would price and read identically. */
export const sameRateSet = (a: MoveRateSet, b: MoveRateSet) => canonical(a) === canonical(b);

const NGN_BASE: Record<string, number> = {
  "studio:local": 85000, "studio:intercity": 180000, "studio:long": 320000,
  "1bed:local": 120000, "1bed:intercity": 240000, "1bed:long": 420000,
  "2bed:local": 180000, "2bed:intercity": 350000, "2bed:long": 600000,
  "3bed:local": 260000, "3bed:intercity": 480000, "3bed:long": 820000,
  "4bed:local": 380000, "4bed:intercity": 690000, "4bed:long": 1150000,
  "office-s:local": 220000, "office-s:intercity": 420000, "office-s:long": 700000,
  "office-l:local": 550000, "office-l:intercity": 980000, "office-l:long": 1600000,
};

/**
 * The modifiers a relocation quote actually turns on. Access charges exist
 * because a third-floor walk-up is a different job from a ground-floor move
 * with a loading bay, and it is the commonest cause of a quote being wrong.
 */
export const DEFAULT_MODIFIERS: MoveModifier[] = [
  { id: "stairs", label: "Stairs, no lift", hint: "Charged per floor above ground", kind: "per_floor", amount: 15000, enabled: true },
  { id: "long-carry", label: "Long carry", hint: "Parking more than ~50m from the door", kind: "flat", amount: 20000, enabled: true },
  { id: "packing", label: "Professional packing", hint: "Crew packs, as a share of the base", kind: "percent", amount: 25, enabled: true },
  { id: "materials", label: "Packing materials", hint: "Boxes, wrap, tape", kind: "flat", amount: 35000, enabled: true },
  { id: "dismantle", label: "Dismantle & reassemble", hint: "Beds, wardrobes, desks", kind: "flat", amount: 45000, enabled: true },
  { id: "storage", label: "Storage", hint: "Held between collection and delivery", kind: "per_week", amount: 60000, enabled: true },
  { id: "special", label: "Special item", hint: "Piano, safe, aquarium, artwork", kind: "flat", amount: 80000, enabled: false },
  { id: "waiting", label: "Waiting time", hint: "Crew held on site beyond the estimate", kind: "per_hour", amount: 12000, enabled: false },
];

export const DEFAULT_CUSTOM_FIELDS: MoveCustomField[] = [
  { id: "floors", label: "Floors above ground", type: "number", amount: 0 },
  { id: "lift", label: "Lift available", type: "boolean", amount: 0 },
  { id: "declared", label: "Declared value of goods", type: "number", amount: 0 },
];

export const defaultRateSet = (country: string): MoveRateSet => {
  const c = COUNTRIES.find((x) => x.country === country) ?? COUNTRIES[0];
  return {
    country: c.country,
    currency: c.code,
    symbol: c.symbol,
    // Only Nigeria ships with a populated grid; every other country starts
    // blank rather than inheriting converted naira, which would be a guess
    // presented as a price.
    base: c.country === "Nigeria" ? { ...NGN_BASE } : {},
    modifiers: DEFAULT_MODIFIERS.map((m) => ({ ...m, amount: c.country === "Nigeria" ? m.amount : 0 })),
    customFields: DEFAULT_CUSTOM_FIELDS.map((f) => ({ ...f })),
  };
};

export const baseKey = (sizeId: string, bandId: string) => `${sizeId}:${bandId}`;

export interface QuoteLine {
  label: string;
  detail?: string;
  amount: number;
}

export interface MoveQuote {
  lines: QuoteLine[];
  total: number;
  volumeCbm: number;
}

/**
 * Builds the quote. `selections` maps a modifier id to its quantity — floors
 * for per_floor, hours for per_hour, weeks for per_week, and 1/0 for the rest.
 * `customValues` does the same for custom fields: the count for `number`, 1/0
 * for `boolean`.
 */
export const buildQuote = (
  set: MoveRateSet,
  sizeId: string,
  bandId: string,
  selections: Record<string, number>,
  customValues: Record<string, number> = {},
): MoveQuote => {
  const size = PROPERTY_SIZES.find((s) => s.id === sizeId);
  const base = set.base[baseKey(sizeId, bandId)] ?? 0;
  const lines: QuoteLine[] = [];

  if (base > 0) {
    lines.push({
      label: size?.label ?? "Move",
      detail: DISTANCE_BANDS.find((b) => b.id === bandId)?.label,
      amount: base,
    });
  }

  for (const mod of set.modifiers) {
    if (!mod.enabled) continue;
    const qty = selections[mod.id] ?? 0;
    if (qty <= 0) continue;
    const amount =
      mod.kind === "percent" ? (base * mod.amount) / 100 : mod.amount * qty;
    if (amount <= 0) continue;
    const detail =
      mod.kind === "per_floor" ? `${qty} floor${qty === 1 ? "" : "s"}`
      : mod.kind === "per_hour" ? `${qty} hour${qty === 1 ? "" : "s"}`
      : mod.kind === "per_week" ? `${qty} week${qty === 1 ? "" : "s"}`
      : mod.kind === "percent" ? `${mod.amount}% of base`
      : undefined;
    lines.push({ label: mod.label, detail, amount });
  }

  for (const field of set.customFields) {
    if (!field.amount || !isPricedFieldType(field.type)) continue;
    const value = customValues[field.id] ?? 0;
    if (value <= 0) continue;
    lines.push({
      label: field.label,
      detail: field.type === "number" ? `${value} × ${money(set.symbol, field.amount)}` : undefined,
      amount: field.amount * (field.type === "boolean" ? 1 : value),
    });
  }

  return {
    lines,
    total: lines.reduce((sum, l) => sum + l.amount, 0),
    volumeCbm: size?.volumeCbm ?? 0,
  };
};

export const money = (symbol: string, n: number) =>
  `${symbol}${Math.round(n).toLocaleString()}`;
