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

import ContactPage from "./views/ContactPage.jsx";
import HelpCenter from "./views/HelpCenter.jsx";
import Authentication from "./views/Authentication.jsx";
import ChangePassword from "./views/ChangePassword.jsx";
import HelpCenterLayout from "./components/helpCenter/HelpCenterLayout.jsx";
import UserManagementScreen from "./views/UserManagementScreen";

import { RepLoginScreen } from "./views/support/RepLoginScreen";
import RepOtpScreen from "./views/support/RepOtpScreen";
import { BranchLoginScreen } from "./views/support/BranchLoginScreen";
import BranchOtpScreen from "./views/support/BranchOtpScreen";
import RepDashboardScreen from "./views/support/RepDashboardScreen";
import RepProfileScreen from "./views/support/RepProfileScreen";
import ShiftMateScreen from "./views/support/ShiftMateScreen";
import { RepRequireAuth } from "./components/support/RepRequireAuth";
import { RequireAuth } from "./components/RequireAuth";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginScreen />} />
      <Route path="/customers" element={<RequireAuth><CustomerScreen /></RequireAuth>} />
      <Route path="/branches" element={<RequireAuth><BranchScreen /></RequireAuth>} />
      <Route path="/login/otp" element={<OtpScreen />} />
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/dashboard/performance" element={<RequireAuth><MonthlyPerformanceScreen /></RequireAuth>} />
      <Route path="/transactions" element={<RequireAuth><TransactionsScreen /></RequireAuth>} />
      <Route path="/activity-log" element={<RequireAuth><ActivityLogScreen /></RequireAuth>} />
      <Route path="/service" element={<RequireAuth><ServiceScreen /></RequireAuth>} />
      <Route
        path="/partners/onboarding"
        element={
          <RequireAuth>
            <PartnerOnboardingScreen />
          </RequireAuth>
        }
      />
      <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
      <Route path="/PaymentMethod" element={<RequireAuth><PaymentMethodForm /></RequireAuth>} />
      <Route path="/integration" element={<RequireAuth><IntegrationScreen /></RequireAuth>} />
      <Route path="/LogoutScreen" element={<LogoutView />} />
      <Route path="*" element={<PageNotFound />} />
      <Route path="/contact" element= {<ContactPage/>}/>
      <Route path="/helpCenter" element= {<HelpCenter/>}/>
      <Route path="/authentication" element= {<Authentication/>}/>
      <Route path="/changePassword" element= {<ChangePassword/>}/>
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
