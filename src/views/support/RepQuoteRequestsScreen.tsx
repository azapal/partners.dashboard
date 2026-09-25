import { Navigate } from "react-router-dom";
import { RepDashboardLayout } from "../../layouts/RepDashboardLayout";
import { QuoteRequestsPanel } from "../../components/quote/QuoteRequestsPanel";
import { useRepProfile } from "../../hooks/useRepAuth";
import { canWorkQuoteLeads } from "../../service/repService";

/**
 * Quote-page leads for the people who actually chase them — managers and
 * customer support, who live in this shell rather than the main dashboard.
 *
 * The same panel the main dashboard shows, minus the link into the page's
 * settings: what a lead is worth and how the page is set up are different jobs,
 * and only elevated admins do the second (see can_work_quote_leads server-side,
 * which is what actually enforces this).
 */
export const RepQuoteRequestsScreen = () => {
  const profile = useRepProfile();

  if (profile && !canWorkQuoteLeads(profile.invite_role?.name)) {
    return <Navigate to="/support/dashboard" replace />;
  }

  return (
    <RepDashboardLayout>
      <div className="flex w-full flex-col gap-4 overflow-y-auto">
        <p className="text-sm text-gray-500">
          Customers who filled in your company's quote page and left their details.
        </p>
        <QuoteRequestsPanel />
      </div>
    </RepDashboardLayout>
  );
};
