import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, CaretDown, CaretUp, Gear, PlayCircle, SignOut, SquaresFour } from "@phosphor-icons/react";
import { usePartnerProfile, useCurrentUserDisplay } from "../hooks/useAuth";
import { restartProductTour } from "../components/tour/ProductTour";
import { assistantActions } from "../store/client/assistant";
import { ServiceLauncher } from "../components/workspace/ServiceLauncher";

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  service: "Services",
  settings: "Settings",
  customers: "Customers",
};

export const DashboardHeaderLayout = () => {
  const route = useLocation();
  const navigate = useNavigate();
  const isPartnerSession = !!usePartnerProfile();
  const user = useCurrentUserDisplay();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const segment = route?.pathname.replace(/\//g, "") || "dashboard";
  const pageTitle = PAGE_TITLES[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);

  const displayName = user?.name ?? "Partner";
  const displayEmail = user?.email ?? "";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <div className="w-full mb-6 sticky top-0 z-20 bg-white pt-1">
      <header data-tour="dashboard-header" className="flex items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* The way out of the current category — the rail only covers this one. */}
          <div className="hidden md:block">
            <ServiceLauncher />
          </div>
          <div className="min-w-0">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">
            {displayName}
          </p>
          <h1 className="truncate font-bold text-[22px] text-gray-900 leading-tight">{pageTitle}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search everything — same catalogue as the launcher, via the assistant. */}
          <button
            onClick={() => assistantActions.open()}
            className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-400 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-600 lg:flex"
            aria-label="Search services"
          >
            <i className="ri-search-line text-sm" />
            <span>Search</span>
            <span className="rounded border border-gray-200 px-1 py-0.5 text-[9px] font-semibold text-gray-400">⌘K</span>
          </button>

          {/* Summons the assistant. Cmd/Ctrl-K does the same from anywhere. */}
          <button
            onClick={() => assistantActions.open()}
            aria-label="Ask Azapal"
            title="Ask Azapal  (⌘K)"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-gray-200 text-brand hover:bg-orange-50 hover:border-orange-200 transition-colors shadow-sm"
          >
            <i className="ri-sparkling-2-fill text-base" />
          </button>

          {/* Notification bell */}
          <button
            className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors shadow-sm"
            aria-label="Notifications"
          >
            <Bell size={17} weight="duotone" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full border border-white" />
          </button>

          {/* User profile dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl pl-3 pr-1.5 py-1.5 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-gray-800 leading-tight">{displayName}</p>
                <p className="text-[10px] text-gray-400 leading-tight">{displayEmail}</p>
              </div>
              {/* Avatar: initials fallback */}
              <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-bold">{initials}</span>
              </div>
              {menuOpen ? <CaretUp size={16} className="text-gray-400" /> : <CaretDown size={16} className="text-gray-400" />}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
                  <p className="text-xs text-gray-400 truncate">{displayEmail}</p>
                </div>
                {isPartnerSession && (
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/select-workspace"); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                  >
                    <SquaresFour size={17} weight="duotone" className="text-gray-400" />
                    Switch Workspace
                  </button>
                )}
                <button
                  onClick={() => { setMenuOpen(false); navigate("/settings"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <Gear size={17} weight="duotone" className="text-gray-400" />
                  Settings
                </button>
                <button
                  onClick={() => { setMenuOpen(false); restartProductTour("main"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <PlayCircle size={17} weight="duotone" className="text-gray-400" />
                  Replay workspace tour
                </button>
                <button
                  onClick={() => (location.href = "/LogoutScreen")}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left border-t border-gray-50"
                >
                  <SignOut size={17} weight="duotone" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};
