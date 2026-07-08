import { useLocation } from "react-router-dom";
import { useRepProfile, useRepLogout } from "../hooks/useRepAuth";
import { useNavigate } from "react-router-dom";

const PAGE_TITLES: Record<string, string> = {
  "support-dashboard": "Dashboard",
  "support-shift-mates": "Shift Mates",
  "support-profile": "Profile",
};

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
    <div className="w-full mb-6 sticky top-0 z-20 bg-white pt-1">
      <header className="flex items-center justify-between py-3 border-b border-gray-100">
        <div>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">
            {profile?.branch?.branch_code ?? "Branch"}
          </p>
          <h1 className="font-bold text-[22px] text-gray-900 leading-tight">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors shadow-sm"
            aria-label="Log out"
            title="Log out"
          >
            <i className="ri-logout-box-r-line text-base" />
          </button>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl pl-3 pr-1.5 py-1.5 shadow-sm">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-gray-800 leading-tight">{displayName}</p>
              <p className="text-[10px] text-gray-400 leading-tight">{profile?.invite_role?.name ?? ""}</p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-[#F14724] flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">{initials}</span>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};
