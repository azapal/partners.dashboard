/**
 * Pay-as-you-go billing — what the partner owes *Azapal* for the platform.
 *
 * DIRECTION MATTERS. The invoices and receipts under /financials are the
 * partner billing their own customers. Everything in this file is the opposite
 * arrow: Azapal billing the partner. They are never the same documents, and the
 * two should not be conflated in copy, search keywords or navigation.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * THE PRICES BELOW ARE PLACEHOLDERS. There is no billing backend yet — no plan,
 * subscription or usage model exists server-side — so these figures are
 * illustrative structure, not commercial terms. The screen says so out loud,
 * and it must keep saying so until real metering replaces `SAMPLE_*`.
 * ────────────────────────────────────────────────────────────────────────────
 */

export type BillableUnit = "per_month" | "per_unit" | "percentage";

export interface BillableFeature {
  id: string;
  name: string;
  /** What triggers a charge, in the partner's language. */
  description: string;
  icon: string;
  unit: BillableUnit;
  /** Naira for per_month/per_unit; percent for percentage. */
  price: number;
  /** What one billable unit is, e.g. "account", "message". */
  unitLabel?: string;
  /** Upper bound on a percentage charge, in naira. */
  cap?: number;
  /** Where the partner turns this on or off. */
  manageAt?: string;
}

export const BILLABLE_FEATURES: BillableFeature[] = [
  {
    id: "virtual-accounts",
    name: "Virtual accounts",
    description: "Each dedicated NUBAN account you keep open.",
    icon: "ri-bank-card-2-line",
    unit: "per_month",
    price: 500,
    unitLabel: "account",
    manageAt: "/financials?tab=accounts",
  },
  {
    id: "whatsapp",
    name: "WhatsApp notifications",
    description: "Each operational alert delivered on WhatsApp.",
    icon: "ri-whatsapp-line",
    unit: "per_unit",
    price: 12,
    unitLabel: "message",
    manageAt: "/settings?tab=notifications",
  },
  {
    id: "payment-links",
    name: "Payment links",
    description: "Collection fee on each invoice paid through a hosted link.",
    icon: "ri-link",
    unit: "percentage",
    price: 1.5,
    cap: 2000,
    unitLabel: "payment",
    manageAt: "/financials?tab=invoices",
  },
  {
    id: "session-checkout",
    name: "Session Checkout",
    description: "Each escrow-held delivery session opened.",
    icon: "ri-shield-keyhole-line",
    unit: "per_unit",
    price: 250,
    unitLabel: "session",
  },
  {
    id: "logn",
    name: "Logistics network",
    description: "Each paired-delivery opportunity you join from the network.",
    icon: "ri-route-line",
    unit: "per_unit",
    price: 150,
    unitLabel: "join",
    manageAt: "/logistics-network",
  },
  {
    id: "mobility",
    name: "Mobility",
    description: "Your branded customer app, once it is live in the stores.",
    icon: "ri-smartphone-line",
    unit: "per_month",
    price: 45000,
    unitLabel: "app",
    manageAt: "/mobility",
  },
  {
    id: "api",
    name: "API & webhooks",
    description: "Outbound signed events and API calls, per 10,000.",
    icon: "ri-terminal-box-line",
    unit: "per_unit",
    price: 1500,
    unitLabel: "10k calls",
    manageAt: "/settings?tab=developer",
  },
];

/**
 * Naive pluralisation — enough for the unit nouns above (account, message,
 * session, join, payment). Revisit if a unit ever needs a real rule.
 */
export const pluraliseUnit = (quantity: number, unitLabel?: string) => {
  if (!unitLabel) return "";
  if (quantity === 1 || /calls$/.test(unitLabel)) return unitLabel;
  return `${unitLabel}s`;
};

export const formatPrice = (feature: BillableFeature) => {
  if (feature.unit === "percentage") {
    return `${feature.price}%${feature.cap ? ` (capped at ₦${feature.cap.toLocaleString()})` : ""}`;
  }
  const suffix = feature.unit === "per_month" ? `/${feature.unitLabel ?? "month"}/mo` : ` per ${feature.unitLabel}`;
  return `₦${feature.price.toLocaleString()}${suffix}`;
};

/* ── Sample data ───────────────────────────────────────────────────────────
   Stands in for the usage/billing endpoints that do not exist yet. Named
   SAMPLE_* so no caller can mistake it for live figures, and so deleting it
   when the API lands is a single grep. */

export interface UsageLine {
  featureId: string;
  quantity: number;
  amount: number;
}

export interface PlatformBill {
  id: string;
  reference: string;
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
  dueAt: string;
  amount: number;
  status: "paid" | "due" | "overdue";
  lines: UsageLine[];
}

export interface PlatformReceipt {
  id: string;
  reference: string;
  billReference: string;
  paidAt: string;
  amount: number;
  method: string;
}

export const SAMPLE_CURRENT_USAGE: UsageLine[] = [
  { featureId: "virtual-accounts", quantity: 4, amount: 2000 },
  { featureId: "whatsapp", quantity: 365, amount: 4380 },
  { featureId: "payment-links", quantity: 38, amount: 9120 },
  { featureId: "session-checkout", quantity: 12, amount: 3000 },
  { featureId: "logn", quantity: 6, amount: 900 },
];

export const SAMPLE_BILLS: PlatformBill[] = [
  {
    id: "b-2026-08",
    reference: "AZP-BILL-2608",
    periodStart: "2026-08-01",
    periodEnd: "2026-08-31",
    issuedAt: "2026-09-01",
    dueAt: "2026-09-14",
    amount: 21430,
    status: "paid",
    lines: [
      { featureId: "virtual-accounts", quantity: 4, amount: 2000 },
      { featureId: "whatsapp", quantity: 402, amount: 4824 },
      { featureId: "payment-links", quantity: 44, amount: 11106 },
      { featureId: "session-checkout", quantity: 14, amount: 3500 },
    ],
  },
  {
    id: "b-2026-07",
    reference: "AZP-BILL-2607",
    periodStart: "2026-07-01",
    periodEnd: "2026-07-31",
    issuedAt: "2026-08-01",
    dueAt: "2026-08-14",
    amount: 18960,
    status: "paid",
    lines: [
      { featureId: "virtual-accounts", quantity: 3, amount: 1500 },
      { featureId: "whatsapp", quantity: 355, amount: 4260 },
      { featureId: "payment-links", quantity: 39, amount: 10200 },
      { featureId: "logn", quantity: 20, amount: 3000 },
    ],
  },
];

export const SAMPLE_RECEIPTS: PlatformReceipt[] = [
  {
    id: "r-2608",
    reference: "AZP-RCPT-2608",
    billReference: "AZP-BILL-2608",
    paidAt: "2026-09-03",
    amount: 21430,
    method: "Wallet debit",
  },
  {
    id: "r-2607",
    reference: "AZP-RCPT-2607",
    billReference: "AZP-BILL-2607",
    paidAt: "2026-08-02",
    amount: 18960,
    method: "Card ending 4417",
  },
];
