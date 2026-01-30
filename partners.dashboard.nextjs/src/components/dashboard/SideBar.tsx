import { NavLink } from "react-router-dom";

function SidebarButton({ children, to = "", ...iconProps }:any) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 hover:text-[#F14724] group
        ${isActive && " font-semibold active"}
        `
      }
    >
      <SidebarIcon alt={children + " icon"} {...iconProps} />
      {children}
      {
        <i className="hidden group-[.active]:block bg-red-500 w-1.5 h-1.5 rounded"></i>
      }
    </NavLink>
  );
}

function SidebarIcon({ ...attributes }) {
  return <img {...attributes} />;
}

function SideBar() {
  return (
    <aside className="w-52 flex flex-col gap-4 p-5 relative">
      <div className="flex flex-col gap-8 ">
        <a href="/">
          <img src="/azapallogoV1.svg" alt="" className="w-[61px] h-[71px]" />
        </a>
          {/*/!*admin *!/ sales/operations/engineers/*/}
          <SidebarButton to="/" src="/icons/home.svg">
          Dashboard
        </SidebarButton>

          {/*/!*admin */}
          <SidebarButton to="/products" src="/icons/product.svg">
          Services
        </SidebarButton>

          {/*/!*admin */}
          <SidebarButton to="/customers" src="/icons/customers.svg">
          Customers
        </SidebarButton>

          {/*/!*admin/engineers*/}
        {/*  <SidebarButton to="/customers" src="/icons/customers.svg">*/}
        {/*      Integrations*/}
        {/*</SidebarButton>*/}

          {/*/!*admin *!/ sales/operations/engineers/*/}
          <SidebarButton to="/settings" src="/icons/settings.svg">
              Settings
          </SidebarButton>
      </div>

    </aside>
  );
}

export default SideBar;
