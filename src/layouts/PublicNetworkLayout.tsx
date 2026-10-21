import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { SignInLink } from "../components/marketplace/SignInLink";

/**
 * The shell for a signed-out visitor on the public network pages
 * (marketplace, job briefs, pairing routes). Deliberately not DashboardLayout:
 * that shell asks for onboarding, the header asks for the profile, the rail
 * polls unread messages — all partner-only calls, and a 401/403 from any of
 * them would bounce the visitor to the login page.
 */

export const PUBLIC_NETWORK_LINKS = [
  { to: "/marketplace", label: "Marketplace", icon: "ri-store-3-line" },
  { to: "/job-briefs", label: "Job briefs", icon: "ri-file-list-3-line" },
  { to: "/pairing-routes", label: "Pairing routes", icon: "ri-route-line" },
];

export const PublicNetworkLayout = ({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) => (
  <div className="flex min-h-screen flex-col bg-[#f7f8fa]">
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/marketplace" className="flex shrink-0 items-center gap-2" aria-label="Azapal logistics network">
          <img src="/azapallogoV1.svg" alt="" className="h-8 w-7" />
          <span className="text-base font-bold tracking-tight text-gray-900">Azapal</span>
          <span className="hidden rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-brand sm:inline">Logistics network</span>
        </Link>
        <nav aria-label="Logistics network" className="hidden items-center gap-1 md:flex">
          {PUBLIC_NETWORK_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive ? "bg-orange-50 text-brand" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <i className={l.icon} /> {l.label}
            </NavLink>
          ))}
        </nav>
        <SignInLink className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover">
          <i className="ri-login-box-line" /> Sign in
        </SignInLink>
      </div>
      {/* Phone: the three pages as equal cells under the bar. */}
      <nav aria-label="Logistics network" className="mx-auto grid max-w-7xl grid-cols-3 gap-1 px-4 pb-2 md:hidden">
        {PUBLIC_NETWORK_LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
                isActive ? "bg-brand text-white" : "bg-gray-50 text-gray-600"
              }`
            }
          >
            <i className={l.icon} /> {l.label}
          </NavLink>
        ))}
      </nav>
    </header>

    <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </main>

    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Logistics partners on Azapal, and the work they trade. Storefronts here are listed by the partners themselves.</p>
        <p>
          Run a logistics business? <SignInLink className="font-semibold text-brand hover:underline">Sign in to list yours</SignInLink>
        </p>
      </div>
    </footer>
  </div>
);
