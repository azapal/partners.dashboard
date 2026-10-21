import { useState } from "react";
import { SidebarButton } from "../dashboard/SideBar";
import { useRepProfile } from "../../hooks/useRepAuth";
import { canWorkQuoteLeads, isManagerRole } from "../../service/repService";

function RepSideBar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const profile = useRepProfile();
  const isManager = isManagerRole(profile?.invite_role?.name);
  const canSeeLeads = canWorkQuoteLeads(profile?.invite_role?.name);

  const sectionLabel = (text: string) =>
    !isCollapsed ? (
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mt-4 mb-1">{text}</p>
    ) : (
      <span className="mx-auto my-3 block h-px w-6 bg-gray-100" />
    );

  return (
    <aside
      data-tour="support-sidebar"
      className={`flex-col shrink-0 py-5 relative hidden md:flex transition-all duration-300 bg-white border-r border-gray-100
        ${isCollapsed ? "w-[72px] px-2" : "w-60 px-3"}`}
    >
      <div className={`flex items-center mb-5 ${isCollapsed ? "justify-center" : "justify-between px-2"}`}>
        <a href="/support/dashboard" aria-label="Home" className="flex shrink-0 items-center gap-2.5">
          <img src="/azapallogoV1.svg" alt="Azapal Logo" className="h-9 w-8" />
          {!isCollapsed && (
            <span className="leading-tight">
              <span className="block text-sm font-bold text-gray-900">Azapal</span>
              <span className="block text-[11px] font-medium text-gray-400">Operations</span>
            </span>
          )}
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
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors self-center mb-2"
          aria-label="Expand sidebar"
        >
          <i className="ri-arrow-right-s-line text-lg" />
        </button>
      )}

      {/* Which branch this session works in — branch logins can pick any. */}
      {!isCollapsed && profile && (
        <div className="mx-1 mb-1 rounded-2xl bg-linear-to-br from-brand-navy to-[#1a2b57] p-3.5 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-200/90">Signed in to</p>
          <p className="mt-1 flex items-center gap-1.5 truncate text-sm font-semibold">
            <i className="ri-git-branch-line text-amber-300" />
            <span className="truncate">{profile.branch?.branch_code ?? "Your branch"}</span>
          </p>
          {profile.inviting_partner?.partner_name && (
            <p className="mt-0.5 truncate text-[11px] text-white/60">{profile.inviting_partner.partner_name}</p>
          )}
        </div>
      )}

      {sectionLabel("Daily work")}
      <nav className="flex flex-col gap-0.5">
        <SidebarButton to="/support/dashboard" className="ri-home-6-line" isCollapsed={isCollapsed}>
          Dashboard
        </SidebarButton>

        <div data-tour="support-orders">
          <SidebarButton to="/support/orders" className="ri-truck-line" isCollapsed={isCollapsed}>
            Orders
          </SidebarButton>
        </div>

        {canSeeLeads && (
          <SidebarButton to="/support/quote-requests" className="ri-price-tag-3-line" isCollapsed={isCollapsed}>
            Quote requests
          </SidebarButton>
        )}
      </nav>

      {sectionLabel("Team")}
      <nav className="flex flex-col gap-0.5">
        <div data-tour="support-shift-mates">
          <SidebarButton to="/support/shift-mates" className="ri-group-line" isCollapsed={isCollapsed}>
            Shift Mates
          </SidebarButton>
        </div>

        {isManager && (
          <div data-tour="support-team">
            <SidebarButton to="/support/team" className="ri-team-line" isCollapsed={isCollapsed}>
              Team Overview
            </SidebarButton>
          </div>
        )}

        {isManager && (
          <SidebarButton to="/support/quote-page" className="ri-pages-line" isCollapsed={isCollapsed}>
            Quote page
          </SidebarButton>
        )}
      </nav>

      <div className="mt-auto pt-4">
        <SidebarButton to="/support/profile" className="ri-user-settings-line" isCollapsed={isCollapsed}>
          Profile
        </SidebarButton>
      </div>
    </aside>
  );
}

export default RepSideBar;
