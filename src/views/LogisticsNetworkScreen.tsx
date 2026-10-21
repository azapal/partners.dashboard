import { Navigate, useSearchParams } from "react-router-dom";

/**
 * /logistics-network used to be one page with tabs; each tab is now its own
 * route (see NetworkScreens.tsx). Old links, bookmarks and signposts land here
 * and are sent on, keeping the open conversation for the inbox.
 *
 * The old private "My routes & pairing" view (orders map, stats, pairable
 * orders) is no longer routed; components/logistics/RoutesAndPairing.tsx is
 * kept, unused, in case it comes back. `?tab=routes` goes to the public board.
 */
export const LogisticsNetworkScreen = () => {
  const [params] = useSearchParams();
  const tab = params.get("tab");
  const c = params.get("c");
  const to =
    tab === "briefs" ? "/job-briefs"
    : tab === "inbox" ? `/inbox${c ? `?c=${encodeURIComponent(c)}` : ""}`
    : tab === "routes" ? "/pairing-routes"
    : "/marketplace";
  return <Navigate to={to} replace />;
};
