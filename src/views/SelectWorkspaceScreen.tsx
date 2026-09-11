import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { usePartnerProfile } from "../hooks/useAuth";
import { PRODUCT_MODULES } from "../lib/data/productModules";
import { SEARCHABLE_NAV_ITEMS } from "../lib/data/navItems";
import { useClickOutside } from "../hooks/useClickOutside";

const MAX_RESULTS = 6;

export const SelectWorkspaceScreen = () => {
  const navigate = useNavigate();
  const profile = usePartnerProfile();
  const [requested, setRequested] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useClickOutside<HTMLDivElement>(() => setQuery(""));

  const requestAccess = (code: string) =>
    setRequested((prev) => (prev.includes(code) ? prev : [...prev, code]));

  const matches = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return SEARCHABLE_NAV_ITEMS.filter((item) => {
      const haystack = `${item.label} ${item.keywords.join(" ")}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    }).slice(0, MAX_RESULTS);
  }, [query]);

  const goTo = (to: string) => {
    setQuery("");
    navigate(to);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!matches.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      goTo(matches[activeIndex]?.to ?? matches[0].to);
    } else if (e.key === "Escape") {
      setQuery("");
      inputRef.current?.blur();
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/azapallogoV1.svg" alt="Azapal" className="h-8 w-auto" />
            <span className="hidden h-5 w-px bg-slate-200 sm:block" />
            <span className="hidden text-sm font-medium text-slate-600 sm:block">Partner workspace</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="hidden sm:inline">Need help?</span>
            <button type="button" onClick={() => navigate("/helpCenter")} className="font-semibold text-brand hover:text-brand-hover">Help centre</button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-7 flex w-full max-w-6xl flex-col items-start gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Your workspace</p>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Welcome{profile?.partner_name ? `, ${profile.partner_name}` : ""}
          </h1>
          <p className="text-sm text-slate-500">Choose a product to get started, or search for a task.</p>
        </div>

        <div className="relative mb-7 w-full max-w-6xl" ref={dropdownRef}>
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search for anything — try “manage users” or “rates”…"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-orange-100"
          />

          {matches.length > 0 && (
            <div className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
              {matches.map((item, i) => (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => goTo(item.to)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    i === activeIndex ? "bg-orange-50" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                    <i className={`${item.icon} text-base text-brand`} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-gray-900">{item.label}</span>
                  </span>
                  <span className="text-[11px] text-gray-400 uppercase tracking-wide shrink-0">{item.group}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid w-full max-w-6xl gap-3 lg:grid-cols-2">
          {/* Logistics Management — the live app */}
          <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm shadow-slate-200/60 transition hover:border-orange-200 hover:shadow-md lg:col-span-2">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50">
              <i className="ri-route-line text-xl text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">Logistics Management</p>
              <p className="mt-0.5 text-xs text-slate-400">Logistics-as-a-service</p>
              <p className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">
                Rates, branches, routes, transactions, and everything you already run through Azapal.
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              Continue
              <i className="ri-arrow-right-line text-base" />
            </button>
          </div>

          {PRODUCT_MODULES.map((mod) => {
            const isRequested = requested.includes(mod.code);
            return (
              <div key={mod.code} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 transition hover:border-slate-300 hover:shadow-md">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${mod.iconBg}`}>
                  <i className={`${mod.icon} text-xl ${mod.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{mod.name}</p>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Coming soon
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">{mod.fullName}</p>
                  <p className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">{mod.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => requestAccess(mod.code)}
                  disabled={isRequested}
                  className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:border-green-100 disabled:bg-green-50 disabled:text-green-700"
                >
                  {isRequested ? "Requested" : "Request Access"}
                </button>
              </div>
            );
          })}
        </div>

        <section className="mt-10 w-full max-w-6xl" aria-labelledby="workspace-overview-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Workspace overview</p>
              <h2 id="workspace-overview-heading" className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                Your Azapal hub
              </h2>
            </div>
            <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 sm:block">
              Portal online
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-brand">
                  <i className="ri-hand-heart-line text-xl" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Welcome to Azapal</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Set up the essentials and get your team working with confidence.</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => navigate("/settings")} className="rounded-lg bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100">
                  Business settings
                </button>
                <button type="button" onClick={() => navigate("/users")} className="rounded-lg bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100">
                  Invite your team
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <i className="ri-heart-pulse-line text-xl" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Azapal health</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">A quick view of your workspace activity and attention items.</p>
                  </div>
                </div>
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-500">Items requiring attention</span>
                <span className="font-semibold text-slate-900">0</span>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <i className="ri-compass-3-line text-xl" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Explore Azapal</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Discover tools that make rates, service and operations easier to manage.</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => navigate("/rates")} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-brand hover:text-brand">Rate cards</button>
                <button type="button" onClick={() => navigate("/service")} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-brand hover:text-brand">Services</button>
                <button type="button" onClick={() => navigate("/logistics-network")} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-brand hover:text-brand">Network</button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <i className="ri-shield-check-line text-xl" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Security</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Keep access limited to the right people and review activity when needed.</p>
                </div>
              </div>
              <button type="button" onClick={() => navigate("/activity-log")} className="mt-4 text-xs font-semibold text-brand hover:text-brand-hover">
                Review activity log <i className="ri-arrow-right-line align-middle" />
              </button>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <i className="ri-megaphone-line text-xl" />
                </span>
                <h3 className="text-sm font-semibold text-slate-900">Latest announcements</h3>
              </div>
              <div className="mt-4 space-y-3">
                <div className="border-b border-slate-100 pb-3">
                  <p className="text-xs font-semibold text-slate-700">Partner operations, all in one workspace</p>
                  <p className="mt-1 text-[11px] text-slate-400">New</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Manage your rate cards with more clarity</p>
                  <p className="mt-1 text-[11px] text-slate-400">Product update</p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <i className="ri-article-line text-xl" />
                </span>
                <h3 className="text-sm font-semibold text-slate-900">Recent Azapal posts</h3>
              </div>
              <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold leading-5 text-slate-700">Building a more dependable delivery experience</p>
                <p className="border-t border-slate-100 pt-3 text-xs font-semibold leading-5 text-slate-700">Three ways to make your dispatch workflow smoother</p>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <i className="ri-customer-service-2-line text-xl" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Trusted advisors</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Need help with your operation? Get practical support from the Azapal team.</p>
                  </div>
                </div>
                <button type="button" onClick={() => navigate("/contact")} className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  Contact an advisor
                </button>
              </div>
            </article>
          </div>
        </section>

        <button
          onClick={() => (location.href = "/LogoutScreen")}
          className="mt-8 text-xs text-slate-400 transition-colors hover:text-slate-600"
        >
          Not you? Log out
        </button>
      </main>
    </div>
  );
};
