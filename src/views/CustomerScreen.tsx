import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { CustomersTab } from "../components/customers/CustomersTab";
import { CampaignsTab } from "../components/customers/CampaignsTab";
import { TemplatesTab } from "../components/customers/TemplatesTab";
import { ComposeEmailModal } from "../components/customers/ComposeEmailModal";
import { CampaignBuilder } from "../components/customers/CampaignBuilder";
import { isCampaignInProgress, useEmailCampaigns } from "../hooks/useEmailCampaigns";
import type { BuilderSeed } from "../lib/emailDesign";
import type { Customer } from "../service/partnerService";

/**
 * Customers, and emailing them.
 *
 * Everyone who has dealt with the partner through any live service, and the
 * campaigns (promo, seasonal, discount, update) sent to them. Mail goes through
 * Azapal as "<Partner> via Azapal" with Reply-To the partner; each email is
 * billed per send and a single send reaches at most 10,000 people.
 *
 * `?tab=` is the navigation. The composer and the builder are opened from here
 * — and from the quote requests panel, which hands a builder seed over in
 * router state when "Open full editor" is pressed there.
 */

type Tab = "customers" | "campaigns" | "templates";
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "customers", label: "Customers", icon: "ri-group-line" },
  { id: "campaigns", label: "Campaigns", icon: "ri-mail-send-line" },
  { id: "templates", label: "Templates", icon: "ri-layout-masonry-line" },
];

export const CustomerScreen = () => {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const tab: Tab = TABS.some((t) => t.id === params.get("tab")) ? (params.get("tab") as Tab) : "customers";
  const showTab = useCallback((t: Tab) => setParams(t === "customers" ? {} : { tab: t }), [setParams]);

  const [composeTo, setComposeTo] = useState<Customer[] | null>(null);
  const [builder, setBuilder] = useState<BuilderSeed | null>(null);

  // A seed handed over from another screen opens the builder once, then is
  // cleared from history so Back/refresh doesn't reopen it.
  useEffect(() => {
    const seed = (location.state as { builder?: BuilderSeed } | null)?.builder;
    if (seed) {
      setBuilder(seed);
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
  }, [location.state, location.pathname, location.search, navigate]);

  const { data: campaigns = [] } = useEmailCampaigns();
  const sending = campaigns.filter(isCampaignInProgress).length;

  const openBuilder = (seed: BuilderSeed) => {
    setComposeTo(null);
    setBuilder(seed);
  };

  return (
    <DashboardLayout>
      <div className="flex w-full min-w-0 flex-col gap-5 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-gray-500">
              Everyone who's booked, asked for a quote or paid you — across all your services. Email one of them, or send a campaign to many.
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
              <i className="ri-mail-line" />Sent by Azapal under your name; replies come to your email. ₦100 per email, up to 10,000 per send.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openBuilder({ mode: "campaign" })}
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
          >
            <i className="ri-add-line" />New campaign
          </button>
        </div>

        <div>
          <div role="tablist" className="flex w-full items-center gap-1 rounded-xl bg-white p-1 shadow-card sm:w-max">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => showTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold transition-colors sm:flex-none sm:px-3.5 ${
                  tab === t.id ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <i className={`${t.icon} hidden sm:inline`} />
                {t.label}
                {t.id === "campaigns" && sending > 0 && (
                  <span className={`flex items-center gap-1 rounded-full px-1.5 text-[10px] ${tab === t.id ? "bg-white/25" : "bg-orange-100 text-brand"}`}>
                    <i className="ri-loader-4-line animate-spin" />{sending}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {tab === "customers" && (
          <CustomersTab onCompose={setComposeTo} onCampaign={(audience) => openBuilder({ mode: "campaign", audience })} />
        )}
        {tab === "campaigns" && <CampaignsTab onNew={() => openBuilder({ mode: "campaign" })} />}
        {tab === "templates" && <TemplatesTab onOpen={openBuilder} onUse={openBuilder} />}
      </div>

      {composeTo && <ComposeEmailModal customers={composeTo} onClose={() => setComposeTo(null)} onOpenEditor={openBuilder} />}
      {builder && (
        <CampaignBuilder
          // A new seed is a new builder, not the old one's state with new props.
          key={JSON.stringify([builder.mode, builder.templateId, builder.startAt])}
          seed={builder}
          onClose={() => setBuilder(null)}
          onSent={() => showTab("campaigns")}
        />
      )}
    </DashboardLayout>
  );
};
