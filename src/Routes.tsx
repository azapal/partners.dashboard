import Dashboard from "./views/DashboardScreen.js";
import { LoginScreen } from "./views/LoginScreen.js";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import PageNotFound from "./views/PageNotFound.js";
import { Settings } from "./views/Settings";
import { useState } from "react";
import { useAppStore } from "./hooks/useAppStore";
import { sheetActions } from "./store/client/sheets";
import { SignInScreen } from "./views/SignInScreen";
import OtpScreen from "./views/OtpScreen";
import { SelectWorkspaceScreen } from "./views/SelectWorkspaceScreen";
import Success from "./views/Success";
import { CustomerScreen } from "./views/CustomerScreen";
import { BranchScreen } from "./views/BranchScreen";
import { DefaultResizableSheet } from "./components/sheets/DefaultResizableSheet";
import { IntegrationScreen } from "./views/IntegrationScreen";
import { PartnerOnboardingScreen } from "./views/PartnerOnboardingScreen";
import LogoutView from "./views/LogoutScreen";
import PaymentMethodForm from "./views/PaymentMethod";
import {ServiceScreen} from "./views/ServiceScreen";
import MonthlyPerformanceScreen from "./views/MonthlyPerformanceScreen";
import {TransactionsScreen} from "./views/TransactionsScreen";
import {ActivityLogScreen} from "./views/ActivityLogScreen";
import {LogisticsNetworkScreen} from "./views/LogisticsNetworkScreen";
import { MarketplaceScreen, JobBriefsScreen, InboxScreen, PairingRoutesScreen } from "./views/NetworkScreens";
import {RatesScreen} from "./views/RatesScreen";
import {FinancialsScreen} from "./views/FinancialsScreen";
import {StakeholdersScreen} from "./views/StakeholdersScreen";

import ContactPage from "./views/ContactPage.jsx";
import HelpCenter from "./views/HelpCenter.jsx";
import HelpCenterLayout from "./components/helpCenter/HelpCenterLayout.jsx";
import UserManagementScreen from "./views/UserManagementScreen";

