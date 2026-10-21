import { useMemo, useRef, useState } from "react";
import { useCanUseMarketplace, useMarketplaceCategories, useStartConversation, useStorefront } from "../../hooks/useMarketplace";
import { SignInLink } from "./SignInLink";
import type { MarketplaceListing, Storefront } from "../../service/partnerService";
import { Composer } from "./Composer";
import { StorefrontMap, storefrontPoints } from "./StorefrontMap";
import { CategoryChip, FullScreenModal, LoadError, PartnerLogo, VerifiedBadge, placeOf, whatsappUrl } from "./shared";

/**
 * A partner's storefront: who they are, how to reach them, where every branch
 * is, and what they offer. Your own opens here too, as a preview (`is_self`),
 * with editing instead of messaging.
 */
export const PartnerStorefrontModal = ({
  partnerCode,
  initialListingId,
  onClose,
  onOpenThread,
  onEditStorefront,
}: {
  partnerCode: string;
  /** Opens with the composer ready to ask about this listing. */
  initialListingId?: number | null;
  onClose: () => void;
  onOpenThread: (conversationId: number) => void;
  onEditStorefront?: () => void;
}) => {
  const { data: store, isLoading, error, refetch } = useStorefront(partnerCode);
  const [composing, setComposing] = useState(initialListingId != null);
  const [listingId, setListingId] = useState<number | null>(initialListingId ?? null);
  const contactRef = useRef<HTMLDivElement>(null);

  const startMessage = (aboutListing: number | null) => {
    setListingId(aboutListing);
    setComposing(true);
    // On a phone the contact card may be off screen; bring it in.
    requestAnimationFrame(() => contactRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const signedIn = useCanUseMarketplace();
  const [copied, setCopied] = useState(false);
  const copyLink = () => {
    const url = `${window.location.origin}/marketplace/${encodeURIComponent(partnerCode)}`;
    navigator.clipboard?.writeText(url).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 2000); },
      () => window.prompt("Copy this link", url),
    );
  };

  const notListed = error instanceof Error && /not in the marketplace|404/i.test(error.message);

  return (
    <FullScreenModal
      labelId="storefront-title"
      onClose={onClose}
      title={store?.partner_name ?? (isLoading ? "Loading storefront…" : "Storefront")}
      subtitle={store ? (store.is_self ? "Your storefront — as other partners see it" : placeOf(store) || "Logistics partner") : undefined}
      leading={store ? <PartnerLogo partner={store} size="sm" /> : undefined}
      actions={
        store && (store.is_listed || !store.is_self) ? (
          // Storefronts are public pages; this is the link to share one.
          <button onClick={copyLink} className="hidden h-10 items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:flex">
            <i className={copied ? "ri-check-line text-emerald-600" : "ri-link"} /> {copied ? "Link copied" : "Copy link"}
          </button>
        ) : undefined
      }
      footer={
        store ? (
          <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-3">
            <button onClick={onClose} className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200">
              Close
            </button>
            {store.is_self ? (
              onEditStorefront && (
                <button onClick={onEditStorefront} className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover">
                  <i className="ri-edit-line" /> Edit storefront
                </button>
              )
            ) : signedIn ? (
              <button onClick={() => startMessage(listingId)} className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover">
                <i className="ri-chat-3-line" /> Message
              </button>
            ) : (
              <SignInLink className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover">
                <i className="ri-login-box-line" /> Sign in to message
              </SignInLink>
            )}
          </div>
        ) : undefined
      }
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-8 sm:py-8">
        {isLoading ? (
          <StorefrontSkeleton />
        ) : notListed ? (
          <div className="mx-auto mt-10 flex max-w-sm flex-col items-center text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
              <i className="ri-store-2-line text-xl" />
            </span>
            <p className="text-sm font-semibold text-gray-800">This partner isn't in the marketplace</p>
            <p className="mt-1 text-xs leading-5 text-gray-500">They've hidden their storefront. Any conversation you already have with them stays in your inbox.</p>
          </div>
        ) : error || !store ? (
          <LoadError what="this storefront" error={error} onRetry={() => refetch()} />
        ) : (
          <StorefrontBody
            store={store}
            composing={composing}
            listingId={listingId}
            setListingId={setListingId}
            onCompose={startMessage}
            onCancelCompose={() => setComposing(false)}
            onOpenThread={onOpenThread}
            contactRef={contactRef}
          />
        )}
      </div>
    </FullScreenModal>
  );
};

