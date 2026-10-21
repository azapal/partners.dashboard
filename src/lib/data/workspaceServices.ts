/**
 * The workspace service catalogue that backs the apps launcher.
 *
 * Derived from the Azapal platform PRD (§07 Operations, §08 the money model,
 * §09 Session Checkout, §10 Notifications, §11 Fleet, §12 Inventory, §13 the
 * Management Assistant). It is deliberately the *whole* product surface rather
 * than only what is routable today: the launcher exists to show a partner what
 * Azapal covers, so unbuilt surfaces are listed and marked rather than hidden.
 *
 * ── One entry per destination ──────────────────────────────────────────────
 * Every routable entry points somewhere no other entry does. The catalogue used
 * to list each *feature* — payment links, transfer reconciliation and the
 * hosted checkout page were three rows that all opened the invoices tab — and
 * the launcher grew past eighty rows that were mostly the same dozen screens.
 * A feature that lives on a screen belongs in that screen's description and
 * keywords, where search still finds it, not in a row of its own.
 *
 * ── Grouping ───────────────────────────────────────────────────────────────
 * The routable groups mirror the sidebar categories in navCategories.ts (Last
 * mile, Customers, Customer channels, Financials, Logistics network, Workspace), so the
 * launcher and the rail agree on where a screen lives. Groups whose every
 * entry is `soon` are scope only; the launcher derives that from the items
 * (see `isPlannedGroup`) and shelves them under a "Coming soon" heading, so
 * keep them after the routable groups.
 *
 * ── The logistics types ────────────────────────────────────────────────────
 * The catalogue is structured so every standard logistics type has somewhere to
 * live, even where nothing is built. Functional groups (Customers, Financials, Workspace) cut
 * across all of them and are not types:
 *
 *   Outbound      → Last mile                     (shipped)
 *   Inbound       → Inventory & warehousing       (scope only)
 *   3PL / 4PL     → Logistics network             (partly shipped)
 *   Cold chain    → Cold chain                    (scope only)
 *   Reverse       → Reverse logistics             (scope only)
 *   Green         → Green logistics               (scope only)
 *
 * Reverse and Green are absent from the PRD entirely, so their scope is drawn
 * from standard practice rather than an internal decision — returns management
 * (gatekeeping → RMA → collection → inspection/grading → disposition) and the
 * GLEC Framework / ISO 14083 method for freight emissions. Treat those entries
 * as a starting point for a real scoping conversation, not a committed spec.
 *
 * `status` mirrors the PRD's own shipped / partial / not-built marking:
 *   live    — built here and routable
 *   partial — routable, but the PRD flags a gap behind it
 *   soon    — scope only; there is nothing to open, so the row is inert
 *
 * An entry is routable if and only if it carries `to`. Keep that in step with
 * `status`: a `soon` entry must not carry one.
 */
export type ServiceStatus = "live" | "partial" | "soon";

export interface WorkspaceService {
  label: string;
  description: string;
  icon: string;
  status: ServiceStatus;
  /** Omitted for `soon` entries — there is no destination yet. */
  to?: string;
  /**
   * For surfaces that are not a route. "assistant" opens the Azapal overlay
   * rather than navigating; the launcher treats it as routable.
   */
  launch?: "assistant";
  keywords?: string[];
}

export interface ServiceGroup {
  label: string;
  /** One line, shown under the group heading. */
  caption: string;
  /**
   * A paragraph explaining what this area is for and when a partner would come
   * here — the thing a caption has no room for.
   */
  description: string;
  /**
   * Walkthrough for this area. None are recorded yet, so the launcher shows an
   * honest placeholder rather than an empty player; set this and it plays.
   */
  videoUrl?: string;
  items: WorkspaceService[];
}

