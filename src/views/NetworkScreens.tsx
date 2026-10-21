import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { NetworkShell, useNetwork } from "../components/marketplace/NetworkShell";
import { MarketplaceTab } from "../components/marketplace/MarketplaceTab";
import { BriefsTab } from "../components/marketplace/BriefsTab";
import { InboxTab } from "../components/marketplace/InboxTab";
import { RouteBoard } from "../components/marketplace/RouteBoard";
import { useAssistantAction } from "../lib/assistant/registry";

/**
 * The Logistics network, one route per page (each its own side-menu item):
 *
 *   /marketplace[/:partnerCode]   public — partner directory; the code opens a storefront
 *   /job-briefs[/:briefId]        public — the briefs board; the id opens a brief
 *   /pairing-routes               public — every partner's upcoming routes
 *   /inbox[?c=]                   signed in only (RequireAuth in Routes.tsx)
 *
 * NetworkShell picks the dashboard or the public frame by session. The old
 * /logistics-network?tab= links redirect here (LogisticsNetworkScreen.tsx).
 */

export const MarketplaceScreen = () => {
  const { partnerCode } = useParams();
  return (
    <NetworkShell
      title="Marketplace"
      subtitle="Logistics partners on Azapal — what they offer, where every branch is, and how to reach them."
      partnerCode={partnerCode}
    >
      <MarketplaceTab />
    </NetworkShell>
  );
};

export const JobBriefsScreen = () => {
  const { briefId } = useParams();
  const navigate = useNavigate();
  const id = briefId ? Number(briefId) || null : null;
  return (
    <NetworkShell title="Job briefs" subtitle="Work partners need done — haulage, warehousing, last-mile and more. Answer one to win it.">
      <BriefsTab
        openId={id}
        onOpenBrief={(next) => navigate(`/job-briefs/${next}`)}
        onCloseBrief={() => navigate("/job-briefs")}
      />
    </NetworkShell>
  );
};

export const InboxScreen = () => (
  <NetworkShell title="Inbox">
    <InboxPage />
  </NetworkShell>
);

function InboxPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { openPartner } = useNetwork();
  const selectedId = params.get("c") ? Number(params.get("c")) || null : null;
  return (
    <InboxTab
      selectedId={selectedId}
      onSelect={(id) =>
        setParams((prev) => {
          const p = new URLSearchParams(prev);
          if (id != null) p.set("c", String(id));
          else p.delete("c");
          return p;
        })
      }
      onOpenPartner={openPartner}
      onBrowse={() => navigate("/marketplace")}
    />
  );
}

export const PairingRoutesScreen = () => {
  const [addRequest, setAddRequest] = useState<{ nonce: number; prefill: { origin_state?: string; destination_state?: string } } | null>(null);

  // The assistant's "add a route" lands here and opens the form with what it
  // could pick out of the sentence. Only signed-in users have the assistant.
  useAssistantAction("route.create", (p) => {
    setAddRequest({ nonce: Date.now(), prefill: { origin_state: p.origin_state, destination_state: p.destination_state } });
  });

  return (
    <NetworkShell title="Pairing routes" subtitle="Routes partners are already running. Heading the same way? Share the trip.">
      <RouteBoard addRequest={addRequest} onAddRequestHandled={() => setAddRequest(null)} />
    </NetworkShell>
  );
};
