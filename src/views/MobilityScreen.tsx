import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { useGetPartnerServices } from "../hooks/useServices";
import { usePartnerProfile } from "../hooks/useAuth";
import { useOnboarding } from "../hooks/useKyc";
import { useMobilityApps } from "../hooks/useMobility";
import { StatusBadge } from "../components/mobility/AppStatusCard";
import { WhiteLabelConfigurator } from "../components/mobility/WhiteLabelConfigurator";
import { CustomAppBuilder } from "../components/mobility/CustomAppBuilder";
import type { MobilityProduct } from "../service/partnerService";

/**
 * Mobility — the app a partner's customers use, two ways.
 *
 *   - The Azapal app, white-labelled: their logo and colours on Azapal's own
 *     customer app. Live the day it's accepted, billed monthly while active.
 *   - Their own app: a separate build under their name. Billed once.
 *
 * Neither has a list price. Sales quotes each partner from the KYC portal and
 * nothing is billed until the partner accepts — see AppStatusCard. The product
 * is in the URL (?app=) so a link from sales can land on the right one.
 */

const PRODUCTS: {
  id: MobilityProduct;
  param: string;
  title: string;
  blurb: string;
  billing: string;
  icon: string;
}[] = [
  {
    id: "white_label",
    param: "azapal",
    title: "Azapal app, your brand",
    blurb: "Your logo and colours on the Azapal customer app. Live as soon as you accept.",
    billing: "Monthly, while active",
    icon: "ri-palette-line",
  },
  {
    id: "custom",
    param: "custom",
    title: "Your own app",
    blurb: "A separate app in the App Store and Play Store under your name, built to your configuration.",
    billing: "One-time, quoted by sales",
    icon: "ri-smartphone-line",
  },
];

export const MobilityScreen = () => {
  const profile = usePartnerProfile();
  const { data: services = [] } = useGetPartnerServices();
  const { data: onboarding } = useOnboarding();
  const { data: apps, isLoading, error } = useMobilityApps();
  const [searchParams, setSearchParams] = useSearchParams();

  const selected = PRODUCTS.find((p) => p.param === searchParams.get("app")) ?? PRODUCTS[0];
  const pick = (param: string) =>
    setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set("app", param); return next; }, { replace: true });

  const billableBlocked = !!onboarding?.billable_blocked;
  const partnerName = profile?.partner_name;

  return (
    <DashboardLayout>
      {/* One centred column while the preview canvas is hidden. */}
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 overflow-y-auto">
        <p className="text-sm text-gray-500">The app your customers book and track in. Pick how you want it.</p>

        <div role="tablist" aria-label="App type" className="grid gap-3 sm:grid-cols-2">
          {PRODUCTS.map((p) => {
            const on = p.id === selected.id;
            const app = apps?.[p.id] ?? null;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => pick(p.param)}
                className={`flex items-start gap-3 rounded-2xl border bg-white p-4 text-left shadow-card transition-colors ${
                  on ? "border-brand ring-4 ring-orange-50" : "border-transparent hover:border-gray-200"
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${on ? "bg-brand text-white" : "bg-gray-100 text-gray-500"}`}>
                  <i className={`${p.icon} text-lg`} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm font-semibold ${on ? "text-brand" : "text-gray-900"}`}>{p.title}</span>
                    {app && <StatusBadge status={app.status} />}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-gray-500">{p.blurb}</span>
                  <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                    <i className="ri-price-tag-3-line" />{p.billing}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center rounded-2xl bg-white py-16 shadow-card">
            <i className="ri-loader-4-line animate-spin text-2xl text-gray-300" />
          </div>
        ) : error ? (
          <div className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3">
            <i className="ri-error-warning-line mt-0.5 text-base text-red-600" />
            <p className="text-xs leading-5 text-red-800">
              Couldn't load your apps — {error instanceof Error ? error.message : "please try again"}.
            </p>
          </div>
        ) : selected.id === "white_label" ? (
          <WhiteLabelConfigurator
            app={apps?.white_label ?? null}
            partnerName={partnerName}
            services={services.slice(0, 4).map((s) => s.name)}
            billableBlocked={billableBlocked}
          />
        ) : (
          <CustomAppBuilder
            app={apps?.custom ?? null}
            partnerName={partnerName}
            services={services}
            billableBlocked={billableBlocked}
          />
        )}
      </div>
    </DashboardLayout>
  );
};
