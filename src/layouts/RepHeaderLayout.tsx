import { Link, useLocation } from "react-router-dom";
import { useRepProfile, useRepLogout } from "../hooks/useRepAuth";
import { useNavigate } from "react-router-dom";
import { restartProductTour } from "../components/tour/ProductTour";
import { assistantActions } from "../store/client/assistant";

const PAGE_TITLES: Record<string, string> = {
  "support-dashboard": "Dashboard",
  "support-orders": "Orders",
  "support-team": "Team Overview",
  "support-quote-requests": "Quote requests",
  "support-quote-page": "Quote page",
  "support-shift-mates": "Shift Mates",
  "support-profile": "Profile",
};

const iconButton =
  "w-9 h-9 shrink-0 rounded-xl flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors shadow-sm";

export const RepHeaderLayout = () => {
  const route = useLocation();
  const profile = useRepProfile();
  const logout = useRepLogout();
  const navigate = useNavigate();

  const segment = route?.pathname.replace(/^\//, "").replace(/\//g, "-") || "support-dashboard";
  const pageTitle = PAGE_TITLES[segment] ?? "Dashboard";

  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : "Rep";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const handleLogout = () => {
    logout();
    navigate("/support/login");
  };

  return (
    <div className="w-full mb-6 sticky top-0 z-20 bg-white/95 backdrop-blur pt-1">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 py-3 border-b border-gray-100">
        <div className="min-w-0">
          <p className="mb-1 inline-flex max-w-full items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            <i className="ri-git-branch-line" />
            <span className="truncate">{profile?.branch?.branch_code ?? "Branch"}</span>
          </p>
          <h1 className="truncate font-bold text-xl sm:text-[22px] text-gray-900 leading-tight">{pageTitle}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Mirrors DashboardHeaderLayout — the two shells are parallel
              implementations, so header affordances have to land in both. */}
          <button
            onClick={() => assistantActions.open()}
            aria-label="Ask Azapal"
            title="Ask Azapal  (⌘K)"
            className={`${iconButton} text-brand hover:bg-orange-50 hover:border-orange-200 hover:text-brand`}
          >
            <i className="ri-sparkling-2-fill text-base" />
          </button>

          <button
            onClick={() => restartProductTour("support")}
            className={iconButton}
            aria-label="Replay workspace tour"
            title="Replay workspace tour"
          >
            <i className="ri-play-circle-line text-base" />
          </button>

          <button onClick={handleLogout} className={iconButton} aria-label="Log out" title="Log out">
            <i className="ri-logout-box-r-line text-base" />
          </button>

          <Link
            to="/support/profile"
            title="Your profile"
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 sm:pl-3 sm:pr-1.5 sm:py-1.5 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-gray-800 leading-tight">{displayName}</p>
              <p className="text-[10px] text-gray-400 leading-tight">{profile?.invite_role?.name ?? ""}</p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">{initials}</span>
            </div>
          </Link>
        </div>
      </header>
    </div>
  );
};
