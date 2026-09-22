/**
 * Chargeable weight — what a consignment actually bills at.
 *
 * Freight is priced on the greater of what a consignment *weighs* and what it
 * *occupies*, because a truck runs out of space long before it runs out of
 * payload. Volumetric weight converts volume into a weight-equivalent using a
 * divisor, and the larger of the two figures is charged.
 *
 * The divisors below are industry standards, not Azapal's invention:
 *   6000  IATA air freight
 *   5000  express couriers (DHL, FedEx, UPS) — the same box costs more here
 *   1000  sea LCL, i.e. one cubic metre bills as 1,000 kg
 * Road freight has no single standard — it is set per carrier — so it defaults
 * to a common value and is editable. Always confirm the divisor in the
 * contract rather than assuming one.
 *
 * ── Declared vs measured ──────────────────────────────────────────────────
 * Weight is captured twice, and the two answer different questions:
 *   declared  — what the customer says at booking. Enables an instant quote,
 *               and is frequently wrong.
 *   measured  — what the rider records at pickup. Accurate, but too late to
 *               have quoted on.
 * The gap between them is the reweigh adjustment, which is a revenue line in
 * its own right rather than an error to hide.
 */

export interface DivisorPreset {
  id: string;
  label: string;
  divisor: number;
  note: string;
}

export const DIVISOR_PRESETS: DivisorPreset[] = [
  { id: "road", label: "Road freight", divisor: 4000, note: "No single standard — confirm yours" },
  { id: "courier", label: "Express courier", divisor: 5000, note: "DHL, FedEx, UPS" },
  { id: "air", label: "Air freight", divisor: 6000, note: "IATA standard" },
  { id: "sea", label: "Sea LCL", divisor: 1000, note: "1 m³ bills as 1,000 kg" },
];

/** Centimetres in, kilograms out. Returns 0 if any dimension is missing. */
export const volumetricWeight = (
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  divisor: number,
): number => {
  if (!lengthCm || !widthCm || !heightCm || !divisor) return 0;
  return (lengthCm * widthCm * heightCm) / divisor;
};

export interface ChargeableResult {
  actual: number;
  volumetric: number;
  chargeable: number;
  /** Which figure won — what the customer is actually paying on. */
  basis: "actual" | "volumetric" | "none";
  /** Kilograms billed above the real mass. This is the "paying for air" figure. */
  airKg: number;
}

export const chargeableWeight = (actual: number, volumetric: number): ChargeableResult => {
  if (!actual && !volumetric) {
    return { actual: 0, volumetric: 0, chargeable: 0, basis: "none", airKg: 0 };
  }
  const chargeable = Math.max(actual, volumetric);
  return {
    actual,
    volumetric,
    chargeable,
    basis: volumetric > actual ? "volumetric" : "actual",
    airKg: Math.max(0, volumetric - actual),
  };
};

/** base + per-kg against a cargo rate card. */
export const priceFor = (chargeable: number, basePrice: number, pricePerKg: number) =>
  basePrice + chargeable * pricePerKg;

export interface Reweigh {
  declaredChargeable: number;
  measuredChargeable: number;
  deltaKg: number;
  deltaAmount: number;
  direction: "under" | "over" | "exact";
}

/**
 * What the reweigh is worth. `under` means the customer declared less than the
 * consignment actually bills at — the adjustment is owed to the partner.
 */
export const reweigh = (
  declaredChargeable: number,
  measuredChargeable: number,
  pricePerKg: number,
): Reweigh => {
  const deltaKg = measuredChargeable - declaredChargeable;
  return {
    declaredChargeable,
    measuredChargeable,
    deltaKg,
    deltaAmount: deltaKg * pricePerKg,
    direction: deltaKg > 0.001 ? "under" : deltaKg < -0.001 ? "over" : "exact",
  };
};

export const kg = (n: number) => `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg`;
export const naira = (n: number) =>
  `₦${Math.round(n).toLocaleString()}`;
