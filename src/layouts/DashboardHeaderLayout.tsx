import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePartnerProfile, useCurrentUserDisplay } from "../hooks/useAuth";
import { restartProductTour } from "../components/tour/ProductTour";

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
      <header data-tour="dashboard-header" className="flex items-center justify-between py-3 border-b border-gray-100">
        <div>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">
            {displayName}
          </p>
          <h1 className="font-bold text-[22px] text-gray-900 leading-tight">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <button
            className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors shadow-sm"
            aria-label="Notifications"
          >
            <i className="ri-notification-3-line text-base" />
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
              <i className={`ri-arrow-${menuOpen ? "up" : "down"}-s-line text-gray-400 text-base`} />
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
                    <i className="ri-apps-2-line text-base text-gray-400" />
                    Switch Workspace
                  </button>
                )}
                <button
                  onClick={() => { setMenuOpen(false); navigate("/settings"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <i className="ri-settings-3-line text-base text-gray-400" />
                  Settings
                </button>
                <button
                  onClick={() => { setMenuOpen(false); restartProductTour("main"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <i className="ri-play-circle-line text-base text-gray-400" />
                  Replay workspace tour
                </button>
                <button
                  onClick={() => (location.href = "/LogoutScreen")}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left border-t border-gray-50"
                >
                  <i className="ri-logout-box-r-line text-base" />
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
