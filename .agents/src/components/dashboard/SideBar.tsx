import { NavLink } from "react-router-dom";
import { useState } from "react";

export function SidebarButton({ children, to = "", isCollapsed, ...iconProps }:any) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col md:flex-row text-sm md:text-md items-center md:gap-2 hover:text-[#F14724] group transition-all
        ${isActive && " font-semibold active"}
        ${isCollapsed ? "justify-center" : ""}
        `
      }
      title={isCollapsed ? children : ""}
    >
      <SidebarIcon alt={children + " icon"} {...iconProps} />
      {!isCollapsed && children}
      {/*{*/}
      {/*  <i className="hidden group-[.active]:block bg-red-500 w-2 h-2 rounded"></i>*/}
      {/*}*/}
    </NavLink>
  );
}

export function SidebarIcon({ ...attributes }) {
  return <i {...attributes}  />;
}

function SideBar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`flex-col gap-4 p-5 relative hidden md:flex transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-52'}`}>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <a href="/" aria-label="Home">
            <img 
              src="/azapallogoV1.svg" 
              alt="Azapal Logo" 
              className={`transition-all duration-300 ${isCollapsed ? 'w-[40px] h-[46px]' : 'w-[61px] h-[71px]'}`} 
            />
          </a>
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-gray-600 hover:text-[#F14724] transition-colors"
              aria-label="Collapse sidebar"
            >
              <i className="ri-arrow-left-s-line text-xl"></i>
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="text-gray-600 hover:text-[#F14724] transition-colors self-center"
            aria-label="Expand sidebar"
          >
            <i className="ri-arrow-right-s-line text-xl"></i>
          </button>
        )}
          
          {/*/!*admin *!/ sales/operations/engineers/*/}
          <SidebarButton to="/dashboard" className='ri-home-6-line' isCollapsed={isCollapsed}>
          Dashboard

        </SidebarButton>

          {/*/!*admin */}
          <SidebarButton to="/service" className='ri-task-line' isCollapsed={isCollapsed}>
          Services
        </SidebarButton>

          {/*/!*admin */}
        {/*  <SidebarButton to="/customers" src="/icons/customers.svg">*/}
        {/*  Customers*/}
        {/*</SidebarButton>*/}

          {/*/!*admin/engineers*/}
        {/*  <SidebarButton to="/customers" src="/icons/customers.svg">*/}
        {/*      Integrations*/}
        {/*</SidebarButton>*/}

          {/*/!*admin *!/ sales/operations/engineers/*/}
          <SidebarButton to="/settings" className='ri-user-settings-line' isCollapsed={isCollapsed}>
              Settings
          </SidebarButton>
      </div>

    </aside>
  );
}

export default SideBar;
