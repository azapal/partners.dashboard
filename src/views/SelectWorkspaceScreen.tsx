import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, MagnifyingGlass, Truck, X } from "@phosphor-icons/react";
import { usePartnerProfile } from "../hooks/useAuth";
import { PRODUCT_MODULES } from "../lib/data/productModules";
import { useClickOutside } from "../hooks/useClickOutside";
import { searchServices } from "../lib/data/workspaceServices";
import { RoadSignIcon } from "../components/icons/RoadSignIcon";
import { assistantActions } from "../store/client/assistant";
import { FeatureUsagePanel } from "../components/workspace/FeatureUsagePanel";
import { ServiceLauncher } from "../components/workspace/ServiceLauncher";
import { useWorkspaceFeatureUsage } from "../hooks/useDashboard";
import { SetupChecklist } from "../components/workspace/SetupChecklist";

const MAX_RESULTS = 6;

/**
 * Overview cards lead with a full-bleed photo banner. Unsplash is queried with explicit
 * sizing params so the CDN returns a pre-cropped image rather than the full-resolution
 * original — the 2:1 crop matches the banner's aspect, and the width covers a half-width
 * card on a 2x display.
 */
const cardImage = (id: string) => `https://images.unsplash.com/${id}?w=800&h=400&q=70&auto=format&fit=crop`;

const OVERVIEW_IMAGES = {
  welcome: cardImage("photo-1600880292203-757bb62b4baf"),
  explore: cardImage("photo-1451187580459-43490279c0fa"),
  security: cardImage("photo-1584433144859-1fc3ab64a957"),
  announcements: cardImage("photo-1504711434969-e33886168f5c"),
};

/**
 * Promotional entry points to the revenue-side products. Each carries a real
 * destination — none of these is a dead card — and its own photo rather than an
 * icon, matching the overview cards above.
 */
const QUICK_SERVICES = [
  {
    to: "/marketplace",
    title: "Logistics network",
    tagline: "Find partners for work you need done, get found for what you do, and share routes.",
    cta: "See the network",
    image: cardImage("photo-1494412574643-ff11b0a5c1c3"),
    feature: "network",
  },
  {
    to: "/stakeholders",
    title: "Stakeholders",
    tagline: "Do business with other stakeholders and automate the payments and profits.",
    cta: "Set up a split",
    image: cardImage("photo-1600880292203-757bb62b4baf"),
    feature: "stakeholders",
  },
  {
    to: "/fleet-listing",
    title: "Fleet pairing",
    tagline: "Lend your trucks, vans, bikes or trailers to the network and earn on idle days.",
    cta: "List a vehicle",
    image: cardImage("photo-1601584115197-04ecc0da31d7"),
    // No backend count for fleet listings yet, so this card always shows.
    feature: null,
  },
];

const EXPLORE_LINKS = [
  { to: "/rates", label: "Rate cards", description: "Build and publish your pricing" },
  { to: "/service", label: "Services", description: "Define what you offer customers" },
  { to: "/marketplace", label: "Network", description: "Marketplace, job briefs and routes" },
];

