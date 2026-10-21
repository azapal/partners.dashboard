import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppsGridIcon } from "../icons/AppsGridIcon";
import { useClickOutside } from "../../hooks/useClickOutside";
import { getWorkspaceVisits, type WorkspaceVisit } from "../../lib/workspaceHistory";
import {
  ALL_SERVICES,
  SERVICE_GROUPS,
  STATUS_BADGE,
  isPlannedGroup,
  searchServices,
  type WorkspaceService,
} from "../../lib/data/workspaceServices";
import { assistantActions } from "../../store/client/assistant";

/**
 * The service launcher — the way between areas of the product.
 *
 * Three kinds of view, and the chrome changes with them:
 *   recent  — what you opened lately
 *   all     — every service A–Z, and the only view with a search box, because
 *             it is the only one where you don't already know where you are
 *   group   — one area, led by what it is for and a walkthrough; the items are
 *             the *end* of the panel, not the whole of it
 *
 * Lives in the dashboard shell as well as the workspace screen, which is what
 * makes the scoped sidebar viable: the rail shows only your current category,
 * so something has to reach the other services from anywhere.
 */

type View = { kind: "recent" } | { kind: "all" } | { kind: "group"; label: string };

// What can be opened today first; scope-only areas shelved under their own heading.
const railSections = [
  { heading: null, groups: SERVICE_GROUPS.filter((g) => !isPlannedGroup(g)) },
  { heading: "Coming soon", groups: SERVICE_GROUPS.filter(isPlannedGroup) },
];

