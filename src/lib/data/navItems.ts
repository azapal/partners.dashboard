export interface NavItem {
  to: string;
  icon: string;
  label: string;
  keywords: string[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", icon: "ri-home-6-line", label: "Dashboard", keywords: ["home", "overview", "stats", "summary"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/service", icon: "ri-task-line", label: "Services", keywords: ["services", "coverage", "offerings"] },
      { to: "/rates", icon: "ri-price-tag-3-line", label: "Rates", keywords: ["rates", "pricing", "rate cards", "price"] },
      { to: "/quote-page", icon: "ri-price-tag-3-line", label: "Quote Page", keywords: ["quote", "quote requests", "leads", "enquiries", "self serve", "customers", "quote form", "questions"] },
      { to: "/chargeable-weight", icon: "ri-scales-3-line", label: "Chargeable Weight", keywords: ["weight", "volumetric", "dim weight", "reweigh", "cubing"] },
      { to: "/branches", icon: "ri-git-branch-line", label: "Branches", keywords: ["branches", "locations", "offices"] },
      { to: "/marketplace", icon: "ri-store-3-line", label: "Marketplace", keywords: ["network", "logistics network", "marketplace", "partners", "storefront", "directory"] },
      { to: "/job-briefs", icon: "ri-file-list-3-line", label: "Job Briefs", keywords: ["briefs", "jobs", "tender", "rfq", "outsource"] },
      { to: "/inbox", icon: "ri-chat-3-line", label: "Inbox", keywords: ["inbox", "messages", "chat", "partner messages"] },
      { to: "/pairing-routes", icon: "ri-route-line", label: "Pairing Routes", keywords: ["routes", "pairing routes", "paired delivery", "lanes"] },
      { to: "/custody", icon: "ri-shake-hands-line", label: "Custody", keywords: ["handover", "handoff", "chain of custody", "proof", "evidence", "reconcile items"] },
    ],
  },
  {
    label: "Network",
    items: [
      { to: "/mobility", icon: "ri-smartphone-line", label: "Mobility", keywords: ["branded app", "white label", "customer app", "ios", "android"] },
      { to: "/fleet-listing", icon: "ri-truck-line", label: "List your fleet", keywords: ["fleet", "lend", "vehicle", "truck", "van", "motorcycle", "capacity sharing", "earn"] },
    ],
  },
  {
    label: "Management",
    items: [
      { to: "/transactions", icon: "ri-exchange-line", label: "Transactions", keywords: ["orders", "deliveries", "payments"] },
      { to: "/users", icon: "ri-group-line", label: "Users", keywords: ["manage users", "user management", "team", "invite", "invites", "staff"] },
      { to: "/activity-log", icon: "ri-history-line", label: "Activity Log", keywords: ["activity", "audit", "sessions", "history", "logs"] },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        to: "/financials",
        icon: "ri-wallet-3-line",
        label: "Financials",
        keywords: ["invoice", "invoices", "receipt", "receipts", "wallet", "balance", "bank details", "virtual account", "payout"],
      },
      {
        to: "/bills",
        icon: "ri-bill-line",
        label: "Bills",
        keywords: ["bills", "billing", "pay as you go", "usage", "subscription", "azapal invoice", "platform charges"],
      },
      {
        to: "/stakeholders",
        icon: "ri-team-line",
        label: "Stakeholders",
        keywords: ["stakeholder", "stakeholders", "split", "payout split", "dispatcher", "third party", "partner share", "revenue share"],
      },
    ],
  },
];

// Settings lives off the header dropdown, not the sidebar, but is a real destination worth
// surfacing from search.
export const SETTINGS_NAV_ITEM: NavItem & { group: string } = {
  to: "/settings",
  icon: "ri-settings-3-line",
  label: "Settings",
  group: "Account",
  keywords: ["account", "preferences", "notifications", "security", "developer", "2fa"],
};

export const SEARCHABLE_NAV_ITEMS: (NavItem & { group: string })[] = [
  ...NAV_GROUPS.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label }))),
  SETTINGS_NAV_ITEM,
  { to: "/customers", icon: "ri-user-heart-line", label: "Customers", group: "Customers", keywords: ["customers", "clients", "email", "emails", "campaigns", "email campaigns", "newsletter", "promo", "promotion", "discount", "seasonal", "bulk email", "marketing", "templates"] },
  { to: "/dashboard/performance", icon: "", label: "Monthly Performance", group: "Overview", keywords: ["performance", "monthly", "reports"] },
  { to: "/integration", icon: "", label: "Integrations", group: "Account", keywords: ["integration", "connectors", "api"] },
  { to: "/PaymentMethod", icon: "", label: "Billing Method", group: "Finance", keywords: ["payment", "card", "billing", "bank transfer"] },
  { to: "/partners/onboarding", icon: "", label: "Partner Onboarding", group: "Account", keywords: ["onboarding", "setup", "partner"] },
];