function StorefrontBody({
  store,
  composing,
  listingId,
  setListingId,
  onCompose,
  onCancelCompose,
  onOpenThread,
  contactRef,
}: {
  store: Storefront;
  composing: boolean;
  listingId: number | null;
  setListingId: (id: number | null) => void;
  onCompose: (listingId: number | null) => void;
  onCancelCompose: () => void;
  onOpenThread: (conversationId: number) => void;
  contactRef: React.RefObject<HTMLDivElement | null>;
}) {
  const signedIn = useCanUseMarketplace();
  const { data: categories = [] } = useMarketplaceCategories();
  const iconOf = useMemo(() => new Map(categories.map((c) => [c.key, c.icon])), [categories]);
  const { pinned, unpinned } = useMemo(() => storefrontPoints(store), [store]);
  const [focus, setFocus] = useState<string | null>(null);
  const focusCount = useRef(0);

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; key: string; items: MarketplaceListing[] }>();
    for (const l of store.listings) {
      const g = map.get(l.category) ?? { name: l.category_name, key: l.category, items: [] };
      g.items.push(l);
      map.set(l.category, g);
    }
    return [...map.values()];
  }, [store.listings]);

  const location = placeOf(store);

  return (
    <div className="flex flex-col gap-5">
      {store.is_self && (
        <div className={`flex items-start gap-3 rounded-2xl px-4 py-3 ${store.is_listed ? "bg-emerald-50" : "bg-amber-50"}`}>
          <i className={`mt-0.5 text-lg ${store.is_listed ? "ri-eye-line text-emerald-700" : "ri-eye-off-line text-amber-700"}`} />
          <p className={`text-xs leading-5 ${store.is_listed ? "text-emerald-900" : "text-amber-900"}`}>
            {store.is_listed
              ? "This is a preview of your storefront. It's listed — partners can find it and message you."
              : "This is a preview. Your storefront isn't listed yet, so no other partner can see this page or message you from the marketplace."}
          </p>
        </div>
      )}

      {/* Identity */}
      <section className="overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="h-16 bg-gradient-to-r from-brand-navy via-[#1b2b55] to-brand sm:h-20" />
        <div className="-mt-8 flex flex-col gap-4 px-4 pb-5 sm:-mt-10 sm:flex-row sm:items-end sm:px-6">
          <div className="rounded-2xl bg-white p-1 shadow-card w-fit">
            <PartnerLogo partner={store} size="lg" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">{store.partner_name}</h3>
              {store.is_verified && <VerifiedBadge />}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              {location && <span className="flex items-center gap-1"><i className="ri-map-pin-2-line" />{location}</span>}
              <span className="flex items-center gap-1"><i className="ri-git-branch-line" />{store.branches.length} branch{store.branches.length === 1 ? "" : "es"}</span>
              <span className="flex items-center gap-1"><i className="ri-price-tag-3-line" />{store.listings.length} listing{store.listings.length === 1 ? "" : "s"}</span>
            </p>
          </div>
        </div>
        {(store.headline || grouped.length > 0) && (
          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:px-6">
            {store.headline && <p className="text-sm font-medium leading-6 text-gray-800">{store.headline}</p>}
            {grouped.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {grouped.map((g) => <CategoryChip key={g.key} icon={iconOf.get(g.key)} name={g.name} tone="brand" />)}
              </div>
            )}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Contact — first on a phone, a sticky side card on desktop */}
        <aside className="order-first lg:order-none lg:col-start-2 lg:row-start-1">
          <div ref={contactRef} className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-card sm:p-5 lg:sticky lg:top-0">
            <h4 className="text-sm font-semibold text-gray-900">Get in touch</h4>
            {!store.is_self && !signedIn && (
              <div className="flex flex-col gap-2">
                <SignInLink className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover">
                  <i className="ri-login-box-line text-base" /> Sign in to message
                </SignInLink>
                <p className="text-center text-[11px] leading-4 text-gray-400">Partners on Azapal message each other in-app. Or reach them directly:</p>
              </div>
            )}
            {!store.is_self && signedIn && (
              composing ? (
                <ComposeToPartner store={store} listingId={listingId} setListingId={setListingId} onCancel={onCancelCompose} onOpenThread={onOpenThread} />
              ) : (
                <div className="flex flex-col gap-2">
                  <button onClick={() => onCompose(null)} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover">
                    <i className="ri-chat-3-line text-base" /> Message {store.partner_name.split(" ")[0]}
                  </button>
                  {store.conversation_id && (
                    <button onClick={() => onOpenThread(store.conversation_id as number)} className="flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-brand hover:bg-orange-50">
                      <i className="ri-history-line" /> Open your conversation
                    </button>
                  )}
                </div>
              )
            )}
            <ContactLinks store={store} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-5 lg:col-start-1 lg:row-start-1">
          {/* Locations */}
          <section className="rounded-2xl bg-white p-4 shadow-card sm:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-gray-900">Where they operate</h4>
              <div className="flex items-center gap-3 text-[11px] text-gray-500">
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-brand-navy" /> Head office</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-brand" /> Branch</span>
              </div>
            </div>
            <StorefrontMap points={pinned} focusKey={focus} />
            {store.branches.length > 0 && (
              <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {store.branches.map((b) => {
                  const pin = pinned.some((p) => p.key === `b-${b.id}`);
                  return (
                    <li key={b.id}>
                      <button
                        type="button"
                        disabled={!pin}
                        onClick={() => setFocus(`b-${b.id}#${++focusCount.current}`)}
                        className="flex w-full items-start gap-2.5 rounded-xl border border-gray-100 px-3 py-2.5 text-left transition-colors enabled:hover:border-orange-200 enabled:hover:bg-orange-50/40"
                      >
                        <i className={`mt-0.5 text-base ${pin ? "ri-map-pin-2-fill text-brand" : "ri-map-pin-line text-gray-300"}`} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-900">{b.branch_code}</span>
                            {!pin && <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">no pin yet</span>}
                          </span>
                          {b.address && <span className="mt-0.5 block truncate text-[11px] text-gray-500" title={b.address}>{b.address}</span>}
                          {(b.lga || b.state) && <span className="block text-[11px] text-gray-400">{[b.lga, b.state].filter(Boolean).join(", ")}</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {unpinned.length > 0 && pinned.length > 0 && (
              <p className="mt-2 text-[11px] text-gray-400">{unpinned.length} branch{unpinned.length === 1 ? " has" : "es have"} no map pin yet.</p>
            )}
          </section>

          {store.about && (
            <section className="rounded-2xl bg-white p-4 shadow-card sm:p-6">
              <h4 className="mb-2 text-sm font-semibold text-gray-900">About</h4>
              <p className="whitespace-pre-line text-sm leading-6 text-gray-600">{store.about}</p>
            </section>
          )}

          {/* Listings */}
          <section className="rounded-2xl bg-white p-4 shadow-card sm:p-6">
            <h4 className="mb-1 text-sm font-semibold text-gray-900">What they offer</h4>
            {grouped.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">{store.is_self ? "You haven't published any listings yet." : "No listings yet — message them to ask what they can do."}</p>
            ) : (
              <div className="flex flex-col gap-5 pt-2">
                {grouped.map((g) => (
                  <div key={g.key}>
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      <i className={`${iconOf.get(g.key) ?? "ri-price-tag-3-line"} text-sm text-brand`} />
                      {g.name}
                    </p>
                    <div className="flex flex-col gap-2">
                      {g.items.map((l) => (
                        <article key={l.id} className="rounded-xl border border-gray-100 p-3.5">
                          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                            <p className="text-sm font-semibold text-gray-900">{l.title}</p>
                            {l.price_note && (
                              <span className="w-fit shrink-0 rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{l.price_note}</span>
                            )}
                          </div>
                          {l.description && <p className="mt-1.5 whitespace-pre-line text-xs leading-5 text-gray-600">{l.description}</p>}
                          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex min-w-0 flex-wrap gap-1">
                              {l.coverage.length === 0 ? (
                                <span className="text-[11px] text-gray-400">Coverage not stated</span>
                              ) : (
                                l.coverage.map((s) => <CategoryChip key={s} icon="ri-map-pin-line" name={s} />)
                              )}
                            </div>
                            {!store.is_self && !signedIn && (
                              <SignInLink className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover">
                                <i className="ri-login-box-line" /> Sign in to ask
                              </SignInLink>
                            )}
                            {!store.is_self && signedIn && (
                              <button onClick={() => onCompose(l.id)} className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover">
                                <i className="ri-question-answer-line" /> Ask about this
                              </button>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ContactLinks({ store }: { store: Storefront }) {
  const { email, phone, whatsapp } = store.contact;
  const rows = [
    email && { href: `mailto:${email}`, icon: "ri-mail-line", label: "Email", value: email, external: false },
    phone && { href: `tel:${phone.replace(/\s/g, "")}`, icon: "ri-phone-line", label: "Call", value: phone, external: false },
    whatsapp && { href: whatsappUrl(whatsapp), icon: "ri-whatsapp-line", label: "WhatsApp", value: whatsapp, external: true },
  ].filter(Boolean) as { href: string; icon: string; label: string; value: string; external: boolean }[];

  if (rows.length === 0) return <p className="text-xs text-gray-400">No other contact details shared.</p>;

  return (
    <div className="flex flex-col divide-y divide-gray-50 rounded-xl border border-gray-100">
      {rows.map((r) => (
        <a
          key={r.label}
          href={r.href}
          {...(r.external ? { target: "_blank", rel: "noreferrer" } : {})}
          className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-gray-50"
        >
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${r.label === "WhatsApp" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600"}`}>
            <i className={`${r.icon} text-base`} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium text-gray-400">{r.label}</span>
            <span className="block truncate text-sm font-medium text-gray-800">{r.value}</span>
          </span>
          <i className={`${r.external ? "ri-external-link-line" : "ri-arrow-right-up-line"} text-gray-300`} />
        </a>
      ))}
    </div>
  );
}

function ComposeToPartner({
  store,
  listingId,
  setListingId,
  onCancel,
  onOpenThread,
}: {
  store: Storefront;
  listingId: number | null;
  setListingId: (id: number | null) => void;
  onCancel: () => void;
  onOpenThread: (conversationId: number) => void;
}) {
  const [body, setBody] = useState("");
  const start = useStartConversation();

  const send = () =>
    start.mutate(
      { partner_code: store.partner_code, body: body.trim(), ...(listingId ? { listing_id: listingId } : {}) },
      { onSuccess: (c) => onOpenThread(c.id) },
    );

  return (
    <div className="flex flex-col gap-3">
      {store.listings.length > 0 && (
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-gray-500">About</span>
          <select
            value={listingId ?? ""}
            onChange={(e) => setListingId(e.target.value ? Number(e.target.value) : null)}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <option value="">A general enquiry</option>
            {store.listings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </label>
      )}
      <Composer
        value={body}
        onChange={setBody}
        onSend={send}
        sending={start.isPending}
        autoFocus
        minRows={3}
        placeholder={`Hi ${store.partner_name}, we're looking for…`}
      />
      <button onClick={onCancel} className="self-start text-xs font-semibold text-gray-500 hover:text-gray-800">Cancel</button>
    </div>
  );
}

function StorefrontSkeleton() {
  return (
    <div className="flex flex-col gap-5" role="status" aria-label="Loading storefront">
      <div className="h-40 animate-pulse rounded-2xl bg-white shadow-card" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-96 animate-pulse rounded-2xl bg-white shadow-card" />
        <div className="h-56 animate-pulse rounded-2xl bg-white shadow-card" />
      </div>
    </div>
  );
}
