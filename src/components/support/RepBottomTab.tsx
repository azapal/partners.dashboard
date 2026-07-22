import { NavLink } from "react-router-dom";
import { useRepProfile } from "../../hooks/useRepAuth";
import { isManagerRole } from "../../service/repService";

interface TabItem {
  to: string;
  icon: string;
  label: string;
}

const tabs: TabItem[] = [
  { to: "/support/dashboard", icon: "ri-home-6-line", label: "Dashboard" },
  { to: "/support/orders", icon: "ri-truck-line", label: "Orders" },
  { to: "/support/team", icon: "ri-team-line", label: "Team" },
  { to: "/support/shift-mates", icon: "ri-group-line", label: "Shift Mates" },
  { to: "/support/profile", icon: "ri-user-settings-line", label: "Profile" },
];

export const RepBottomTab = () => {
  const profile = useRepProfile();
  const visibleTabs = tabs.filter((t) => t.to !== "/support/team" || isManagerRole(profile?.invite_role?.name));

  return (
    <div className="w-full flex md:hidden items-center justify-center fixed bottom-0 right-0 left-0 pb-safe z-30">
      <nav className="flex bg-white/90 backdrop-blur-sm border border-gray-100 gap-1 p-1.5 mx-4 mb-3 rounded-2xl shadow-lg w-fit">
        {visibleTabs.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-all duration-200 min-w-16
              ${isActive
                ? "bg-[#F14724] text-white"
                : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <i className={`${icon} text-lg ${isActive ? "text-white" : ""}`} />
                <span className={`text-[10px] font-semibold ${isActive ? "text-white" : ""}`}>
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
