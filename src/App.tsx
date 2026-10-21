
import type { ReactNode } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import {useAppStore} from "./hooks/useAppStore";
import {sheetActions} from "./store/client/sheets";
import {DefaultResizableSheet} from "./components/sheets/DefaultResizableSheet";
import {AzapalAssistant} from "./components/assistant/AzapalAssistant";
import { AppRoutes } from "./Routes.js";
import { FeedbackModal } from './components/FeedbackModal';
import { usePartnerProfile } from "./hooks/useAuth";
import { useRepProfile } from "./hooks/useRepAuth";
import { isElevatedAdminRole } from "./service/repService";

function App() {
  const {modal:{show}} =useAppStore(state => state);


  return (
    <BrowserRouter>
      <div className='flex'>
        {/* min-w-0: without it a wide child (the Mobility canvas, a table) stretches the page sideways on phones. */}
        <div className='flex-1 min-w-0 relative'>
          {show && (<div  className='bg-black/60 w-full h-screen z-50 absolute'></div>)}
          <AppRoutes/>
        </div>
        <DefaultResizableSheet />
        {/* Every action's success or failure, as a modal the user dismisses — see lib/queryClient.ts. */}
        <FeedbackModal />
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
//
// The public network pages (marketplace, job briefs, pairing routes) are open
// to anyone; a signed-out visitor there gets no assistant either — it is a
// partner's tool, and it would offer to act on pages they can't act on.
const PUBLIC_NETWORK = /^\/(marketplace|job-briefs|pairing-routes)(\/|$)/;
const PartnerOnly = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();
  const signedIn = !!partnerProfile || isElevatedAdminRole(repProfile?.invite_role?.name);
  if (pathname.startsWith("/quote/")) return null;
  if (PUBLIC_NETWORK.test(pathname) && !signedIn) return null;
  return <>{children}</>;
};



export default App;