export const SelectWorkspaceScreen = () => {
  const navigate = useNavigate();
  const profile = usePartnerProfile();
  const { data: usage } = useWorkspaceFeatureUsage();
  const features = usage?.features ?? [];
  // A pitch for something the partner already uses is noise; the panel beside
  // these cards already shows it with real numbers.
  const inUse = new Set(features.filter((f) => f.in_use).map((f) => f.key));
  const pitches = QUICK_SERVICES.filter((s) => !s.feature || !inUse.has(s.feature));
  const [requested, setRequested] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchHovered, setSearchHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useClickOutside<HTMLDivElement>(() => setQuery(""));

  const requestAccess = (code: string) =>
    setRequested((prev) => (prev.includes(code) ? prev : [...prev, code]));

  // Header search runs over the same catalogue as the launcher, minus the entries
  // with nowhere to go — a result you can't open is noise in a search box.
  const matches = useMemo(
    () =>
      searchServices(query)
        .filter((item): item is typeof item & { to: string } => Boolean(item.to))
        .slice(0, MAX_RESULTS),
    [query],
  );

  const goTo = (to: string) => {
    setQuery("");
    navigate(to);
  };

  // A question is anything with a bit of substance in the box — the pill stays
  // inert for a stray character so it doesn't flicker on as you start typing.
  const askReady = query.trim().length > 2;

  // Hands the typed question to the global assistant (the orb), which can
  // actually perform actions — rather than a second, weaker chat surface.
  const askAzapal = (question: string) => {
    if (!askReady) return;
    const text = question.trim();
    setQuery("");
    assistantActions.ask(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Nothing in the catalogue matches, so this is phrased as a question rather
    // than a destination — Enter hands it to the assistant instead of dead-ending.
    if (!matches.length) {
      if (e.key === "Enter" && askReady) {
        e.preventDefault();
        askAzapal(query);
      } else if (e.key === "Escape") {
        setQuery("");
        inputRef.current?.blur();
      }
      return;
    }
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
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/azapallogoV1.svg" alt="Azapal" className="h-8 w-auto" />
            <span className="hidden h-5 w-px bg-slate-200 sm:block" />
            <ServiceLauncher />
            <div
              className="relative hidden w-80 md:block lg:w-[28rem]"
              ref={dropdownRef}
              onMouseEnter={() => setSearchHovered(true)}
              onMouseLeave={() => setSearchHovered(false)}
            >
              <MagnifyingGlass className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400" size={16} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search workspace, or ask a question"
                aria-label="Search workspace, or ask Azapal a question"
                className={`w-full rounded-lg border bg-slate-50 py-2 pl-9 pr-[6.5rem] text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-orange-100 ${askReady || searchHovered ? "border-orange-200 bg-white ask-azapal-glow" : "border-slate-200"}`}
              />

              {/*
                Ask Azapal sits inside the search field. Dormant until the bar is
                hovered (shimmer) and only becomes a real, pulsing button once
                there is a question to carry across — so it advertises itself
                without competing with search for an empty box.
              */}
              <button
                type="button"
                onClick={() => askAzapal(query)}
                disabled={!askReady}
                aria-label={askReady ? `Ask Azapal: ${query}` : "Ask Azapal — type a question first"}
                title={askReady ? "Ask Azapal" : "Type a question to ask Azapal"}
                className={`absolute right-1.5 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                  askReady
                    ? "ask-azapal-ready cursor-pointer bg-brand text-white shadow-sm hover:bg-brand-hover"
                    : `cursor-default text-slate-400 ${searchHovered ? "ask-azapal-pill ask-azapal-shimmer text-brand" : ""}`
                }`}
              >
                <i className={`ri-sparkling-2-${askReady ? "fill" : "line"} text-sm`} />
                Ask Azapal
              </button>

              {matches.length > 0 && (
                <div className="absolute left-0 top-full z-40 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                  {matches.map((item, i) => (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => goTo(item.to)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${i === activeIndex ? "bg-orange-50" : "hover:bg-slate-50"}`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium text-slate-800">{item.label}</span>
                      </span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-slate-400">{item.group}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="hidden sm:inline">Need help?</span>
            <button type="button" onClick={() => navigate("/helpCenter")} className="font-semibold text-brand hover:text-brand-hover">Help centre</button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* <div className="mb-7 flex w-full max-w-6xl flex-col items-start gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Your workspace</p>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Welcome{profile?.partner_name ? `, ${profile.partner_name}` : ""}
          </h1>
          <p className="text-sm text-slate-500">Choose a product to get started, or search for a task.</p>
        </div>

        <div className="grid w-full max-w-6xl gap-3 lg:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm shadow-slate-200/60 transition hover:border-orange-200 hover:shadow-md lg:col-span-2">
            <RoadSignIcon icon={Truck} label="Logistics management" size={22} />
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
              <div key={mod.code} className="flex items-center gap-3 rounded-2xl bg-white p-4 transition hover:border-slate-300 hover:shadow-md">
                <RoadSignIcon icon={mod.code === "azapal-tms-fms" ? Truck : Archive} label={mod.name} tone={mod.code === "azapal-tms-fms" ? "blue" : "slate"} size={21} />
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
        </div> */}

        {/* What's left to set up, above everything else — and gone entirely
            once there is nothing left to do. */}
        <div className="mt-8 w-full max-w-6xl">
          <SetupChecklist />
        </div>

        <section className="mt-10 w-full max-w-6xl" aria-labelledby="workspace-activity-heading">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Your activity</p>
            <h2 id="workspace-activity-heading" className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
              What you're using on Azapal
            </h2>
          </div>

          <div className="grid gap-3 lg:grid-cols-5">
            <div className={pitches.length ? "lg:col-span-3" : "lg:col-span-5"}>
              <FeatureUsagePanel />
            </div>

            {pitches.length > 0 && (
            <div className="grid content-start gap-3 lg:col-span-2">
              {pitches.map((service) => (
                <article
                  key={service.to}
                  className="flex overflow-hidden rounded-2xl bg-white transition hover:border-slate-300 hover:shadow-md"
                >
                  <img
                    src={service.image}
                    alt=""
                    loading="lazy"
                    className="h-full w-24 shrink-0 bg-slate-100 object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-center p-4">
                    <h3 className="text-sm font-semibold text-slate-900">{service.title}</h3>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">{service.tagline}</p>
                    <button
                      type="button"
                      onClick={() => navigate(service.to)}
                      className="mt-2 w-fit text-xs font-semibold text-brand hover:text-brand-hover"
                    >
                      {service.cta} <i className="ri-arrow-right-line align-middle" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            )}
          </div>
        </section>

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

          <div className="grid gap-3 md:grid-cols-2">
            <article className="overflow-hidden rounded-2xl bg-white shadow-card">
              <img
                src={OVERVIEW_IMAGES.welcome}
                alt=""
                loading="lazy"
                className="h-32 w-full bg-slate-100 object-cover"
              />
              <div className="p-5">
                <h3 className="text-sm font-semibold text-slate-900">Welcome to Azapal</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">Set up the essentials and get your team working with confidence.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => navigate("/settings")} className="rounded-lg bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100">
                    Business settings
                  </button>
                  <button type="button" onClick={() => navigate("/users")} className="rounded-lg bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100">
                    Invite your team
                  </button>
                </div>
              </div>
            </article>

            <article className="overflow-hidden rounded-2xl bg-white shadow-card">
              <img
                src={OVERVIEW_IMAGES.explore}
                alt=""
                loading="lazy"
                className="h-32 w-full bg-slate-100 object-cover"
              />
              <div className="p-5">
                <h3 className="text-sm font-semibold text-slate-900">Explore Azapal</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">Discover tools that make rates, service and operations easier to manage.</p>
                <div className="mt-4">
                  {EXPLORE_LINKS.map((link) => (
                    <button
                      key={link.to}
                      type="button"
                      onClick={() => navigate(link.to)}
                      className="group flex w-full items-center gap-3 border-b border-slate-100 py-2.5 text-left transition-colors hover:bg-slate-50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-slate-800 group-hover:text-brand">{link.label}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-slate-400">{link.description}</span>
                      </span>
                      <i className="ri-arrow-right-s-line shrink-0 text-base text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                    </button>
                  ))}
                </div>
              </div>
            </article>

            <article className="overflow-hidden rounded-2xl bg-white shadow-card">
              <img
                src={OVERVIEW_IMAGES.security}
                alt=""
                loading="lazy"
                className="h-32 w-full bg-slate-100 object-cover"
              />
              <div className="p-5">
                <h3 className="text-sm font-semibold text-slate-900">Security</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">Keep access limited to the right people and review activity when needed.</p>
                <button type="button" onClick={() => navigate("/activity-log")} className="mt-4 text-xs font-semibold text-brand hover:text-brand-hover">
                  Review activity log <i className="ri-arrow-right-line align-middle" />
                </button>
              </div>
            </article>

            <article className="overflow-hidden rounded-2xl bg-white shadow-card">
              <img
                src={OVERVIEW_IMAGES.announcements}
                alt=""
                loading="lazy"
                className="h-32 w-full bg-slate-100 object-cover"
              />
              <div className="p-5">
                <h3 className="text-sm font-semibold text-slate-900">Latest announcements</h3>
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
