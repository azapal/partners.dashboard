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
      { to: "/branches", icon: "ri-git-branch-line", label: "Branches", keywords: ["branches", "locations", "offices"] },
      { to: "/logistics-network", icon: "ri-route-line", label: "Logistics Network", keywords: ["routes", "pairing routes", "network"] },
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
];
