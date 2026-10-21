import { NavLink } from "react-router-dom";
import { useRepProfile } from "../../hooks/useRepAuth";
import { canWorkQuoteLeads, isManagerRole } from "../../service/repService";

interface TabItem {
  to: string;
  icon: string;
  label: string;
}

const tabs: TabItem[] = [
  { to: "/support/dashboard", icon: "ri-home-6-line", label: "Home" },
  { to: "/support/orders", icon: "ri-truck-line", label: "Orders" },
  { to: "/support/quote-requests", icon: "ri-price-tag-3-line", label: "Quotes" },
  { to: "/support/team", icon: "ri-team-line", label: "Team" },
  { to: "/support/shift-mates", icon: "ri-group-line", label: "Shifts" },
  { to: "/support/profile", icon: "ri-user-settings-line", label: "Profile" },
];

export const RepBottomTab = () => {
  const profile = useRepProfile();
  const visibleTabs = tabs.filter((t) =>
    t.to === "/support/team"
      ? isManagerRole(profile?.invite_role?.name)
      : t.to !== "/support/quote-requests" || canWorkQuoteLeads(profile?.invite_role?.name),
  );

  // Up to six tabs have to fit a 390px screen, so the bar spans the width and
  // each tab takes an equal share rather than a fixed minimum.
  return (
    <div className="w-full flex md:hidden items-center justify-center fixed bottom-0 right-0 left-0 pb-safe z-30 px-3">
      <nav
        data-tour="support-bottom-nav"
        className="flex w-full max-w-md bg-white/95 backdrop-blur border border-gray-100 gap-0.5 p-1.5 mb-3 rounded-2xl shadow-[0_12px_32px_-12px_rgba(13,27,61,0.35)]"
      >
        {visibleTabs.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            data-tour={`support-${to.replace("/support/", "")}`}
            className={({ isActive }) =>
              `flex flex-1 min-w-0 flex-col items-center gap-0.5 px-1 py-2 rounded-xl transition-all duration-200
              ${isActive
                ? "bg-brand text-white shadow-sm shadow-brand/30"
                : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <i className={`${icon} text-lg leading-none ${isActive ? "text-white" : ""}`} />
                <span className={`w-full truncate text-center text-[10px] font-semibold ${isActive ? "text-white" : ""}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
