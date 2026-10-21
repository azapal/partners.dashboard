import { useState } from "react";
import { useMarketplaceCategories, useMarketplacePartners, useMyListings, useMyMarketplaceProfile } from "../../hooks/useMarketplace";
import type { DirectoryPartner, MarketplaceCategory } from "../../service/partnerService";
import { CategoryNav, FilterBar } from "./CategoryNav";
import { useNetwork } from "./NetworkShell";
import { SignInLink } from "./SignInLink";
import { CategoryChip, LoadError, PartnerLogo, VerifiedBadge, placeOf, useDebounced } from "./shared";

/**
 * Browse listed partners by category, place and text, and keep an eye on your
 * own storefront. Clicking a card opens the storefront (owned by NetworkShell,
 * at /marketplace/:partnerCode). Public: a signed-out visitor sees the same
 * directory, with a sign-in invitation in place of the storefront card.
 */
export const MarketplaceTab = () => {
  const { signedIn, openPartner: onOpenPartner, editStorefront: onEditStorefront, previewOwnStorefront: onPreviewStorefront } = useNetwork();
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [verified, setVerified] = useState(false);
  const q = useDebounced(query);

  const { data: categories = [], isLoading: catLoading } = useMarketplaceCategories();
  const { data: partners = [], isLoading, isFetching, error, refetch } = useMarketplacePartners({ category, state, q, verified });

  const filtered = !!(category || state || q.trim() || verified);
  const current = categories.find((c) => c.key === category);
  const clear = () => { setCategory(""); setQuery(""); setState(""); setVerified(false); };

  return (
    <div className="flex flex-col gap-5">
      {signedIn ? <YourStorefrontCard onEdit={onEditStorefront} onPreview={onPreviewStorefront} /> : <ListYourBusinessCard />}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <CategoryNav
            categories={categories}
            loading={catLoading}
            selected={category}
            onSelect={setCategory}
            countOf={(c: MarketplaceCategory) => c.listing_count ?? 0}
            allLabel="All categories"
            noun="listing"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <FilterBar query={query} onQuery={setQuery} placeholder="Search partners, services, cities…" state={state} onState={setState}>
            <button
              type="button"
              role="switch"
              aria-checked={verified}
              onClick={() => setVerified((v) => !v)}
              className={`flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold shadow-card transition-colors ${
                verified ? "bg-sky-600 text-white" : "bg-white text-gray-600 hover:text-gray-900"
              }`}
            >
              <i className={verified ? "ri-verified-badge-fill" : "ri-verified-badge-line"} />
              Verified<span className="hidden sm:inline"> only</span>
            </button>
          </FilterBar>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-500">
              {isLoading ? "Finding partners…" : (
                <>
                  <span className="font-semibold text-gray-800">{partners.length}</span> partner{partners.length === 1 ? "" : "s"}
                  {current ? <> in <span className="font-semibold text-gray-800">{current.name}</span></> : null}
                  {state ? <> covering <span className="font-semibold text-gray-800">{state}</span></> : null}
                  {isFetching && <i className="ri-loader-4-line ml-1.5 animate-spin text-gray-400" />}
                </>
              )}
            </p>
            {filtered && (
              <button onClick={clear} className="text-xs font-semibold text-brand hover:text-brand-hover">Clear filters</button>
            )}
          </div>

          {current?.description && (
            <p className="-mt-2 text-xs leading-5 text-gray-500">{current.description}</p>
          )}

          {error ? (
            <LoadError what="the marketplace" error={error} onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-white shadow-card" />)}
            </div>
          ) : partners.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center shadow-card">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-brand">
                <i className={`${filtered ? "ri-search-eye-line" : "ri-store-3-line"} text-2xl`} />
              </span>
              <p className="text-sm font-semibold text-gray-800">
                {filtered ? "No partners match that yet" : "The marketplace is just opening"}
              </p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-gray-500">
                {filtered
                  ? "Try another category or state, or post a job brief so partners who can do it come to you."
                  : signedIn
                    ? "No other partner has listed a storefront yet. List yours so you're the first one they find — or post a brief for work you need done."
                    : "No partner has listed a storefront yet. Run a logistics business? Sign in and be the first one people find."}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {filtered ? (
                  <button onClick={clear} className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200">Clear filters</button>
                ) : signedIn ? (
                  <button onClick={onEditStorefront} className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-hover">Set up your storefront</button>
                ) : (
                  <SignInLink className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-hover">Sign in to list your business</SignInLink>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {partners.map((p) => <PartnerCard key={p.partner_code} partner={p} onOpen={() => onOpenPartner(p.partner_code)} highlight={category} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function PartnerCard({ partner, onOpen, highlight }: { partner: DirectoryPartner; onOpen: () => void; highlight: string }) {
  const place = placeOf(partner);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-w-0 flex-col rounded-2xl bg-white p-4 text-left shadow-card ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-orange-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:p-5"
    >
      <div className="flex items-start gap-3">
        <PartnerLogo partner={partner} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-bold text-gray-900">{partner.partner_name}</p>
            {partner.is_verified && <VerifiedBadge compact />}
          </div>
          {place && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500"><i className="ri-map-pin-2-line" />{place}</p>
          )}
        </div>
      </div>

      {partner.headline ? (
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-gray-600">{partner.headline}</p>
      ) : (
        <p className="mt-3 text-xs italic text-gray-400">No headline yet</p>
      )}

      {partner.categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {partner.categories.slice(0, 3).map((c) => (
            <CategoryChip key={c.key} icon={c.icon} name={c.name} tone={c.key === highlight ? "brand" : "gray"} />
          ))}
          {partner.categories.length > 3 && <CategoryChip name={`+${partner.categories.length - 3}`} />}
        </div>
      )}

      {partner.top_listings.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-gray-50 rounded-xl bg-gray-50/70 px-3">
          {partner.top_listings.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-2 py-2">
              <span className="min-w-0 truncate text-xs font-medium text-gray-700">{l.title}</span>
              {l.price_note && <span className="shrink-0 text-[11px] font-semibold text-emerald-700">{l.price_note}</span>}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-[11px] text-gray-500">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><i className="ri-git-branch-line" />{partner.branch_count} branch{partner.branch_count === 1 ? "" : "es"}</span>
          <span className="flex items-center gap-1"><i className="ri-price-tag-3-line" />{partner.listing_count} listing{partner.listing_count === 1 ? "" : "s"}</span>
        </span>
        <span className="flex items-center gap-0.5 font-semibold text-brand opacity-80 transition-opacity group-hover:opacity-100">
          View<i className="ri-arrow-right-line transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}

/** Your own status in the marketplace, with a nudge when you aren't in it. */
function YourStorefrontCard({ onEdit, onPreview }: { onEdit: () => void; onPreview: () => void }) {
  const { data: profile, isLoading } = useMyMarketplaceProfile();
  const { data: listings = [] } = useMyListings();
  const active = listings.filter((l) => l.is_active).length;

  if (isLoading || !profile) {
    return <div className="h-[88px] animate-pulse rounded-2xl bg-white shadow-card" />;
  }

  const listed = profile.is_listed;
  return (
    <section
      className={`flex flex-col gap-4 overflow-hidden rounded-2xl p-4 shadow-card sm:flex-row sm:items-center sm:p-5 ${
        listed ? "bg-white" : "bg-gradient-to-r from-brand-navy to-[#1f3266] text-white"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${listed ? "bg-emerald-50 text-emerald-600" : "bg-white/10 text-white"}`}>
          <i className="ri-store-2-line text-xl" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm font-bold ${listed ? "text-gray-900" : "text-white"}`}>Your storefront</p>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${listed ? "bg-emerald-50 text-emerald-700" : "bg-amber-400/20 text-amber-200"}`}>
              {listed ? "Listed" : "Not listed"}
            </span>
          </div>
          <p className={`mt-0.5 text-xs leading-5 ${listed ? "text-gray-500" : "text-white/70"}`}>
            {listed
              ? `${active} active listing${active === 1 ? "" : "s"}${profile.headline ? ` · ${profile.headline}` : ""}`
              : "Partners can't find or message you yet. Add what you offer and list your storefront to get work from the network."}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={onPreview}
          className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors sm:flex-none ${
            listed ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          <i className="ri-eye-line" /> Preview
        </button>
        <button onClick={onEdit} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover sm:flex-none">
          <i className={listed ? "ri-edit-line" : "ri-rocket-2-line"} />
          {listed ? "Edit storefront" : profile.exists || listings.length ? "Finish setup" : "Set up storefront"}
        </button>
      </div>
    </section>
  );
}

/** For a signed-out visitor, in place of "Your storefront". */
function ListYourBusinessCard() {
  return (
    <section className="flex flex-col gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-navy to-[#1f3266] p-4 text-white shadow-card sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <i className="ri-community-line text-xl" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold">Logistics partners across Nigeria, in one place</p>
          <p className="mt-0.5 text-xs leading-5 text-white/70">
            Browse by what they do and where — every branch on a map, and how to reach them. Run a logistics business? Sign in to list yours, message partners and answer job briefs.
          </p>
        </div>
      </div>
      <SignInLink className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover">
        <i className="ri-login-box-line" /> Sign in to list yours
      </SignInLink>
    </section>
  );
}
