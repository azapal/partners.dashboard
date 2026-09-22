/**
 * The workspace service catalogue that backs the apps launcher.
 *
 * Derived from the Azapal platform PRD (§07 Operations, §08 the money model,
 * §09 Session Checkout, §10 Notifications, §11 Fleet, §12 Inventory, §13 the
 * Management Assistant). It is deliberately the *whole* product surface rather
 * than only what is routable today: the launcher exists to show a partner what
 * Azapal covers, so unbuilt surfaces are listed and marked rather than hidden.
 *
 * ── Two axes ───────────────────────────────────────────────────────────────
 * Most groups are things a partner *consumes* to run their own operation.
 * "Customer channels" is the other axis: what a partner *resells* — the
 * surfaces their own customers touch. A service can appear on both (payment
 * links are a tool for the partner and a page for their customer), which is
 * fine here; the launcher is for browsing, and only the sidebar demands that
 * exactly one place owns a route.
 *
 * ── The seven logistics types ──────────────────────────────────────────────
 * The catalogue is structured so every standard logistics type has somewhere to
 * live, even where nothing is built. Functional groups (Money, IAM, Bills) cut
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
      "The delivery operation itself \u2014 everything between a customer asking for a collection and a parcel changing hands. Start here to price what you carry, define where you carry it, and watch the orders currently moving. Most of a partner's day is spent on this one screen group.",
    items: [
      { label: "Dashboard", description: "Your day at a glance.", icon: "ri-home-6-line", status: "live", to: "/dashboard", keywords: ["home", "overview", "summary"] },
      { label: "Orders & dispatch", description: "Order lifecycle, driver assignment and handoff codes.", icon: "ri-exchange-line", status: "live", to: "/transactions", keywords: ["deliveries", "transactions", "jobs"] },
      { label: "Customers", description: "The people and businesses you deliver for.", icon: "ri-user-3-line", status: "live", to: "/customers", keywords: ["clients"] },
      { label: "Rates & rate cards", description: "Region, route, cargo and delivery-method pricing.", icon: "ri-price-tag-3-line", status: "live", to: "/rates", keywords: ["pricing", "quote", "price"] },
      { label: "Move rates", description: "Relocation pricing by property size, distance and access \u2014 per country.", icon: "ri-home-gear-line", status: "partial", to: "/move-rates", keywords: ["relocation", "moving", "removals", "house move", "office move", "cbm", "survey", "multi country", "currency"] },
      { label: "Services & coverage", description: "What you offer, and the areas you cover.", icon: "ri-task-line", status: "live", to: "/service", keywords: ["offerings", "catalogue"] },
      { label: "Weight & dimensions", description: "Capture declared weight at booking and measured weight at pickup.", icon: "ri-scales-3-line", status: "soon", keywords: ["weight", "kg", "dimensions", "volumetric", "dim weight", "measure", "reweigh"] },
    ],
  },
  {
    label: "IAM",
    caption: "Identity and access — who is in the workspace, and what they did.",
    description:
      "Who can get into your workspace and what they are allowed to touch. Roles are assigned by you rather than chosen from a fixed list, so the same screen covers a branch clerk and a finance lead. The activity log answers the awkward question afterwards: who changed that, and when.",
    items: [
      { label: "Team & roles", description: "Invitations, assigned roles and deactivation.", icon: "ri-group-line", status: "live", to: "/users", keywords: ["staff", "users", "invite", "employees", "identity", "access", "permissions"] },
      { label: "Bulk staff import", description: "Bring a whole team in from a spreadsheet.", icon: "ri-file-upload-line", status: "live", to: "/users", keywords: ["import", "csv", "spreadsheet", "onboard"] },
      { label: "Activity & sessions", description: "Who did what, and which sessions are open.", icon: "ri-history-line", status: "live", to: "/activity-log", keywords: ["audit", "logs", "history", "trail"] },
      { label: "Two-factor authentication", description: "TOTP on top of the login you already use.", icon: "ri-shield-keyhole-line", status: "live", to: "/settings?tab=security", keywords: ["2fa", "totp", "security", "mfa"] },
    ],
  },
  {
    label: "Branches",
    caption: "The locations you operate from, and the scope everything else inherits.",
    description:
      "A branch is more than an address \u2014 it is the scope that wallets, invoices, rates and notifications all inherit. Set them up once and the rest of the platform quietly organises itself around them. Bulk import exists because most partners arrive with a spreadsheet of locations.",
    items: [
      { label: "Branches", description: "Create, edit and retire the places you work from.", icon: "ri-git-branch-line", status: "live", to: "/branches", keywords: ["locations", "offices", "sites"] },
      { label: "Bulk branch import", description: "Stand up many locations from one file.", icon: "ri-file-upload-line", status: "live", to: "/branches", keywords: ["import", "csv", "spreadsheet"] },
      { label: "Branch wallets", description: "Balances scoped to a single location.", icon: "ri-wallet-3-line", status: "live", to: "/financials?tab=wallet", keywords: ["branch", "balance", "scoping"] },
    ],
  },
  {
    label: "Custody",
    caption: "Who held a consignment, when \u2014 and how much of it you could prove.",
    description:
      "The chain of hands a consignment passed through, and \u2014 more usefully \u2014 how much of that chain you could actually prove if a customer disputed it. Every link is marked as evidenced or not, so you can see where a handover rests on nothing but the order's status.",
    items: [
      { label: "Custody chain", description: "Every handover on a consignment, with the evidence behind it.", icon: "ri-shake-hands-line", status: "partial", to: "/custody", keywords: ["custody", "handover", "handoff", "chain of custody", "proof", "evidence", "dispute", "lost item"] },
      { label: "Handoff codes", description: "Pickup and delivery codes that make a handover arguable.", icon: "ri-key-2-line", status: "live", to: "/transactions", keywords: ["pickup code", "handoff code", "release"] },
      { label: "Custody event log", description: "A timestamp on every link, not just the ones we happen to store.", icon: "ri-time-line", status: "soon", keywords: ["events", "timeline", "history", "timestamps"] },
      { label: "Seal & container custody", description: "Seal status and current holder, across multi-leg shipments.", icon: "ri-archive-2-line", status: "soon", keywords: ["container", "seal", "multi-leg", "shipment"] },
    ],
  },
  {
    label: "Money",
    caption: "Collection, division and settlement — the part that makes Azapal infrastructure.",
    description:
      "Collecting from your customers, dividing what arrives between the people owed a share, and settling it out to their banks. This is the part of Azapal that behaves like infrastructure rather than a dashboard: the ledger, the splits and the payouts underneath everything else.",
    items: [
      { label: "Wallet", description: "Partner and branch balances.", icon: "ri-wallet-3-line", status: "live", to: "/financials?tab=wallet", keywords: ["balance", "funds"] },
      { label: "Virtual accounts", description: "Dedicated NUBAN accounts, scoped per branch.", icon: "ri-bank-card-2-line", status: "live", to: "/financials?tab=accounts", keywords: ["nuban", "account number"] },
      { label: "Invoices", description: "Branch-scoped invoices built from your registered rates.", icon: "ri-file-list-3-line", status: "live", to: "/financials?tab=invoices", keywords: ["bill", "billing"] },
      { label: "Payment links", description: "A hosted checkout page per invoice.", icon: "ri-link", status: "live", to: "/financials?tab=invoices", keywords: ["paystack", "checkout", "collect"] },
      { label: "Transfer reconciliation", description: "Match incoming bank credits to the invoices they settle.", icon: "ri-scales-3-line", status: "live", to: "/financials?tab=invoices", keywords: ["reconcile", "incoming", "credits"] },
      { label: "Receipts & branding", description: "Receipts, plus your logo, accent colour and footer.", icon: "ri-receipt-line", status: "live", to: "/financials?tab=receipts", keywords: ["template", "design", "logo"] },
      { label: "Payout splits", description: "Named arrangements for dividing what you collect.", icon: "ri-pie-chart-line", status: "live", to: "/financials?tab=split", keywords: ["split", "revenue share", "division"] },
      { label: "Stakeholders", description: "Counterparties you pay, and the people under them.", icon: "ri-team-line", status: "live", to: "/stakeholders", keywords: ["collaborators", "third party", "vendors"] },
      { label: "Bank payouts", description: "Transfers out to verified bank accounts.", icon: "ri-bank-line", status: "live", to: "/stakeholders", keywords: ["settlement", "withdraw", "transfer"] },
    ],
  },
  {
    label: "Bills",
    caption: "What you pay Azapal for the platform \u2014 metered per feature, not a plan.",
    description:
      "What you pay Azapal, metered per feature rather than sold as a plan. Nothing here charges until you switch it on, so the bill follows the shape of your operation. Your own customers' invoices live under Money \u2014 this is the other direction.",
    items: [
      { label: "Pay as you go", description: "Which features are costing you, and what so far this month.", icon: "ri-speed-up-line", status: "partial", to: "/bills?tab=usage", keywords: ["usage", "metering", "platform", "charges", "billing", "subscription"] },
      { label: "Invoice history", description: "Azapal's monthly bills to you. Not the ones you send customers.", icon: "ri-file-list-3-line", status: "partial", to: "/bills?tab=invoices", keywords: ["azapal invoice", "platform bill", "statement", "history"] },
      { label: "Receipt history", description: "Proof of what you've already paid Azapal.", icon: "ri-receipt-line", status: "partial", to: "/bills?tab=receipts", keywords: ["azapal receipt", "payment history", "paid"] },
      { label: "Payment method", description: "How your Azapal charges get settled.", icon: "ri-bank-card-line", status: "live", to: "/PaymentMethod", keywords: ["card", "wallet debit", "billing method"] },
    ],
  },
  {
    label: "Customer channels",
    caption: "What you resell \u2014 the surfaces your own customers quote, book and track on.",
    description:
      "The surfaces your customers touch rather than the ones you work in. A branded app, a page they pay on, a link they track with, an API your larger accounts integrate against. This is where a partner stops being a dashboard user and starts being a service provider.",
    items: [
      { label: "Branded mobile app", description: "Your logistics service, in your customers' pocket under your name.", icon: "ri-smartphone-line", status: "partial", to: "/mobility", keywords: ["mobility", "white label", "branded", "ios", "android", "consumer app"] },
      { label: "Hosted checkout page", description: "The page your customer actually pays on \u2014 already live.", icon: "ri-link", status: "live", to: "/financials?tab=invoices", keywords: ["pay online", "customer payment", "payment page"] },
      { label: "Quote page", description: "Self-serve moving quotes off your move rates \u2014 customers leave their details and send you the quote.", icon: "ri-price-tag-3-line", status: "partial", to: "/move-rates?view=quote-page", keywords: ["quote", "instant quote", "pricing page", "self serve", "leads", "quote requests", "whatsapp", "instagram"] },
      { label: "Booking page", description: "Customers raise a delivery themselves, into your normal dispatch flow.", icon: "ri-calendar-check-line", status: "soon", keywords: ["book", "self serve", "order form", "web booking"] },
      { label: "Public tracking", description: "A link a customer opens without an account, backed by the custody chain.", icon: "ri-map-pin-time-line", status: "soon", keywords: ["tracking", "track and trace", "status page", "visibility"] },
      { label: "Partner API", description: "Scoped credentials so your larger customers integrate directly with you.", icon: "ri-terminal-box-line", status: "soon", keywords: ["api", "partner api", "integration", "developer", "keys", "rest"] },
      { label: "Outbound webhooks", description: "Signed events pushed to whatever your customer runs \u2014 already live.", icon: "ri-send-plane-line", status: "live", to: "/settings?tab=developer", keywords: ["webhook", "hmac", "callbacks", "push events"] },
    ],
  },
  {
    label: "Logistics network",
    caption: "3PL & 4PL \u2014 trade routes, capacity and work with other partners.",
    description:
      "Other partners on Azapal, and the work you trade with them. Offer a scheduled route and let someone join it, lend a vehicle standing idle, or pick up a load heading where you are already going. The revenue split runs on the machinery already built for your own payouts.",
    items: [
      { label: "Pairing routes", description: "Scheduled routes you offer, and paired deliveries you can join.", icon: "ri-route-line", status: "partial", to: "/logistics-network", keywords: ["logn", "pairing", "paired delivery", "routes", "lanes"] },
      { label: "Fleet pairing", description: "Lend idle vehicles to the network, or take on someone else's load.", icon: "ri-truck-line", status: "partial", to: "/fleet-listing", keywords: ["fleet", "lend", "rent", "capacity sharing", "truck", "van", "earn"] },
      { label: "Logistics partners", description: "Who else is on the network, and how to reach them.", icon: "ri-community-line", status: "soon", keywords: ["partner directory", "partners list", "counterparties", "network members"] },
    ],
  },
  {
    label: "Session Checkout",
    caption: "A client, a vendor and a rider in one room, against one payment held until handoff.",
    description:
      "A client, a vendor and a rider in one room with one payment held in escrow until the goods change hands. The rider's handoff confirmation is what releases the money, which is why the code goes to the person receiving rather than the person delivering.",
    items: [
      { label: "Checkout sessions", description: "Escrow-held deliveries, tracked from the partner side.", icon: "ri-shield-keyhole-line", status: "soon", keywords: ["escrow", "session"] },
      { label: "Session chat", description: "The append-only transcript kept as dispute evidence.", icon: "ri-chat-3-line", status: "soon", keywords: ["messages", "transcript"] },
      { label: "Dispute console", description: "Review a held session and settle it.", icon: "ri-error-warning-line", status: "soon", keywords: ["refund", "dispute", "hold"] },
    ],
  },
  {
    label: "Notifications",
    caption: "Which events reach whom, on which channel.",
    description:
      "Which of the nine operational events reach which people, on WhatsApp, SMS or email. Recipients are drawn from your real team rather than typed in, so someone leaving stops receiving alerts by being deactivated once.",
    items: [
      { label: "Notification preferences", description: "Nine operational events, by channel and recipient.", icon: "ri-notification-3-line", status: "live", to: "/settings?tab=notifications", keywords: ["alerts", "whatsapp", "sms", "email"] },
      { label: "Notification delivery", description: "Emitters don't read your preferences yet.", icon: "ri-send-plane-line", status: "soon", keywords: ["delivery", "dispatch alerts"] },
    ],
  },
  {
    label: "Fleet & transport",
    caption: "Azapal TMS/FMS — vehicles as managed assets. Scope, not status.",
    description:
      "Vehicles as managed assets rather than a line in a spreadsheet: what they cost to run, which documents are about to expire, who is driving them and what the telematics say. Scope for this area is agreed but not yet built.",
    items: [
      { label: "Vehicle register", description: "Make, model, plate, capacity and home branch.", icon: "ri-truck-line", status: "soon", keywords: ["fleet", "vehicles", "tms", "fms"] },
      { label: "Compliance documents", description: "Insurance and roadworthiness, with renewals ahead of expiry.", icon: "ri-file-shield-2-line", status: "soon", keywords: ["insurance", "licence", "expiry"] },
      { label: "Maintenance & work orders", description: "Preventive schedules, parts, cost and downtime.", icon: "ri-tools-line", status: "soon", keywords: ["service", "repair", "workshop"] },
      { label: "Driver assignment", description: "Which driver is on which vehicle, and when.", icon: "ri-steering-2-line", status: "soon", keywords: ["drivers", "riders", "rota"] },
      { label: "Fuel & cost per km", description: "Consumption, and what a trip cost against what it earned.", icon: "ri-gas-station-line", status: "soon", keywords: ["fuel", "cost", "efficiency"] },
      { label: "GPS & telematics", description: "Live position, route history and engine data.", icon: "ri-map-pin-line", status: "soon", keywords: ["tracking", "iot", "obd", "dashcam"] },
      { label: "Containers & shipments", description: "Seal status, custody, and multi-leg consignments.", icon: "ri-archive-2-line", status: "soon", keywords: ["container", "shipment", "freight"] },
      { label: "Capacity sharing", description: "Offering a half-empty vehicle is handled under Logistics network.", icon: "ri-share-circle-line", status: "partial", to: "/fleet-listing", keywords: ["capacity", "share", "lend fleet", "pairing"] },
    ],
  },
  {
    label: "Inventory & warehousing",
    caption: "Inbound logistics — receiving, storage and the movement cycle.",
    description:
      "Goods arriving, being stored, and leaving again \u2014 receiving, put-away, picking, packing and dispatch, each step recorded against the person who did it. The join that matters is the last one: a dispatch from the warehouse becoming an order in last mile without re-keying.",
    items: [
      { label: "Stock, SKUs & batches", description: "Lots and expiry dates, the unit a recall works in.", icon: "ri-stack-line", status: "soon", keywords: ["inventory", "sku", "ims", "warehouse"] },
      { label: "Locations & bins", description: "So a pick list is a route through the building.", icon: "ri-layout-grid-line", status: "soon", keywords: ["bins", "aisles", "storage"] },
      { label: "Receiving to dispatch", description: "Put-away, picking and packing, recorded per person.", icon: "ri-inbox-unarchive-line", status: "soon", keywords: ["picking", "packing", "movement"] },
    ],
  },
  {
    label: "Value-added services",
    caption: "Work you sell alongside the move \u2014 the classic 3PL margin line.",
    description:
      "The work you sell around the move rather than the move itself \u2014 repacking a consignment that is billing on air, consolidating several into one, labelling, crating, or simply charging for your advice. Historically the highest-margin line a 3PL runs.",
    items: [
      { label: "Chargeable weight check", description: "Quote on declared weight, settle on what the rider measured.", icon: "ri-scales-3-line", status: "partial", to: "/chargeable-weight", keywords: ["chargeable weight", "volumetric", "dim weight", "cube", "paying for air", "reweigh"] },
      { label: "Repackaging", description: "Repack to cut void space and the chargeable weight that comes with it.", icon: "ri-box-3-line", status: "soon", keywords: ["repack", "repackaging", "packing", "void fill", "right size"] },
      { label: "Consolidation", description: "Combine several consignments into one move.", icon: "ri-stack-line", status: "soon", keywords: ["consolidate", "groupage", "combine", "merge"] },
      { label: "Labelling & kitting", description: "Label, assemble or bundle goods before dispatch.", icon: "ri-price-tag-3-line", status: "soon", keywords: ["label", "kitting", "assembly", "bundle", "barcode"] },
      { label: "Palletising & crating", description: "Secure goods for haulage, including custom crates.", icon: "ri-archive-drawer-line", status: "soon", keywords: ["pallet", "crate", "shrink wrap", "strapping", "secure"] },
      { label: "Advisory & consultation", description: "Sell your expertise \u2014 listed, booked and paid like any other service.", icon: "ri-user-star-line", status: "soon", keywords: ["consultation", "advisory", "expertise", "audit", "packing advice"] },
      { label: "Offer on the network", description: "Rent your bench out the way Fleet pairing rents a vehicle.", icon: "ri-share-circle-line", status: "soon", keywords: ["network", "marketplace", "sell service", "capacity"] },
    ],
  },
  {
    label: "Cold chain",
    caption: "Temperature-controlled logistics \u2014 proving the chain never broke.",
    description:
      "Temperature-controlled goods and the evidence that they stayed that way. Sensors sample continuously, thresholds raise alarms, and the record is continuous and tamper-evident \u2014 which is the actual deliverable when a customer is regulated for food safety or pharmaceuticals.",
    items: [
      { label: "Condition monitoring", description: "Temperature, humidity and door status, zone by zone.", icon: "ri-temp-cold-line", status: "soon", keywords: ["cold chain", "temperature", "humidity", "sensors", "reefer"] },
      { label: "Excursion alerts", description: "An alarm the moment a reading crosses its threshold.", icon: "ri-alarm-warning-line", status: "soon", keywords: ["alert", "threshold", "excursion", "spoilage"] },
      { label: "Compliance audit trail", description: "A continuous, tamper-evident record for food-safety and pharma.", icon: "ri-file-shield-2-line", status: "soon", keywords: ["audit", "compliance", "haccp", "pharmaceutical", "traceability"] },
      { label: "Refrigerated capacity", description: "Reefer vehicles and cold rooms offered across the network.", icon: "ri-snowflake-line", status: "soon", keywords: ["reefer", "cold room", "chilled", "frozen"] },
    ],
  },
  {
    label: "Reverse logistics",
    caption: "Goods moving back \u2014 returns, repairs, recycling and disposal.",
    description:
      "Goods travelling backwards: returns, repairs, recycling and disposal. The discipline is mostly in the first step \u2014 deciding what is allowed back at all \u2014 and the last, deciding what happens to it once it arrives. Drawn from standard practice; not yet a committed spec.",
    items: [
      { label: "Return authorisations", description: "An RMA tying the return to its original order, with disposition rules attached.", icon: "ri-file-transfer-line", status: "soon", keywords: ["rma", "return merchandise authorisation", "returns", "authorise"] },
      { label: "Return gatekeeping", description: "Decide what is allowed into the reverse flow before it ships.", icon: "ri-shield-check-line", status: "soon", keywords: ["gatekeeping", "eligibility", "policy", "return window"] },
      { label: "Collection runs", description: "Pickups from the customer \u2014 last mile, pointed the other way.", icon: "ri-arrow-go-back-line", status: "soon", keywords: ["collection", "pickup", "retrieval", "backhaul"] },
      { label: "Inspection & grading", description: "Sort on arrival and grade the condition of what came back.", icon: "ri-search-eye-line", status: "soon", keywords: ["inspection", "grading", "triage", "sorting"] },
      { label: "Disposition", description: "Restock, refurbish, return to vendor, liquidate or recycle.", icon: "ri-recycle-line", status: "soon", keywords: ["disposition", "restock", "refurbish", "rtv", "liquidate", "scrap", "recycle"] },
      { label: "Refunds & credit", description: "Return the money once the goods are back \u2014 the half Checkout is missing.", icon: "ri-refund-2-line", status: "soon", keywords: ["refund", "credit note", "escrow", "dispute"] },
    ],
  },
  {
    label: "Green logistics",
    caption: "The environmental cost of moving goods, measured rather than claimed.",
    description:
      "The environmental cost of moving goods, measured rather than asserted. Emissions per shipment on a recognised method, the split between your own fleet and what you carry for others, and the efficiency levers \u2014 fuller loads, fewer empty runs \u2014 that reduce both cost and carbon at once.",
    items: [
      { label: "Emissions accounting", description: "Well-to-wheel CO\u2082e per shipment, on the GLEC Framework / ISO 14083 method.", icon: "ri-leaf-line", status: "soon", keywords: ["emissions", "glec", "iso 14083", "co2", "carbon", "well to wheel"] },
      { label: "Per-shipment carbon", description: "A carbon figure on the delivery and the invoice, not just an annual total.", icon: "ri-scales-3-line", status: "soon", keywords: ["carbon", "footprint", "shipment", "invoice"] },
      { label: "Scope 1, 2 & 3 reporting", description: "Your own fleet is Scope 1 and 2; what you carry for a customer is their Scope 3.", icon: "ri-bar-chart-box-line", status: "soon", keywords: ["scope 3", "ghg protocol", "reporting", "disclosure", "esg"] },
      { label: "Load & route efficiency", description: "Cut empty running by consolidating loads \u2014 what pairing already does, measured.", icon: "ri-route-line", status: "soon", keywords: ["empty running", "consolidation", "utilisation", "backhaul", "optimisation"] },
      { label: "Low-emission fleet", description: "Track electric and low-emission vehicles against the rest of the fleet.", icon: "ri-charging-pile-2-line", status: "soon", keywords: ["electric", "ev", "cng", "low emission", "fleet"] },
      { label: "Packaging footprint", description: "Reusable and returnable packaging, counted on the way out and back.", icon: "ri-box-3-line", status: "soon", keywords: ["packaging", "reusable", "returnable", "waste", "single use"] },
    ],
  },
  {
    label: "Assistant",
    caption: "A manager's counterpart across all three pillars. Proposed.",
    description:
      "A manager's counterpart rather than a help widget. It routes a request to the right screen and fills the form, so a sentence replaces several screens of navigation. It proposes and prepares; you still press the button on anything that matters.",
    items: [
      { label: "Management assistant", description: "Say what you need; it opens and fills the form. Reconciling and briefing still to come.", icon: "ri-sparkling-2-line", status: "partial", launch: "assistant", keywords: ["ai", "assistant", "chat", "brief", "azapal", "ask"] },
    ],
  },
  {
    label: "Account & setup",
    caption: "Your own configuration, and the way in for everything else.",
    description:
      "Your own configuration \u2014 business details, security, developer credentials \u2014 plus the ways into everything else. The screens you visit rarely but need to find quickly when you do.",
    items: [
      { label: "Settings", description: "Business details, security and two-factor.", icon: "ri-settings-3-line", status: "live", to: "/settings", keywords: ["preferences", "2fa", "security", "account"] },
      { label: "Integrations", description: "Connect Azapal to the tools you already run.", icon: "ri-plug-line", status: "live", to: "/integration", keywords: ["connectors", "apps", "integration"] },
      { label: "Developer settings", description: "Your own API keys and endpoint configuration.", icon: "ri-terminal-box-line", status: "live", to: "/settings?tab=developer", keywords: ["developer", "keys", "credentials", "endpoint"] },
      { label: "Partner onboarding", description: "Get a new partner set up and live.", icon: "ri-user-add-line", status: "live", to: "/partners/onboarding", keywords: ["setup", "onboard"] },
      { label: "Monthly performance", description: "How the operation moved, month over month.", icon: "ri-line-chart-line", status: "live", to: "/dashboard/performance", keywords: ["reports", "analytics", "performance"] },
      { label: "Help centre", description: "Guides and answers to the common questions.", icon: "ri-question-line", status: "live", to: "/helpCenter", keywords: ["help", "docs", "support", "faq"] },
      { label: "Contact us", description: "Reach the Azapal team.", icon: "ri-customer-service-2-line", status: "live", to: "/contact", keywords: ["advisor", "contact", "talk"] },
    ],
  },
];

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
