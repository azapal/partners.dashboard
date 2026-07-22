import { useState } from "react";
import { SidebarButton } from "../dashboard/SideBar";
import { useRepProfile } from "../../hooks/useRepAuth";
import { isManagerRole } from "../../service/repService";

function RepSideBar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const profile = useRepProfile();
  const isManager = isManagerRole(profile?.invite_role?.name);

  return (
    <aside
      className={`flex-col gap-1 py-5 relative hidden md:flex transition-all duration-300 bg-white border-r border-gray-100 shadow-sm
        ${isCollapsed ? "w-[68px] px-2" : "w-56 px-4"}`}
    >
      <div className={`flex items-center mb-6 ${isCollapsed ? "justify-center" : "justify-between"}`}>
        <a href="/support/dashboard" aria-label="Home" className="flex-shrink-0">
          <img
            src="/azapallogoV1.svg"
            alt="Azapal Logo"
            className={`transition-all duration-300 ${isCollapsed ? "w-8 h-9" : "w-[52px] h-[60px]"}`}
          />
        </a>
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Collapse sidebar"
          >
            <i className="ri-arrow-left-s-line text-lg" />
          </button>
        )}
      </div>

      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors self-center mb-4"
          aria-label="Expand sidebar"
        >
          <i className="ri-arrow-right-s-line text-lg" />
        </button>
      )}

      {!isCollapsed && (
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-1">
          Menu
        </p>
      )}

      <nav className="flex flex-col gap-0.5">
        <SidebarButton to="/support/dashboard" className="ri-home-6-line" isCollapsed={isCollapsed}>
          Dashboard
        </SidebarButton>

        <SidebarButton to="/support/orders" className="ri-truck-line" isCollapsed={isCollapsed}>
          Orders
        </SidebarButton>

        {isManager && (
          <SidebarButton to="/support/team" className="ri-team-line" isCollapsed={isCollapsed}>
            Team Overview
          </SidebarButton>
        )}

        <SidebarButton to="/support/shift-mates" className="ri-group-line" isCollapsed={isCollapsed}>
          Shift Mates
        </SidebarButton>

        <SidebarButton to="/support/profile" className="ri-user-settings-line" isCollapsed={isCollapsed}>
          Profile
        </SidebarButton>
      </nav>
    </aside>
  );
}

export default RepSideBar;
