import type { Transaction } from "../service/partnerService";

/**
 * The custody chain for one consignment.
 *
 * The PRD's opening argument (§02) is that the chain of custody "is unbroken in
 * the real world and broken in the software" — nothing reconciles, and custody
 * can't be proven when a parcel is disputed. This assembles that chain from data
 * the platform *already* produces, ahead of Pillars 2 and 3: the order record,
 * its stops, the assigned driver, the pickup code and the Session Checkout code.
 *
 * ── The honest part ────────────────────────────────────────────────────────
 * There is no event log. A Transaction carries `created_at`, `confirmed_at` and
 * `updated_at` and nothing else — so the *order* of the links is derivable, but
 * most of their *timings* are not. Rather than invent plausible timestamps,
 * every link declares how well it is evidenced:
 *
 *   proven    — a hard artefact exists (a code that was entered, a named party,
 *               a recorded timestamp). This link would survive a dispute.
 *   recorded  — the platform knows it happened, but not when.
 *   inferred  — implied only by the order's current status. No evidence.
 *   pending   — hasn't happened yet.
 *
 * That column is the product. It shows a partner exactly where their chain
 * would fail to prove anything, which is the gap the event log has to close.
 */

export type LinkEvidence = "proven" | "recorded" | "inferred" | "pending";

export interface CustodyLink {
  id: string;
  label: string;
  /** Who holds the consignment after this link. */
  holder: string;
  detail: string;
  icon: string;
  evidence: LinkEvidence;
  /** Only set where the record genuinely carries one. */
  at?: string | null;
  /** The artefact that proves it, e.g. a pickup code or session code. */
  proof?: string;
}

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  approved: 1,
  shipped: 2,
  delivered: 3,
};

const reached = (status: string, stage: keyof typeof STATUS_ORDER) =>
  (STATUS_ORDER[status] ?? -1) >= STATUS_ORDER[stage];

export const deriveCustodyChain = (tx: Transaction): CustodyLink[] => {
  const status = String(tx.status ?? "").toLowerCase();
  const canceled = status === "canceled";
  const pickupStop = tx.stops?.find((s) => s.stop_type === "pickup");
  const dropStops = tx.stops?.filter((s) => s.stop_type === "delivery") ?? [];
  const sender = tx.vendor_business_id_no?.name ?? tx.dispatch_business_id_no?.name ?? "Sender";

  const links: CustodyLink[] = [];

  links.push({
    id: "booked",
    label: "Booked",
    holder: sender,
    detail: pickupStop?.address ?? "Pickup address not recorded",
    icon: "ri-inbox-archive-line",
    // A creation timestamp is a real artefact, so this link is provable.
    evidence: "proven",
    at: tx.created_at,
    proof: tx.reference ?? `#${tx.id}`,
  });

  links.push({
    id: "accepted",
    label: "Accepted by branch",
    holder: tx.branch?.branch_code ? `${tx.branch.branch_code}` : "Unassigned branch",
    detail: tx.branch ? "Branch took responsibility for fulfilment" : "No branch on this order",
    icon: "ri-git-branch-line",
    evidence: tx.branch ? (tx.confirmed_at ? "proven" : "recorded") : "pending",
    at: tx.confirmed_at,
  });

  links.push({
    id: "assigned",
    label: "Driver assigned",
    holder: tx.driver?.name ?? "No driver yet",
    detail: tx.driver
      ? `${tx.driver.phone ?? "no phone on file"}${tx.driver.is_verified ? " · verified" : " · unverified"}`
      : "Custody has not left the branch",
    icon: "ri-steering-2-line",
    // A named, verified party is evidence; an unverified one is weaker but real.
    evidence: tx.driver ? (tx.driver.is_verified ? "proven" : "recorded") : "pending",
  });

  links.push({
    id: "pickup",
    label: "Picked up",
    holder: tx.driver?.name ?? "Rider",
    detail: tx.pickup_code
      ? "Released against a pickup code"
      : reached(status, "shipped")
        ? "No pickup code on this order — handover is unevidenced"
        : "Not collected yet",
    icon: "ri-hand-coin-line",
    // The code is the whole point: it is what makes the handover arguable.
    evidence: tx.pickup_code ? "proven" : reached(status, "shipped") ? "inferred" : "pending",
    proof: tx.pickup_code ?? undefined,
  });

  links.push({
    id: "transit",
    label: "In transit",
    holder: tx.driver?.name ?? "Rider",
    detail: dropStops.length
      ? `${dropStops.length} drop-off${dropStops.length === 1 ? "" : "s"} on this run`
      : "No delivery stop recorded",
    icon: "ri-route-line",
    evidence: reached(status, "shipped") ? "inferred" : "pending",
  });

  links.push({
    id: "handover",
    label: "Handed over",
    holder: dropStops[dropStops.length - 1]?.address ?? "Recipient",
    detail: tx.session_code
      ? "Confirmed in a Checkout session, which released the escrow"
      : reached(status, "delivered")
        ? "Marked delivered, but no confirmation artefact was captured"
        : "Not delivered yet",
    icon: "ri-shake-hands-line",
    evidence: tx.session_code && reached(status, "delivered")
      ? "proven"
      : reached(status, "delivered")
        ? "inferred"
        : "pending",
    proof: tx.session_code ?? undefined,
  });

  if (canceled) {
    links.push({
      id: "canceled",
      label: "Cancelled",
      holder: "—",
      detail: "The chain was ended before handover",
      icon: "ri-close-circle-line",
      evidence: "recorded",
      at: tx.updated_at ?? null,
    });
  }

  return links;
};

/** How much of the chain would actually survive a dispute. */
export const custodyStrength = (links: CustodyLink[]) => {
  const happened = links.filter((l) => l.evidence !== "pending");
  const proven = happened.filter((l) => l.evidence === "proven").length;
  const weak = happened.filter((l) => l.evidence === "inferred").length;
  return {
    happened: happened.length,
    proven,
    weak,
    percent: happened.length ? Math.round((proven / happened.length) * 100) : 0,
  };
};

export const EVIDENCE_STYLE: Record<LinkEvidence, { label: string; dot: string; chip: string }> = {
  proven: { label: "Proven", dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" },
  recorded: { label: "Recorded", dot: "bg-blue-500", chip: "bg-blue-50 text-blue-700" },
  inferred: { label: "No evidence", dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700" },
  pending: { label: "Not yet", dot: "bg-slate-300", chip: "bg-slate-100 text-slate-500" },
};
