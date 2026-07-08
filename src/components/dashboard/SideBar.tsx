import { NavLink } from "react-router-dom";
import { useState } from "react";

export function SidebarButton({ children, to = "", isCollapsed, ...iconProps }: any) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex flex-col md:flex-row items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
        ${isActive
          ? "bg-orange-50 text-[#F14724]"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
        }
        ${isCollapsed ? "justify-center px-0" : ""}
        `
      }
      title={isCollapsed ? (typeof children === "string" ? children : "") : ""}
    >
      {({ isActive }) => (
        <>
          {isActive && !isCollapsed && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#F14724] rounded-r-full" />
          )}
          <SidebarIcon
            {...iconProps}
            className={`${iconProps.className} text-lg ${isActive ? "text-[#F14724]" : "text-gray-400 group-hover:text-gray-700"}`}
          />
          {!isCollapsed && (
            <span className={isActive ? "text-[#F14724]" : ""}>{children}</span>
          )}
        </>
      )}
    </NavLink>
  );
}

export function SidebarIcon({ ...attributes }) {
  return <i {...attributes} />;
}

function SideBar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`flex-col gap-1 py-5 relative hidden md:flex transition-all duration-300 bg-white border-r border-gray-100 shadow-sm
        ${isCollapsed ? "w-[68px] px-2" : "w-56 px-4"}`}
    >
      {/* Logo + toggle */}
      <div className={`flex items-center mb-6 ${isCollapsed ? "justify-center" : "justify-between"}`}>
        <a href="/" aria-label="Home" className="flex-shrink-0">
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

      {/* Nav section label */}
      {!isCollapsed && (
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-1">
          Menu
        </p>
      )}

      <nav className="flex flex-col gap-0.5">
        <SidebarButton to="/dashboard" className="ri-home-6-line" isCollapsed={isCollapsed}>
          Dashboard
        </SidebarButton>

        <SidebarButton to="/service" className="ri-task-line" isCollapsed={isCollapsed}>
          Services
        </SidebarButton>

        <SidebarButton to="/branches" className="ri-git-branch-line" isCollapsed={isCollapsed}>
          Branches
        </SidebarButton>

        <SidebarButton to="/users" className="ri-group-line" isCollapsed={isCollapsed}>
          Users
        </SidebarButton>

        <SidebarButton to="/settings" className="ri-user-settings-line" isCollapsed={isCollapsed}>
          Settings
        </SidebarButton>
      </nav>
    </aside>
  );
}

export default SideBar;
