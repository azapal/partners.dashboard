import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SideBar from "../components/dashboard/SideBar";
import { DashboardHeaderLayout } from "./DashboardHeaderLayout";
import { BottomTab } from "../components/dashboard/BottomTab";
import { ProductTour } from "../components/tour/ProductTour";
import { recordWorkspaceVisit } from "../lib/workspaceHistory";
import { useOnboarding } from "../hooks/useKyc";
import { OnboardingBillingScreen } from "../views/OnboardingBillingScreen";

const BANNER_HIDDEN_KEY = "azapal-billing-reminder-hidden";

/**
 * The reminder a partner agreed to when they skipped billing setup. Hideable
 * for the rest of this browser session — not for good: the point of "remind me
 * later" is that later comes.
 */
const BillingSkippedBanner = () => {
  const [hidden, setHidden] = useState(() => {
    try { return sessionStorage.getItem(BANNER_HIDDEN_KEY) === "1"; } catch { return false; }
  });
  if (hidden) return null;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3">
      <i className="ri-bank-card-line text-lg text-amber-600" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-xs leading-5 text-amber-900">
        <strong className="font-semibold">Billing isn't set up yet.</strong> What you use is still charged, and your
        monthly bills stay unpaid until you add a card or transfer account.
      </p>
      <Link
        to="/PaymentMethod"
        className="rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
      >
        Set up billing
      </Link>
      <button
        type="button"
        onClick={() => {
          try { sessionStorage.setItem(BANNER_HIDDEN_KEY, "1"); } catch { /* fine — it just shows again */ }
          setHidden(true);
        }}
        aria-label="Hide for now"
        className="text-amber-500 hover:text-amber-800"
      >
        <i className="ri-close-line text-lg" />
      </button>
    </div>
  );
};

export const DashboardLayout = ({ children }: any) => {
  const location = useLocation();
  const { data: onboarding } = useOnboarding();

  useEffect(() => {
    recordWorkspaceVisit(location.pathname);
  }, [location.pathname]);

  // Signing up isn't finished until there's a way to pay for the account. The
  // check sits here rather than on each route because every dashboard screen
  // comes through this shell, so a typed URL can't step around it. While the
  // answer is still loading the app renders as normal — a flash of a gate that
  // then disappears is worse than a beat of the real thing.
  if (onboarding && !onboarding.required_done) {
    return <OnboardingBillingScreen />;
  }

  return (
    <section className="flex h-screen  overflow-hidden">
      <SideBar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 pb-20 md:pb-6">
          <DashboardHeaderLayout />
          {onboarding?.billing_skipped && location.pathname !== "/PaymentMethod" && <BillingSkippedBanner />}
          {children}
        </div>
      </div>

      <BottomTab />
      <ProductTour variant="main" />
    </section>
  );
};