export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    label: "Last mile",
    caption: "Outbound logistics — what you sell, and every order that moves.",
    description:
      "The delivery operation itself — everything between a customer asking for a collection and a parcel changing hands. Start here to price what you carry, define where you carry it, and watch the orders currently moving. Most of a partner's day is spent in this group.",
    items: [
      { label: "Dashboard", description: "Your day at a glance.", icon: "ri-home-6-line", status: "live", to: "/dashboard", keywords: ["home", "overview", "summary"] },
      { label: "Monthly performance", description: "How the operation moved, month over month.", icon: "ri-line-chart-line", status: "live", to: "/dashboard/performance", keywords: ["reports", "analytics", "performance"] },
      { label: "Orders & dispatch", description: "Order lifecycle, driver assignment and pickup/delivery handoff codes.", icon: "ri-exchange-line", status: "live", to: "/transactions", keywords: ["deliveries", "transactions", "jobs", "handoff code", "pickup code", "release"] },
      { label: "Services & coverage", description: "What you offer, and the areas you cover.", icon: "ri-task-line", status: "live", to: "/service", keywords: ["offerings", "catalogue"] },
      { label: "Rates & rate cards", description: "Region, route, cargo and delivery-method pricing.", icon: "ri-price-tag-3-line", status: "live", to: "/rates", keywords: ["pricing", "price"] },
      { label: "Chargeable weight", description: "Quote on declared weight, settle on what the rider measured.", icon: "ri-scales-3-line", status: "partial", to: "/chargeable-weight", keywords: ["chargeable weight", "kg", "dimensions", "volumetric", "dim weight", "cube", "paying for air", "measure", "reweigh"] },
      { label: "Custody chain", description: "Every handover on a consignment, and the evidence behind each one.", icon: "ri-shake-hands-line", status: "partial", to: "/custody", keywords: ["custody", "handover", "handoff", "chain of custody", "proof", "evidence", "dispute", "lost item", "timeline"] },
    ],
  },
  {
    label: "Customers",
    caption: "Everyone who has booked, asked for a quote or paid you — and emailing them.",
    description:
      "One list of your customers from every service you run: quote requests, orders, invoices and checkout. Search and filter it, then email one customer or run a campaign — promotions, seasonal notes, discounts — sent through Azapal under your name, with replies coming straight to you.",
    items: [
      { label: "Customers & email", description: "Everyone who has booked, asked for a quote or paid you, across all your services — and email campaigns to them: promos, seasonal notes, discounts.", icon: "ri-user-3-line", status: "live", to: "/customers", keywords: ["customers", "clients", "email", "emails", "campaigns", "email campaigns", "newsletter", "promo", "promotion", "discount", "seasonal", "bulk email", "marketing", "templates"] },
    ],
  },
  {
    label: "Customer channels",
    caption: "What you resell — the surfaces your own customers quote, book and track on.",
    description:
      "The surfaces your customers touch rather than the ones you work in. A branded app, a page they get a price on, a link they track with, an API your larger accounts integrate against. This is where a partner stops being a dashboard user and starts being a service provider.",
    items: [
      { label: "Quote page", description: "A public page customers price a job on or ask you for a price — and the leads it brings in.", icon: "ri-price-tag-3-line", status: "partial", to: "/quote-page", keywords: ["quote", "instant quote", "quote form", "pricing page", "leads", "quote requests", "enquiries", "questions", "relocation", "moving", "self serve", "whatsapp", "instagram"] },
      { label: "Branded mobile app", description: "Your logistics service, in your customers' pocket under your name.", icon: "ri-smartphone-line", status: "partial", to: "/mobility", keywords: ["mobility", "white label", "branded", "ios", "android", "consumer app"] },
      { label: "Booking page", description: "Customers raise a delivery themselves, into your normal dispatch flow.", icon: "ri-calendar-check-line", status: "soon", keywords: ["book", "self serve", "order form", "web booking"] },
      { label: "Public tracking", description: "A link a customer opens without an account, backed by the custody chain.", icon: "ri-map-pin-time-line", status: "soon", keywords: ["tracking", "track and trace", "status page", "visibility"] },
      { label: "Partner API", description: "Scoped credentials so your larger customers integrate directly with you.", icon: "ri-terminal-box-line", status: "soon", keywords: ["api", "partner api", "integration", "developer", "keys", "rest"] },
    ],
  },
  {
    label: "Financials",
    caption: "Collecting from customers, paying out shares — and what you owe Azapal.",
    description:
      "Collecting from your customers, dividing what arrives between the people owed a share, and settling it out to their banks — the ledger, the splits and the payouts underneath everything else. The last two entries run the other direction: what you pay Azapal for the platform, metered per feature rather than sold as a plan.",
    items: [
      { label: "Wallet", description: "Partner and branch balances.", icon: "ri-wallet-3-line", status: "live", to: "/financials?tab=wallet", keywords: ["balance", "funds", "branch wallet"] },
      { label: "Virtual accounts", description: "Dedicated NUBAN accounts, scoped per branch.", icon: "ri-bank-card-2-line", status: "live", to: "/financials?tab=accounts", keywords: ["nuban", "account number"] },
      { label: "Invoices & payment links", description: "Invoices from your rates, a hosted checkout page for each, and matching bank transfers to them.", icon: "ri-file-list-3-line", status: "live", to: "/financials?tab=invoices", keywords: ["bill", "billing", "paystack", "checkout", "collect", "pay online", "payment page", "reconcile", "transfer reconciliation", "incoming", "credits"] },
      { label: "Receipts & branding", description: "Receipts, plus your logo, accent colour and footer.", icon: "ri-receipt-line", status: "live", to: "/financials?tab=receipts", keywords: ["template", "design", "logo"] },
      { label: "Payout splits", description: "Named arrangements for dividing what you collect.", icon: "ri-pie-chart-line", status: "live", to: "/financials?tab=split", keywords: ["split", "revenue share", "division"] },
      { label: "Stakeholders & payouts", description: "Counterparties you pay, and transfers out to their verified bank accounts.", icon: "ri-team-line", status: "live", to: "/stakeholders", keywords: ["collaborators", "third party", "vendors", "settlement", "withdraw", "transfer", "bank payout"] },
      { label: "Azapal bills", description: "What you owe Azapal — this month's usage and past bills. Not the invoices you send customers.", icon: "ri-bill-line", status: "live", to: "/bills", keywords: ["usage", "metering", "platform", "charges", "subscription", "pay as you go", "azapal invoice", "statement", "history"] },
      { label: "Billing method", description: "How each branch pays Azapal — a card we charge, or an account to transfer into.", icon: "ri-bank-card-line", status: "live", to: "/PaymentMethod", keywords: ["card", "bank transfer", "billing method", "payment method"] },
    ],
  },
  {
    label: "Logistics network",
    caption: "3PL & 4PL — trade routes, capacity and work with other partners.",
    description:
      "Other partners on Azapal, and the work you trade with them. List what you sell in the marketplace, post a brief for work you need done, and message partners directly. Offer a scheduled route and let someone join it, lend a vehicle standing idle, or pick up a load heading where you are already going. The revenue split runs on the machinery already built for your own payouts.",
    items: [
      { label: "Partner marketplace", description: "Find partners by category, see their branches on a map, post job briefs and message them.", icon: "ri-store-3-line", status: "live", to: "/marketplace", keywords: ["marketplace", "logistics partners", "partner directory", "partners list", "counterparties", "network members", "storefront", "listings", "public", "outsource", "hire"] },
      { label: "Job briefs", description: "Work partners need done, and the briefs you've posted. Answer one to win it.", icon: "ri-file-list-3-line", status: "live", to: "/job-briefs", keywords: ["brief", "briefs", "tender", "rfq", "jobs", "outsource"] },
      { label: "Partner inbox", description: "Your conversations with other partners.", icon: "ri-chat-3-line", status: "live", to: "/inbox", keywords: ["inbox", "messages", "direct message", "chat"] },
      { label: "Pairing routes", description: "Every partner's upcoming routes, and yours to add, edit or remove.", icon: "ri-route-line", status: "partial", to: "/pairing-routes", keywords: ["logn", "pairing", "paired delivery", "routes", "lanes"] },
      { label: "Fleet pairing", description: "Lend idle vehicles to the network, or take on someone else's load.", icon: "ri-truck-line", status: "partial", to: "/fleet-listing", keywords: ["fleet", "lend", "rent", "capacity sharing", "truck", "van", "earn"] },
    ],
  },
  {
    label: "Workspace",
    caption: "Locations, people, access and your own configuration.",
    description:
      "The places you operate from, the people who can get in and what they did, and your own configuration. A branch is the scope that wallets, invoices and rates inherit; roles are assigned by you rather than chosen from a fixed list. The screens you visit rarely but need to find quickly when you do.",
    items: [
      { label: "Branches", description: "Create, import and retire the places you work from.", icon: "ri-git-branch-line", status: "live", to: "/branches", keywords: ["locations", "offices", "sites", "import", "csv", "spreadsheet", "bulk"] },
      { label: "Team & roles", description: "Invitations, bulk import, assigned roles and deactivation.", icon: "ri-group-line", status: "live", to: "/users", keywords: ["staff", "users", "invite", "employees", "identity", "access", "permissions", "iam", "import", "csv", "bulk"] },
      { label: "Activity & sessions", description: "Who did what, and which sessions are open.", icon: "ri-history-line", status: "live", to: "/activity-log", keywords: ["audit", "logs", "history", "trail"] },
      { label: "Notifications", description: "Which operational events reach whom, on WhatsApp, SMS or email.", icon: "ri-notification-3-line", status: "partial", to: "/settings?tab=notifications", keywords: ["alerts", "whatsapp", "sms", "email", "preferences"] },
      { label: "Settings & security", description: "Business details, security and two-factor authentication.", icon: "ri-settings-3-line", status: "live", to: "/settings", keywords: ["preferences", "2fa", "totp", "mfa", "security", "account"] },
      { label: "Developer & webhooks", description: "Your API keys, endpoint configuration and signed outbound webhooks.", icon: "ri-terminal-box-line", status: "live", to: "/settings?tab=developer", keywords: ["developer", "keys", "credentials", "endpoint", "webhook", "hmac", "callbacks", "push events"] },
      { label: "Integrations", description: "Connect Azapal to the tools you already run.", icon: "ri-plug-line", status: "live", to: "/integration", keywords: ["connectors", "apps", "integration"] },
      { label: "Partner onboarding", description: "Get a new partner set up and live.", icon: "ri-user-add-line", status: "live", to: "/partners/onboarding", keywords: ["setup", "onboard"] },
      { label: "Management assistant", description: "Say what you need; it opens and fills the form. Reconciling and briefing still to come.", icon: "ri-sparkling-2-line", status: "partial", launch: "assistant", keywords: ["ai", "assistant", "chat", "brief", "azapal", "ask"] },
      { label: "Help centre", description: "Guides and answers to the common questions.", icon: "ri-question-line", status: "live", to: "/helpCenter", keywords: ["help", "docs", "support", "faq"] },
      { label: "Contact us", description: "Reach the Azapal team.", icon: "ri-customer-service-2-line", status: "live", to: "/contact", keywords: ["advisor", "contact", "talk"] },
    ],
  },

  // ── Scope only — every entry below is `soon`. ─────────────────────────────
  {
    label: "Session Checkout",
    caption: "A client, a vendor and a rider in one room, against one payment held until handoff.",
    description:
      "A client, a vendor and a rider in one room with one payment held in escrow until the goods change hands. The rider's handoff confirmation is what releases the money, which is why the code goes to the person receiving rather than the person delivering.",
    items: [
      { label: "Checkout sessions", description: "Escrow-held deliveries, with the session chat kept as dispute evidence.", icon: "ri-shield-keyhole-line", status: "soon", keywords: ["escrow", "session", "messages", "transcript", "chat"] },
      { label: "Dispute console", description: "Review a held session and settle it.", icon: "ri-error-warning-line", status: "soon", keywords: ["refund", "dispute", "hold"] },
    ],
  },
  {
    label: "Fleet & transport",
    caption: "Azapal TMS/FMS — vehicles as managed assets.",
    description:
      "Vehicles as managed assets rather than a line in a spreadsheet: what they cost to run, which documents are about to expire, who is driving them and what the telematics say. Scope for this area is agreed but not yet built. Lending a vehicle out already lives under Logistics network.",
    items: [
      { label: "Vehicles & drivers", description: "Make, plate, capacity and home branch — and who is driving it, when.", icon: "ri-truck-line", status: "soon", keywords: ["fleet", "vehicles", "tms", "fms", "drivers", "riders", "rota", "assignment"] },
      { label: "Compliance documents", description: "Insurance and roadworthiness, with renewals ahead of expiry.", icon: "ri-file-shield-2-line", status: "soon", keywords: ["insurance", "licence", "expiry"] },
      { label: "Maintenance & running costs", description: "Preventive schedules, repairs, fuel and cost per km.", icon: "ri-tools-line", status: "soon", keywords: ["service", "repair", "workshop", "fuel", "cost", "efficiency", "downtime"] },
      { label: "GPS & telematics", description: "Live position, route history and engine data.", icon: "ri-map-pin-line", status: "soon", keywords: ["tracking", "iot", "obd", "dashcam"] },
      { label: "Containers & seals", description: "Seal status and current holder across multi-leg shipments.", icon: "ri-archive-2-line", status: "soon", keywords: ["container", "seal", "shipment", "freight", "multi-leg", "custody"] },
    ],
  },
  {
    label: "Inventory & warehousing",
    caption: "Inbound logistics — receiving, storage and the movement cycle.",
    description:
      "Goods arriving, being stored, and leaving again — receiving, put-away, picking, packing and dispatch, each step recorded against the person who did it. The join that matters is the last one: a dispatch from the warehouse becoming an order in last mile without re-keying.",
    items: [
      { label: "Stock, SKUs & batches", description: "Lots and expiry dates, the unit a recall works in.", icon: "ri-stack-line", status: "soon", keywords: ["inventory", "sku", "ims", "warehouse"] },
      { label: "Locations & bins", description: "So a pick list is a route through the building.", icon: "ri-layout-grid-line", status: "soon", keywords: ["bins", "aisles", "storage"] },
      { label: "Receiving to dispatch", description: "Put-away, picking and packing, recorded per person.", icon: "ri-inbox-unarchive-line", status: "soon", keywords: ["picking", "packing", "movement"] },
    ],
  },
  {
    label: "Value-added services",
    caption: "Work you sell alongside the move — the classic 3PL margin line.",
    description:
      "The work you sell around the move rather than the move itself — repacking a consignment that is billing on air, consolidating several into one, labelling, crating, or simply charging for your advice. Historically the highest-margin line a 3PL runs.",
    items: [
      { label: "Repackaging & consolidation", description: "Repack to cut void space, or combine several consignments into one move.", icon: "ri-box-3-line", status: "soon", keywords: ["repack", "repackaging", "packing", "void fill", "right size", "consolidate", "groupage", "combine", "merge"] },
      { label: "Labelling & kitting", description: "Label, assemble or bundle goods before dispatch.", icon: "ri-price-tag-3-line", status: "soon", keywords: ["label", "kitting", "assembly", "bundle", "barcode"] },
      { label: "Palletising & crating", description: "Secure goods for haulage, including custom crates.", icon: "ri-archive-drawer-line", status: "soon", keywords: ["pallet", "crate", "shrink wrap", "strapping", "secure"] },
      { label: "Advisory & consultation", description: "Sell your expertise — listed, booked and paid like any other service.", icon: "ri-user-star-line", status: "soon", keywords: ["consultation", "advisory", "expertise", "audit", "packing advice"] },
    ],
  },
  {
    label: "Cold chain",
    caption: "Temperature-controlled logistics — proving the chain never broke.",
    description:
      "Temperature-controlled goods and the evidence that they stayed that way. Sensors sample continuously, thresholds raise alarms, and the record is continuous and tamper-evident — which is the actual deliverable when a customer is regulated for food safety or pharmaceuticals.",
    items: [
      { label: "Condition monitoring & alerts", description: "Temperature, humidity and door status, with an alarm when a reading crosses its threshold.", icon: "ri-temp-cold-line", status: "soon", keywords: ["cold chain", "temperature", "humidity", "sensors", "reefer", "alert", "threshold", "excursion", "spoilage"] },
      { label: "Compliance audit trail", description: "A continuous, tamper-evident record for food-safety and pharma.", icon: "ri-file-shield-2-line", status: "soon", keywords: ["audit", "compliance", "haccp", "pharmaceutical", "traceability"] },
      { label: "Refrigerated capacity", description: "Reefer vehicles and cold rooms offered across the network.", icon: "ri-snowflake-line", status: "soon", keywords: ["reefer", "cold room", "chilled", "frozen"] },
    ],
  },
  {
    label: "Reverse logistics",
    caption: "Goods moving back — returns, repairs, recycling and disposal.",
    description:
      "Goods travelling backwards: returns, repairs, recycling and disposal. The discipline is mostly in the first step — deciding what is allowed back at all — and the last, deciding what happens to it once it arrives. Drawn from standard practice; not yet a committed spec.",
    items: [
      { label: "Return authorisations", description: "Decide what may come back, and tie each return to its original order.", icon: "ri-file-transfer-line", status: "soon", keywords: ["rma", "return merchandise authorisation", "returns", "authorise", "gatekeeping", "eligibility", "policy", "return window"] },
      { label: "Collection runs", description: "Pickups from the customer — last mile, pointed the other way.", icon: "ri-arrow-go-back-line", status: "soon", keywords: ["collection", "pickup", "retrieval", "backhaul"] },
      { label: "Inspection & disposition", description: "Grade what came back, then restock, refurbish, return to vendor or recycle.", icon: "ri-recycle-line", status: "soon", keywords: ["inspection", "grading", "triage", "sorting", "disposition", "restock", "refurbish", "rtv", "liquidate", "scrap", "recycle"] },
      { label: "Refunds & credit", description: "Return the money once the goods are back — the half Checkout is missing.", icon: "ri-refund-2-line", status: "soon", keywords: ["refund", "credit note", "escrow", "dispute"] },
    ],
  },
  {
    label: "Green logistics",
    caption: "The environmental cost of moving goods, measured rather than claimed.",
    description:
      "The environmental cost of moving goods, measured rather than asserted. Emissions per shipment on a recognised method, the split between your own fleet and what you carry for others, and the efficiency levers — fuller loads, fewer empty runs — that reduce both cost and carbon at once.",
    items: [
      { label: "Emissions accounting", description: "Well-to-wheel CO₂e per shipment and on the invoice, on the GLEC Framework / ISO 14083 method.", icon: "ri-leaf-line", status: "soon", keywords: ["emissions", "glec", "iso 14083", "co2", "carbon", "well to wheel", "footprint", "shipment", "invoice"] },
      { label: "Scope 1, 2 & 3 reporting", description: "Your own fleet is Scope 1 and 2; what you carry for a customer is their Scope 3.", icon: "ri-bar-chart-box-line", status: "soon", keywords: ["scope 3", "ghg protocol", "reporting", "disclosure", "esg"] },
      { label: "Load & route efficiency", description: "Cut empty running by consolidating loads — what pairing already does, measured.", icon: "ri-route-line", status: "soon", keywords: ["empty running", "consolidation", "utilisation", "backhaul", "optimisation"] },
      { label: "Low-emission fleet & packaging", description: "Electric vehicles against the rest of the fleet, and reusable packaging counted out and back.", icon: "ri-charging-pile-2-line", status: "soon", keywords: ["electric", "ev", "cng", "low emission", "fleet", "packaging", "reusable", "returnable", "waste", "single use"] },
    ],
  },
];

/** A group with nothing to open yet — the launcher shelves these under "Coming soon". */
export const isPlannedGroup = (group: ServiceGroup) => group.items.every((item) => item.status === "soon");

export const ALL_SERVICES: (WorkspaceService & { group: string })[] = SERVICE_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.label })),
);

/** Matches on label, description, group and keywords — every word has to hit something. */
export const searchServices = (query: string) => {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return ALL_SERVICES.filter((item) => {
    const haystack = `${item.label} ${item.description} ${item.group} ${(item.keywords ?? []).join(" ")}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
};

export const STATUS_BADGE: Record<ServiceStatus, { label: string; className: string } | null> = {
  live: null,
  partial: { label: "In progress", className: "bg-amber-50 text-amber-700" },
  soon: { label: "Coming soon", className: "bg-slate-100 text-slate-500" },
};