import { RepLoginScreen } from "./views/support/RepLoginScreen";
import RepOtpScreen from "./views/support/RepOtpScreen";
import { BranchLoginScreen } from "./views/support/BranchLoginScreen";
import BranchOtpScreen from "./views/support/BranchOtpScreen";
import RepDashboardScreen from "./views/support/RepDashboardScreen";
import OrdersScreen from "./views/support/OrdersScreen";
import TeamOverviewScreen from "./views/support/TeamOverviewScreen";
import RepProfileScreen from "./views/support/RepProfileScreen";
import ShiftMateScreen from "./views/support/ShiftMateScreen";
import { RepQuoteRequestsScreen } from "./views/support/RepQuoteRequestsScreen";
import { RepQuotePageScreen } from "./views/support/RepQuotePageScreen";
import { RepRequireAuth } from "./components/support/RepRequireAuth";
import { RequireAuth } from "./components/RequireAuth";
import { BillsScreen } from "./views/BillsScreen";
import { FleetListingScreen } from "./views/FleetListingScreen";
import { CustodyScreen } from "./views/CustodyScreen";
import { MobilityScreen } from "./views/MobilityScreen";
import { ChargeableWeightScreen } from "./views/ChargeableWeightScreen";
import { QuotePageScreen } from "./views/QuotePageScreen";
import { PublicQuoteScreen } from "./views/PublicQuoteScreen";
import { OnboardingBillingScreen } from "./views/OnboardingBillingScreen";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginScreen />} />
      <Route path="/customers" element={<RequireAuth><CustomerScreen /></RequireAuth>} />
      <Route path="/branches" element={<RequireAuth><BranchScreen /></RequireAuth>} />
      <Route path="/bills" element={<RequireAuth><BillsScreen /></RequireAuth>} />
      <Route path="/fleet-listing" element={<RequireAuth><FleetListingScreen /></RequireAuth>} />
      <Route path="/custody" element={<RequireAuth><CustodyScreen /></RequireAuth>} />
      <Route path="/mobility" element={<RequireAuth><MobilityScreen /></RequireAuth>} />
      <Route path="/chargeable-weight" element={<RequireAuth><ChargeableWeightScreen /></RequireAuth>} />
      <Route path="/quote-page" element={<RequireAuth><QuotePageScreen /></RequireAuth>} />
      {/* Public: a partner's customers, no login. */}
      <Route path="/quote/:slug" element={<PublicQuoteScreen />} />
      <Route path="/login/otp" element={<OtpScreen />} />
      <Route path="/select-workspace" element={<RequireAuth><SelectWorkspaceScreen /></RequireAuth>} />
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/dashboard/performance" element={<RequireAuth><MonthlyPerformanceScreen /></RequireAuth>} />
      <Route path="/transactions" element={<RequireAuth><TransactionsScreen /></RequireAuth>} />
      <Route path="/activity-log" element={<RequireAuth><ActivityLogScreen /></RequireAuth>} />
      <Route path="/service" element={<RequireAuth><ServiceScreen /></RequireAuth>} />
      <Route path="/rates" element={<RequireAuth><RatesScreen /></RequireAuth>} />
      {/* The Logistics network. Marketplace, briefs and routes are public pages
          (NetworkShell picks the dashboard or the public frame by session);
          the inbox is signed-in only. /logistics-network is the old tabbed
          page and only redirects. */}
      <Route path="/marketplace/:partnerCode?" element={<MarketplaceScreen />} />
      <Route path="/job-briefs/:briefId?" element={<JobBriefsScreen />} />
      <Route path="/pairing-routes" element={<PairingRoutesScreen />} />
      <Route path="/inbox" element={<RequireAuth><InboxScreen /></RequireAuth>} />
      <Route path="/logistics-network" element={<LogisticsNetworkScreen />} />
      <Route path="/financials" element={<RequireAuth><FinancialsScreen /></RequireAuth>} />
      <Route path="/stakeholders" element={<RequireAuth><StakeholdersScreen /></RequireAuth>} />
      <Route
        path="/partners/onboarding"
        element={
          <RequireAuth>
            <PartnerOnboardingScreen />
          </RequireAuth>
        }
      />
      {/* Where Paystack returns after a card is authorised during signup, and
          the same screen the shell shows until billing is set up. */}
      <Route path="/onboarding/billing" element={<RequireAuth><OnboardingBillingScreen /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
      <Route path="/PaymentMethod" element={<RequireAuth><PaymentMethodForm /></RequireAuth>} />
      <Route path="/integration" element={<RequireAuth><IntegrationScreen /></RequireAuth>} />
      <Route path="/LogoutScreen" element={<LogoutView />} />
      <Route path="*" element={<PageNotFound />} />
      <Route path="/contact" element= {<ContactPage/>}/>
      <Route path="/helpCenter" element= {<HelpCenter/>}/>
      <Route path="/users" element={<RequireAuth><UserManagementScreen /></RequireAuth>} />

      <Route path="/support/login" element={<RepLoginScreen />} />
      <Route path="/support/login/otp" element={<RepOtpScreen />} />
      <Route path="/support/branch-login" element={<BranchLoginScreen />} />
      <Route path="/support/branch-login/otp" element={<BranchOtpScreen />} />
      <Route
        path="/support/dashboard"
        element={
          <RepRequireAuth>
            <RepDashboardScreen />
          </RepRequireAuth>
        }
      />
      <Route
        path="/support/orders"
        element={
          <RepRequireAuth>
            <OrdersScreen />
          </RepRequireAuth>
        }
      />
      <Route
        path="/support/team"
        element={
          <RepRequireAuth>
            <TeamOverviewScreen />
          </RepRequireAuth>
        }
      />
      {/* A branch's own quote page, for the manager who runs it. */}
      <Route
        path="/support/quote-page"
        element={<RepRequireAuth><RepQuotePageScreen /></RepRequireAuth>}
      />
      {/* Leads, for the managers and support staff who chase them. */}
      <Route
        path="/support/quote-requests"
        element={<RepRequireAuth><RepQuoteRequestsScreen /></RepRequireAuth>}
      />
      <Route
        path="/support/profile"
        element={
          <RepRequireAuth>
            <RepProfileScreen />
          </RepRequireAuth>
        }
      />
      <Route
        path="/support/shift-mates"
        element={
          <RepRequireAuth>
            <ShiftMateScreen />
          </RepRequireAuth>
        }
      />
    </Routes>
  );
};
