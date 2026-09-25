import type { NavItem } from "./navItems";

/**
 * The sidebar's categories — what can be done *within* one area of the product.
 *
 * The sidebar is no longer a complete index. Running a last-mile operation and
 * running a warehouse are different jobs with different verbs, and a single flat
 * list that tries to hold both serves neither: it grows with every feature until
 * it stops being scannable. So the rail shows only the category you are in, and
 * moving between categories is the launcher's job (grid icon / ⌘K), not the
 * sidebar's.
 *
 * Route ownership is declared here rather than inferred from the launcher
 * catalogue, because that catalogue deliberately lists the same route under
 * several groups (a branch wallet is both "Branches" and "Money"). Browsing
 * tolerates that overlap; navigation must not — exactly one category owns a
 * path, or the rail would flicker between two answers.
 *
 * Adding Pillar 2/3 later is adding a category here. They are absent for now
 * because neither has a routable screen yet — an inert category nobody can ever
 * be inside would be dead UI, and the launcher already advertises them.
 */
export interface NavCategory {
  id: string;
  label: string;
  icon: string;
  /** Sub-line under the category name in the expanded rail. */
  caption: string;
  items: NavItem[];
  /**
   * Path prefixes this category owns. Longest match wins, so a more specific
   * prefix can carve a route out of a broader one.
   */
  owns: string[];
}

export const NAV_CATEGORIES: NavCategory[] = [
  {
    id: "last-mile",
    label: "Last mile",
    icon: "ri-truck-line",
    caption: "Everything that moves a delivery",
    owns: ["/dashboard", "/transactions", "/custody", "/customers", "/rates", "/quote-page", "/service", "/chargeable-weight"],
    items: [
      { to: "/dashboard", icon: "ri-home-6-line", label: "Dashboard", keywords: ["home", "overview"] },
      { to: "/transactions", icon: "ri-exchange-line", label: "Orders", keywords: ["orders", "deliveries", "dispatch"] },
      { to: "/custody", icon: "ri-shake-hands-line", label: "Custody", keywords: ["handover", "handoff", "chain of custody", "proof", "evidence"] },
      { to: "/customers", icon: "ri-user-3-line", label: "Customers", keywords: ["clients"] },
      { to: "/service", icon: "ri-task-line", label: "Services", keywords: ["services", "coverage"] },
      { to: "/rates", icon: "ri-price-tag-3-line", label: "Rates", keywords: ["rates", "pricing"] },
      { to: "/quote-page", icon: "ri-price-tag-3-line", label: "Quote page", keywords: ["quote", "leads", "quote requests", "enquiries"] },
      { to: "/chargeable-weight", icon: "ri-scales-3-line", label: "Chargeable weight", keywords: ["weight", "volumetric", "dim weight", "reweigh"] },
    ],
  },
  {
    id: "money",
    label: "Money",
    icon: "ri-wallet-3-line",
    caption: "Collect, divide and settle",
    owns: ["/financials", "/stakeholders", "/bills", "/PaymentMethod"],
    items: [
      { to: "/financials", icon: "ri-wallet-3-line", label: "Financials", keywords: ["wallet", "invoices", "receipts"] },
      { to: "/stakeholders", icon: "ri-team-line", label: "Stakeholders", keywords: ["splits", "payouts"] },
      { to: "/bills", icon: "ri-bill-line", label: "Bills", keywords: ["billing", "pay as you go", "usage"] },
      { to: "/PaymentMethod", icon: "ri-bank-card-line", label: "Payment method", keywords: ["card", "billing"] },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    icon: "ri-building-2-line",
    caption: "Locations, people and access",
    owns: ["/branches", "/users", "/activity-log", "/settings", "/integration", "/partners/onboarding"],
    items: [
      { to: "/branches", icon: "ri-git-branch-line", label: "Branches", keywords: ["locations"] },
      { to: "/users", icon: "ri-group-line", label: "Users", keywords: ["team", "staff", "invite"] },
      { to: "/activity-log", icon: "ri-history-line", label: "Activity log", keywords: ["audit", "sessions"] },
      { to: "/settings", icon: "ri-settings-3-line", label: "Settings", keywords: ["account", "security", "2fa"] },
      { to: "/integration", icon: "ri-plug-line", label: "Integrations", keywords: ["api", "webhooks"] },
    ],
  },
  {
    id: "channels",
    label: "Customer channels",
    icon: "ri-store-2-line",
    caption: "What your own customers see and use",
    owns: ["/mobility"],
    items: [
      { to: "/mobility", icon: "ri-smartphone-line", label: "Mobility", keywords: ["branded app", "white label", "customer app"] },
    ],
  },
  {
    id: "network",
    label: "Logistics network",
    icon: "ri-share-circle-line",
    caption: "Trade routes, capacity and work with other partners",
    owns: ["/logistics-network", "/fleet-listing"],
    items: [
      { to: "/logistics-network", icon: "ri-route-line", label: "Pairing routes", keywords: ["paired delivery", "routes", "lanes", "logn"] },
      { to: "/fleet-listing", icon: "ri-truck-line", label: "Fleet pairing", keywords: ["lend", "vehicle", "capacity sharing", "earn"] },
    ],
  },
];

/** Where an unrecognised route lands, so the rail is never empty. */
export const DEFAULT_CATEGORY = NAV_CATEGORIES[0];

export const categoryForPath = (pathname: string): NavCategory => {
  let best: { category: NavCategory; length: number } | null = null;

  for (const category of NAV_CATEGORIES) {
    for (const prefix of category.owns) {
      const owns = pathname === prefix || pathname.startsWith(`${prefix}/`);
      if (owns && (!best || prefix.length > best.length)) {
        best = { category, length: prefix.length };
      }
    }
  }

  return best?.category ?? DEFAULT_CATEGORY;
};
