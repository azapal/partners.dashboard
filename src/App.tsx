
import type { ReactNode } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import {useAppStore} from "./hooks/useAppStore";
import {sheetActions} from "./store/client/sheets";
import {DefaultResizableSheet} from "./components/sheets/DefaultResizableSheet";
import {AzapalAssistant} from "./components/assistant/AzapalAssistant";
import { AppRoutes } from "./Routes.js";

function App() {
  const {modal:{show}} =useAppStore(state => state);


  return (
    <BrowserRouter>
      <div className='flex'>
        <div className='flex-1 relative'>
          {show && (<div  className='bg-black/60 w-full h-screen z-50 absolute'></div>)}
          <AppRoutes/>
        </div>
        <DefaultResizableSheet />
        {/* Mounted once, above every other layer — see .azapal-dock in index.css. */}
        <PartnerOnly>
          <AzapalAssistant />
        </PartnerOnly>
      </div>
      </BrowserRouter>
  );
}

// The public quote page belongs to a partner's customer, who must never be able
// to summon Azapal's own assistant over it (it answers to Cmd/Ctrl-K anywhere).
const PartnerOnly = ({ children }: { children: ReactNode }) =>
  useLocation().pathname.startsWith("/quote/") ? null : <>{children}</>;



export default App;