const ServiceRow = ({
  service,
  onOpen,
  showGroup,
}: {
  service: WorkspaceService & { group?: string };
  onOpen: (s: { to?: string; launch?: "assistant" }) => void;
  showGroup?: boolean;
}) => {
  const badge = STATUS_BADGE[service.status];
  const routable = Boolean(service.to || service.launch);
  return (
    <button
      type="button"
      role="menuitem"
      disabled={!routable}
      onClick={() => onOpen(service)}
      className={`group flex items-start gap-3 rounded-lg p-2.5 text-left transition-colors ${
        routable ? "hover:bg-slate-50" : "cursor-default opacity-60"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          routable
            ? "bg-slate-100 text-slate-500 group-hover:bg-orange-50 group-hover:text-brand"
            : "bg-slate-50 text-slate-400"
        }`}
      >
        <i className={`${service.icon} text-base`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className={`truncate text-xs font-semibold ${routable ? "text-slate-800" : "text-slate-500"}`}>
            {service.label}
          </span>
          {badge && (
            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-[11px] leading-4 text-slate-400">
          {showGroup && service.group ? `${service.group} · ` : ""}
          {service.description}
        </span>
      </span>
      {routable && (
        <i className="ri-arrow-right-s-line mt-0.5 shrink-0 text-base text-transparent transition-colors group-hover:text-brand" />
      )}
    </button>
  );
};

export const ServiceLauncher = ({ align = "left" }: { align?: "left" | "right" }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ kind: "recent" });
  const [query, setQuery] = useState("");
  // "More about this area" is opt-in: the services are what people came for.
  const [showAbout, setShowAbout] = useState(false);
  const [visits, setVisits] = useState<WorkspaceVisit[]>(getWorkspaceVisits);
  const ref = useClickOutside<HTMLDivElement>(() => { setOpen(false); setQuery(""); });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); setQuery(""); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => { setShowAbout(false); }, [view]);

  const results = useMemo(() => searchServices(query), [query]);

  // History stores bare pathnames; catalogue entries may carry ?tab= deep links.
  const recent = useMemo(
    () =>
      visits
        .map((visit) => ALL_SERVICES.find((service) => service.to?.split("?")[0] === visit.to))
        .filter((service): service is (typeof ALL_SERVICES)[number] => Boolean(service)),
    [visits],
  );

  /** Every service A–Z, bucketed by first letter. */
  const alphabetical = useMemo(() => {
    const buckets = new Map<string, typeof ALL_SERVICES>();
    for (const service of [...ALL_SERVICES].sort((a, b) => a.label.localeCompare(b.label))) {
      const letter = service.label[0].toUpperCase();
      if (!buckets.has(letter)) buckets.set(letter, []);
      buckets.get(letter)!.push(service);
    }
    return [...buckets.entries()];
  }, []);

  // A first run has no history, so "recent" would open onto an empty panel.
  const effective: View = view.kind === "recent" && recent.length === 0 ? { kind: "all" } : view;
  const group = effective.kind === "group" ? SERVICE_GROUPS.find((g) => g.label === effective.label) : undefined;

  const openService = (service: { to?: string; launch?: "assistant" }) => {
    if (!service.to && !service.launch) return;
    setOpen(false);
    setQuery("");
    if (service.launch === "assistant") {
      assistantActions.open();
      return;
    }
    if (service.to) navigate(service.to);
  };

  const railItem = (active: boolean) =>
    `flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors sm:w-full ${
      active ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Open workspace services"
        aria-expanded={open}
        aria-haspopup="menu"
        title="All services"
        onClick={() => { setVisits(getWorkspaceVisits()); setOpen((v) => !v); }}
        className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
          open
            ? "border-orange-200 bg-orange-50 text-brand"
            : "border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-800"
        }`}
      >
        <AppsGridIcon open={open} />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute top-full z-40 mt-3 flex h-[calc(100vh-6rem)] w-[min(1040px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl bg-white text-left shadow-2xl shadow-slate-900/25 sm:flex-row ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {/* Rail — brand navy, so the panel reads as one surface rather than two cards. */}
          <nav
            className="flex w-full shrink-0 gap-1 overflow-x-auto bg-brand-navy p-3 sm:block sm:w-56 sm:overflow-y-auto"
            aria-label="Service categories"
          >
            <button
              type="button"
              onClick={() => { setVisits(getWorkspaceVisits()); setView({ kind: "recent" }); setQuery(""); }}
              className={railItem(effective.kind === "recent")}
            >
              <i className="ri-time-line text-sm" />
              Recently visited
            </button>
            <button
              type="button"
              onClick={() => { setView({ kind: "all" }); setQuery(""); }}
              className={`mt-1 ${railItem(effective.kind === "all")}`}
            >
              <i className="ri-list-check-2 text-sm" />
              All services
              <span className="ml-auto hidden text-[10px] font-medium text-white/40 sm:inline">
                {ALL_SERVICES.length}
              </span>
            </button>

            <span className="my-2 hidden h-px bg-white/15 sm:block" />

            {railSections.map(({ heading, groups }) => (
              <div key={heading ?? "live"} className="contents sm:block">
                {heading && (
                  <span className="mx-2.5 mb-1 mt-4 hidden text-[10px] font-semibold uppercase tracking-wider text-white/35 sm:block">
                    {heading}
                  </span>
                )}
                {groups.map((g) => (
                  <button
                    key={g.label}
                    type="button"
                    onClick={() => { setView({ kind: "group", label: g.label }); setQuery(""); }}
                    className={`mt-1 ${railItem(effective.kind === "group" && effective.label === g.label)}`}
                  >
                    <span className="truncate">{g.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 pt-5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-semibold text-slate-900">
                    {effective.kind === "recent"
                      ? "Recently visited"
                      : effective.kind === "all"
                        ? "All services"
                        : group?.label}
                  </h2>
                  {group && (
                    <button
                      type="button"
                      onClick={() => setShowAbout((v) => !v)}
                      aria-expanded={showAbout}
                      aria-label={`More about ${group.label}`}
                      title={`More about ${group.label}`}
                      className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                        showAbout ? "bg-brand text-white" : "text-slate-300 hover:bg-slate-100 hover:text-slate-600"
                      }`}
                    >
                      <i className="ri-information-line text-sm" />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                  {effective.kind === "recent"
                    ? "Where you've been lately."
                    : effective.kind === "all"
                      ? "Everything Azapal covers, A to Z."
                      : group?.caption}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setOpen(false); setQuery(""); }}
                aria-label="Close services menu"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* Search belongs only to the A–Z view: inside a group you already
                know where you are, and the box was just chrome. */}
            {effective.kind === "all" && (
              <div className="relative mt-3 px-5">
                <i className="ri-search-line absolute left-8 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search all services"
                  aria-label="Search all services"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>
            )}

            <div className="mt-3 flex-1 overflow-y-auto px-5 pb-5">
              {/* ── A group: what it's for, a walkthrough, then the services ── */}
              {effective.kind === "group" && group && (
                <>
                  {showAbout && (
                    <div className="mb-4 rounded-xl bg-slate-50 p-4">
                      <p className="text-xs leading-6 text-slate-600">{group.description}</p>
                      <div className="mt-3 max-w-md overflow-hidden rounded-xl bg-slate-900">
                        {group.videoUrl ? (
                          <video src={group.videoUrl} controls className="aspect-video w-full" />
                        ) : (
                          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 text-center">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/70">
                              <i className="ri-play-fill text-xl" />
                            </span>
                            <p className="text-xs font-semibold text-white/80">Walkthrough coming</p>
                            <p className="max-w-xs text-[11px] leading-4 text-white/40">
                              A short video on {group.label.toLowerCase()} will sit here.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <p className="mt-5 mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {group.items.length} service{group.items.length === 1 ? "" : "s"}
                  </p>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {group.items.map((service) => (
                      <ServiceRow key={service.label} service={service} onOpen={openService} />
                    ))}
                  </div>
                </>
              )}

              {/* ── A–Z, or search results across everything ── */}
              {effective.kind === "all" &&
                (query.trim() ? (
                  results.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-400">No service matches that.</p>
                  ) : (
                    <>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        {results.length} result{results.length === 1 ? "" : "s"}
                      </p>
                      <div className="grid gap-1 sm:grid-cols-2">
                        {results.map((service) => (
                          <ServiceRow key={`${service.group}-${service.label}`} service={service} onOpen={openService} showGroup />
                        ))}
                      </div>
                    </>
                  )
                ) : (
                  alphabetical.map(([letter, services]) => (
                    <div key={letter} className="mb-4">
                      <p className="mb-1 border-b border-slate-100 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand">
                        {letter}
                      </p>
                      <div className="grid gap-1 sm:grid-cols-2">
                        {services.map((service) => (
                          <ServiceRow key={`${service.group}-${service.label}`} service={service} onOpen={openService} showGroup />
                        ))}
                      </div>
                    </div>
                  ))
                ))}

              {/* ── Recently visited ── */}
              {effective.kind === "recent" && (
                <div className="grid gap-1 sm:grid-cols-2">
                  {recent.map((service) => (
                    <ServiceRow key={`${service.group}-${service.label}`} service={service} onOpen={openService} showGroup />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
