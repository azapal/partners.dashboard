import { useLocation } from "react-router-dom";
import { sheetActions } from "../store/client/sheets";
import { usePartnerProfile } from "../hooks/useAuth";

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  service: "Services",
  settings: "Settings",
  customers: "Customers",
};

export const DashboardHeaderLayout = () => {
  const route = useLocation();
  const profile = usePartnerProfile();

  const segment = route?.pathname.replace(/\//g, "") || "dashboard";
  const pageTitle = PAGE_TITLES[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);

  const displayName = profile?.partner_name ?? "Partner";
  const displayUser = profile?.partner_user ?? "";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  function handleProfileClick() {
    sheetActions.toggleBasicResizableSheet({
      name: "accountView",
      show: true,
      props: { title: "account information" },
    });
  }

  return (
    <div className="w-full mb-6 sticky top-0 z-20 bg-white pt-1">
      <header className="flex items-center justify-between py-3 border-b border-gray-100">
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
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F14724] rounded-full border border-white" />
          </button>

          {/* User profile */}
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl pl-3 pr-1.5 py-1.5 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-gray-800 leading-tight">{displayUser}</p>
              <p className="text-[10px] text-gray-400 leading-tight">{profile?.partner_email ?? ""}</p>
            </div>
            {/* Avatar: initials fallback */}
            <div className="w-7 h-7 rounded-lg bg-[#F14724] flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">{initials}</span>
            </div>
          </button>
        </div>
      </header>
    </div>
  );
};
