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
import { DefaultResizableSheet } from "./components/sheets/DefaultResizableSheet";
import { IntegrationScreen } from "./views/IntegrationScreen";
import { PartnerOnboardingScreen } from "./views/PartnerOnboardingScreen";
import LogoutView from "./views/LogoutScreen";
import PaymentMethodForm from "./views/PaymentMethod";
import {ServiceScreen} from "./views/ServiceScreen";

import ContactPage from "./views/ContactPage.jsx";
import HelpCenter from "./views/HelpCenter.jsx";
import Authentication from "./views/Authentication.jsx";
import ChangePassword from "./views/ChangePassword.jsx";
import HelpCenterLayout from "./components/helpCenter/HelpCenterLayout.jsx";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginScreen />} />
      <Route path="/customers" element={<CustomerScreen />} />
      <Route path="/login/otp" element={<OtpScreen />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/service" element={<ServiceScreen />} />
      <Route
        path="/partners/onboarding"
        element={<PartnerOnboardingScreen />}
      />
      <Route path="/settings" element={<Settings />} />
      <Route path="/PaymentMethod" element={<PaymentMethodForm />} />
      <Route path="/integration" element={<IntegrationScreen />} />
      <Route path="/LogoutScreen" element={<LogoutView />} />
      <Route path="*" element={<PageNotFound />} />
      <Route path="/contact" element= {<ContactPage/>}/>
      <Route path="/helpCenter" element= {<HelpCenter/>}/>
      <Route path="/authentication" element= {<Authentication/>}/>
      <Route path="/changePassword" element= {<ChangePassword/>}/>
    </Routes>
  );
};
