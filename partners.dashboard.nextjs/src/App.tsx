import Dashboard from "./views/DashboardScreen.js";
import { LoginScreen } from "./views/LoginScreen.js";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import PageNotFound from "./views/PageNotFound.js";
import {Settings} from "./views/Settings";
import {useState} from "react";
import {useAppStore} from "./hooks/useAppStore";
import {sheetActions} from "./store/client/sheets";
import {SignInScreen} from "./views/SignInScreen";
import OtpScreen from "./views/OtpScreen";
import Success from "./views/Success";
import {CustomerScreen} from "./views/CustomerScreen";
import {DefaultResizableSheet} from "./components/sheets/DefaultResizableSheet";
import {IntegrationScreen} from "./views/IntegrationScreen";
function App() {
  const {modal:{show}} =useAppStore(state => state);


  return (
    <BrowserRouter>
      <div className='flex'>
        <div className='flex-1 relative'>
          {show && (<div  className='bg-black/60 w-full h-screen z-50 absolute'></div>)}
          <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/signup" element={<SignInScreen />} />
              <Route path="/signup/otp" element={<OtpScreen />} />
              <Route path="/signup/success" element={<Success />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/customers" element={<CustomerScreen />} />
              <Route path="/integration" element={<IntegrationScreen />} />
              <Route path="*" element={<PageNotFound />} />
          </Routes>
        </div>

        <DefaultResizableSheet />
      </div>
    </BrowserRouter>
  );
}



export default App;
