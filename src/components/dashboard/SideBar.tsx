import { NavLink, useLocation } from "react-router-dom";
import { categoryForPath } from "../../lib/data/navCategories";

/**
 * The category rail.
 *
 * Permanently narrow by design. It shows only what belongs to the category you
 * are currently in (see navCategories.ts) — running last mile and running a
 * warehouse are different jobs, and one flat list that holds every feature stops
 * being scannable the moment the product grows.
 *
 * Because it is scoped, it is not how you *change* area: that is the launcher in
 * the header (grid icon / ⌘K). The rail answers "what can I do here"; the
 * launcher answers "take me somewhere else".
 *
 * Labels live in a flyout on hover rather than an expand toggle, so the page
 * never reflows and the icons stay in one place for muscle memory. `title` on
 * each link covers keyboard and touch, where hover does not exist.
 */

export function SidebarIcon({ ...attributes }) {
  return <i {...attributes} />;
}

/** Kept exported — other shells import this button shape. */
export function SidebarButton({ children, to = "", isCollapsed, ...iconProps }: any) {
  return (
    <NavLink
      to={to}
      title={typeof children === "string" ? children : undefined}
      className={({ isActive }) =>
        `relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group
        ${isActive ? "bg-orange-50 text-brand" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}
        ${isCollapsed ? "justify-center px-0" : ""}`
      }
    >
      {({ isActive }) => (
        <>
          <SidebarIcon
            {...iconProps}
            className={`${iconProps.className} text-lg ${isActive ? "text-brand" : "text-gray-400 group-hover:text-gray-700"}`}
          />
          {!isCollapsed && <span className={isActive ? "text-brand" : ""}>{children}</span>}
        </>
      )}
    </NavLink>
  );
}

function SideBar() {
  const { pathname } = useLocation();
  const category = categoryForPath(pathname);

  return (
    <aside
      data-tour="main-sidebar"
      className="group/rail relative z-30 hidden w-[76px] shrink-0 flex-col items-center gap-1 border-r border-gray-100 bg-white py-5 shadow-sm md:flex"
    >
      <a href="/" aria-label="Home" className="mb-5 shrink-0">
        <img src="/azapallogoV1.svg" alt="Azapal" className="h-9 w-8" />
      </a>

      {/* Category badge — tells you which area the rail below belongs to. */}
      <span
        className="mb-1 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white"
        title={category.label}
      >
        <i className={`${category.icon} text-base`} />
      </span>
      <span className="mb-3 w-full px-1 text-center text-[9px] font-semibold uppercase leading-tight tracking-wide text-gray-400">
        {category.label}
      </span>

      <nav className="flex w-full flex-col items-center gap-1 px-2" aria-label={`${category.label} navigation`}>
        {category.items.map((item) => (
          <div key={item.to} data-tour={`nav-${item.to.replace(/^\//, "")}`} className="w-full">
            <NavLink
              to={item.to}
              title={item.label}
              className={({ isActive }) =>
                `relative flex h-11 w-full items-center justify-center rounded-xl transition-colors
                ${isActive ? "bg-orange-50 text-brand" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand" />
                  )}
                  <i className={`${item.icon} text-lg`} />
                </>
              )}
            </NavLink>
          </div>
        ))}
      </nav>

      {/*
        Flyout. Absolutely positioned so hovering never reflows the page, and
        pointer-events-none until shown so it can't swallow clicks meant for the
        content beside it.
      */}
      <div className="pointer-events-none absolute left-full top-5 z-40 w-56 translate-x-[-8px] opacity-0 transition-all duration-150 group-hover/rail:pointer-events-auto group-hover/rail:translate-x-0 group-hover/rail:opacity-100">
        <div className="ml-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl shadow-slate-900/10">
          <p className="px-2 text-[11px] font-bold text-gray-800">{category.label}</p>
          <p className="mb-2 px-2 text-[10px] leading-4 text-gray-400">{category.caption}</p>
          <div className="flex flex-col gap-0.5">
            {category.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors
                  ${isActive ? "bg-orange-50 text-brand" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`
                }
              >
                <i className={`${item.icon} text-base`} />
                {item.label}
              </NavLink>
            ))}
          </div>
          <p className="mt-2 border-t border-gray-100 px-2 pt-2 text-[10px] leading-4 text-gray-400">
            Another area? Use the grid or press ⌘K.
          </p>
        </div>
      </div>
    </aside>
  );
}

export default SideBar;
