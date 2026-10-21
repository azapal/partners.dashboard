import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { PublicNetworkLayout } from "../../layouts/PublicNetworkLayout";
import { useCanUseMarketplace } from "../../hooks/useMarketplace";
import { usePartnerProfile } from "../../hooks/useAuth";
import { useRepProfile } from "../../hooks/useRepAuth";
import { feedbackActions } from "../../store/client/feedback";
import { PartnerStorefrontModal } from "./PartnerStorefrontModal";
import { StorefrontEditorModal } from "./StorefrontEditorModal";

/**
 * The frame every Logistics network page sits in — Marketplace, Job briefs,
 * Inbox, Pairing routes.
 *
 * Signed in (a partner, or an elevated-admin rep: RequireAuth's rule), it is
 * the normal DashboardLayout. Signed out, it is PublicNetworkLayout, which
 * makes no partner-only call — those pages are public and their hooks read the
 * public endpoints for a visitor (see useMarketplace.ts).
 *
 * It also owns the storefront and storefront-editor modals, so any page can
 * open a partner's storefront: on /marketplace/:partnerCode it's the path (a
 * shareable link), elsewhere a `?partner=` param over the current page.
 */

interface NetworkNav {
  signedIn: boolean;
  openPartner: (partnerCode: string) => void;
  openThread: (conversationId: number) => void;
  editStorefront: () => void;
  previewOwnStorefront: () => void;
}

const NetworkContext = createContext<NetworkNav | null>(null);

export const useNetwork = (): NetworkNav => {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be used inside <NetworkShell>");
  return ctx;
};

export const NetworkShell = ({
  title,
  subtitle,
  partnerCode: pathPartner,
  children,
}: {
  title: string;
  subtitle?: string;
  /** From /marketplace/:partnerCode. */
  partnerCode?: string;
  children: ReactNode;
}) => {
  const signedIn = useCanUseMarketplace();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params, setParams] = useSearchParams();
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();
  const ownCode = partnerProfile?.partner_code ?? repProfile?.inviting_partner?.partner_code ?? null;
  const [editing, setEditing] = useState(false);

  const openCode = pathPartner || params.get("partner") || null;
  const onMarketplace = pathname === "/marketplace" || pathname.startsWith("/marketplace/");

  const openPartner = useCallback(
    (code: string) => {
      if (onMarketplace) navigate(`/marketplace/${encodeURIComponent(code)}`);
      else setParams((prev) => { const p = new URLSearchParams(prev); p.set("partner", code); return p; });
    },
    [onMarketplace, navigate, setParams],
  );

  const closePartner = useCallback(() => {
    if (pathPartner) navigate("/marketplace");
    else setParams((prev) => { const p = new URLSearchParams(prev); p.delete("partner"); return p; }, { replace: true });
  }, [pathPartner, navigate, setParams]);

  const nav = useMemo<NetworkNav>(
    () => ({
      signedIn,
      openPartner,
      openThread: (id) => navigate(`/inbox?c=${id}`),
      editStorefront: () => { if (signedIn) setEditing(true); },
      previewOwnStorefront: () => {
        if (!ownCode) {
          feedbackActions.error("Couldn't tell which partner account this is. Sign in again and retry.");
          return;
        }
        openPartner(ownCode);
      },
    }),
    [signedIn, openPartner, navigate, ownCode],
  );

  const body = (
    <NetworkContext.Provider value={nav}>
      {children}
      {editing && signedIn && <StorefrontEditorModal onClose={() => setEditing(false)} onPreview={nav.previewOwnStorefront} />}
      {openCode && (
        <PartnerStorefrontModal
          key={openCode}
          partnerCode={openCode}
          onClose={closePartner}
          onOpenThread={nav.openThread}
          onEditStorefront={() => { closePartner(); setEditing(true); }}
        />
      )}
    </NetworkContext.Provider>
  );

  return signedIn ? (
    <DashboardLayout>
      <div className="flex w-full min-w-0 flex-col gap-5">{body}</div>
    </DashboardLayout>
  ) : (
    <PublicNetworkLayout title={title} subtitle={subtitle}>{body}</PublicNetworkLayout>
  );
};
