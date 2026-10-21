import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import {
  useCreateListing,
  useDeleteListing,
  useMarketplaceCategories,
  useMyListings,
  useMyMarketplaceProfile,
  useSaveMarketplaceProfile,
  useSetStorefrontListed,
  useUpdateListing,
} from "../../hooks/useMarketplace";
import type { MarketplaceListing, MarketplaceListingPayload, MarketplaceProfile } from "../../service/partnerService";
import { CategoryChip, Field, FullScreenModal, LoadError, STATE_OPTIONS, Toggle, inputClass, selectProps } from "./shared";

/**
 * "Your storefront": whether you're in the marketplace, what partners read
 * about you, how they reach you, and what you list. Listing on/off saves on
 * its own (so a refusal — no way to reach you — can't take the rest of the
 * form down with it); the details save from the footer; each listing saves
 * from its own card.
 */

type Details = Pick<MarketplaceProfile, "headline" | "about" | "contact_email" | "contact_phone" | "contact_whatsapp">;

const detailsOf = (p?: MarketplaceProfile): Details => ({
  headline: p?.headline ?? "",
  about: p?.about ?? "",
  contact_email: p?.contact_email ?? "",
  contact_phone: p?.contact_phone ?? "",
  contact_whatsapp: p?.contact_whatsapp ?? "",
});

export const StorefrontEditorModal = ({ onClose, onPreview }: { onClose: () => void; onPreview: () => void }) => {
  const { data: profile, isLoading, error, refetch } = useMyMarketplaceProfile();
  const save = useSaveMarketplaceProfile();
  const setListed = useSetStorefrontListed();

  const [details, setDetails] = useState<Details>(detailsOf());
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (profile && !seeded) {
      setDetails(detailsOf(profile));
      setSeeded(true);
    }
  }, [profile, seeded]);

  const saved = detailsOf(profile);
  const dirty = seeded && (Object.keys(details) as (keyof Details)[]).some((k) => details[k].trim() !== saved[k].trim());
  const set = (k: keyof Details) => (v: string) => setDetails((d) => ({ ...d, [k]: v }));

  const emailBad = !!details.contact_email.trim() && !/^\S+@\S+\.\S+$/.test(details.contact_email.trim());
  const noChannel = !details.contact_email.trim() && !details.contact_phone.trim() && !details.contact_whatsapp.trim();

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (emailBad) return;
    save.mutate(
      Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v.trim()])) as Details,
      { onSuccess: (p) => setDetails(detailsOf(p)) },
    );
  };

  return (
    <FullScreenModal
      labelId="storefront-editor-title"
      onClose={onClose}
      title="Your storefront"
      subtitle="How other partners find you in the marketplace, and what they can hire you for."
      actions={
        <button onClick={onPreview} className="hidden h-10 items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:flex">
          <i className="ri-eye-line" /> Preview
        </button>
      }
      footer={
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <button onClick={onPreview} className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 sm:hidden">
            <i className="ri-eye-line" /> Preview
          </button>
          <p className="hidden text-xs text-gray-400 sm:block">{dirty ? "You have unsaved changes to your details." : "Listings save on their own."}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200">
              Close
            </button>
            <button
              type="submit"
              form="storefront-details-form"
              disabled={!dirty || save.isPending || emailBad}
              className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
              {save.isPending && <i className="ri-loader-4-line animate-spin" />}
              Save details
            </button>
          </div>
        </div>
      }
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-5 sm:px-8 sm:py-8">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-white shadow-card" />
        ) : error || !profile ? (
          <LoadError what="your storefront" error={error} onRetry={() => refetch()} />
        ) : (
          <>
            {/* Listed */}
            <section className={`rounded-2xl p-4 shadow-card sm:p-5 ${profile.is_listed ? "bg-white" : "bg-white ring-2 ring-amber-200"}`}>
              <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${profile.is_listed ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                  <i className={`${profile.is_listed ? "ri-store-2-line" : "ri-eye-off-line"} text-lg`} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {profile.is_listed ? "Listed in the marketplace" : "Not listed yet"}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-gray-500">
                    {profile.is_listed
                      ? "Your storefront is a public web page: anyone can see it without signing in — your headline, branches on the map, listings and the contacts below. Partners on Azapal can also message you."
                      : "Listing publishes your storefront as a public web page. Anyone can see it without signing in, contacts included. Until then nobody can find or message you from the marketplace."}
                  </p>
                </div>
                <Toggle
                  checked={profile.is_listed}
                  disabled={setListed.isPending}
                  onChange={(v) => setListed.mutate(v)}
                  label="List my storefront"
                />
              </div>
              {!profile.is_listed && noChannel && (
                <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <i className="ri-information-line" /> Add an email, phone or WhatsApp number below first — partners need a way to reach you.
                </p>
              )}
            </section>

            {/* Details */}
            <form id="storefront-details-form" onSubmit={submit} className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-card sm:p-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">About your business</h3>
                <p className="mt-0.5 text-xs text-gray-500">The first thing partners read on your card and storefront.</p>
              </div>
              <Field label="Headline" counter={`${details.headline.length}/120`} hint="One line — what you do and where.">
                <input
                  value={details.headline}
                  maxLength={120}
                  onChange={(e) => set("headline")(e.target.value)}
                  placeholder="e.g. Same-day delivery across Lagos and Ogun, with cold-chain vans"
                  className={inputClass}
                />
              </Field>
              <Field label="About" counter={`${details.about.length}/2000`}>
                <textarea
                  value={details.about}
                  maxLength={2000}
                  rows={5}
                  onChange={(e) => set("about")(e.target.value)}
                  placeholder="Your fleet, the kinds of cargo you handle, how you work with partners…"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm leading-6 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </Field>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-900">How partners reach you</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  {profile.exists ? "Shown on your storefront — publicly, to anyone, once it's listed. Leave a channel empty to hide it." : "Filled from your account — change them if partners should use different ones. Once listed, these are public."}
                </p>
              </div>
              <Field label="Email" error={emailBad ? "That doesn't look like an email address." : null}>
                <div className="relative">
                  <i className="ri-mail-line pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={details.contact_email} onChange={(e) => set("contact_email")(e.target.value)} placeholder="partnerships@yourcompany.com" className={`${inputClass} pl-9`} />
                </div>
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Phone">
                  <div className="relative">
                    <i className="ri-phone-line pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="tel" value={details.contact_phone} onChange={(e) => set("contact_phone")(e.target.value)} placeholder="0803 000 0000" className={`${inputClass} pl-9`} />
                  </div>
                </Field>
                <Field label="WhatsApp">
                  <div className="relative">
                    <i className="ri-whatsapp-line pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="tel" value={details.contact_whatsapp} onChange={(e) => set("contact_whatsapp")(e.target.value)} placeholder="0803 000 0000" className={`${inputClass} pl-9`} />
                  </div>
                </Field>
              </div>
            </form>

            <ListingsEditor />
          </>
        )}
      </div>
    </FullScreenModal>
  );
};

// ── Listings ──────────────────────────────────────────────────────────────────

function ListingsEditor() {
  const { data: listings = [], isLoading, error, refetch } = useMyListings();
  const { data: categories = [] } = useMarketplaceCategories();
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const update = useUpdateListing();
  const remove = useDeleteListing();
  const iconOf = useMemo(() => new Map(categories.map((c) => [c.key, c.icon])), [categories]);

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Your listings</h3>
          <p className="mt-0.5 text-xs text-gray-500">Each service you offer, in its category — this is how partners filter the marketplace.</p>
        </div>
        {editing !== "new" && (
          <button onClick={() => setEditing("new")} className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-xs font-semibold text-white transition-colors hover:bg-brand-hover">
            <i className="ri-add-line text-sm" /> Add listing
          </button>
        )}
      </div>

      {editing === "new" && <ListingForm onDone={() => setEditing(null)} />}

      {isLoading ? (
        <div className="h-20 animate-pulse rounded-xl bg-gray-50" />
      ) : error ? (
        <LoadError what="your listings" error={error} onRetry={() => refetch()} />
      ) : listings.length === 0 && editing !== "new" ? (
        <button onClick={() => setEditing("new")} className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center transition-colors hover:border-orange-200 hover:bg-orange-50/30">
          <i className="ri-price-tag-3-line text-2xl text-gray-300" />
          <span className="text-sm font-semibold text-gray-700">No listings yet</span>
          <span className="max-w-xs text-xs text-gray-500">Add what you sell — last-mile delivery, warehousing, haulage — so partners searching that category find you.</span>
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          {listings.map((l) =>
            editing === l.id ? (
              <ListingForm key={l.id} listing={l} onDone={() => setEditing(null)} />
            ) : (
              <article key={l.id} className={`rounded-xl border p-3.5 ${l.is_active ? "border-gray-100" : "border-dashed border-gray-200 bg-gray-50/60"}`}>
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-brand">
                    <i className={`${iconOf.get(l.category) ?? "ri-price-tag-3-line"} text-base`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{l.title}</p>
                      {!l.is_active && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600">Hidden</span>}
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {l.category_name}
                      {l.price_note && <> · <span className="font-semibold text-emerald-700">{l.price_note}</span></>}
                    </p>
                    {l.coverage.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {l.coverage.slice(0, 6).map((s) => <CategoryChip key={s} name={s} />)}
                        {l.coverage.length > 6 && <CategoryChip name={`+${l.coverage.length - 6}`} />}
                      </div>
                    )}
                  </div>
                  <Toggle
                    checked={l.is_active}
                    disabled={update.isPending}
                    onChange={(v) => update.mutate({ id: l.id, payload: { is_active: v } })}
                    label={l.is_active ? "Hide listing" : "Show listing"}
                  />
                </div>
                <div className="mt-2.5 flex justify-end gap-1 border-t border-gray-100 pt-2">
                  <button onClick={() => setEditing(l.id)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100">
                    <i className="ri-edit-line" /> Edit
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`Remove "${l.title}"? This can't be undone.`)) remove.mutate(l.id); }}
                    disabled={remove.isPending}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <i className="ri-delete-bin-line" /> Remove
                  </button>
                </div>
              </article>
            ),
          )}
        </div>
      )}
    </section>
  );
}

function ListingForm({ listing, onDone }: { listing?: MarketplaceListing; onDone: () => void }) {
  const { data: categories = [] } = useMarketplaceCategories();
  const create = useCreateListing();
  const update = useUpdateListing();
  const pending = create.isPending || update.isPending;

  const [form, setForm] = useState<Required<MarketplaceListingPayload>>({
    category: listing?.category ?? "",
    title: listing?.title ?? "",
    description: listing?.description ?? "",
    coverage: listing?.coverage ?? [],
    price_note: listing?.price_note ?? "",
    is_active: listing?.is_active ?? true,
  });
  const [tried, setTried] = useState(false);

  const categoryOptions = categories.map((c) => ({ value: c.key, label: c.name }));
  const titleLen = form.title.trim().length;
  const errors = {
    category: !form.category ? "Pick a category." : null,
    title: titleLen < 3 || titleLen > 120 ? "Give it a title of 3–120 characters." : null,
  };
  const valid = !errors.category && !errors.title;

  const submit = () => {
    setTried(true);
    if (!valid) return;
    const payload = { ...form, title: form.title.trim(), description: form.description.trim(), price_note: form.price_note.trim() };
    if (listing) update.mutate({ id: listing.id, payload }, { onSuccess: onDone });
    else create.mutate(payload, { onSuccess: onDone });
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-orange-200 bg-orange-50/30 p-4">
      <p className="text-sm font-semibold text-gray-900">{listing ? "Edit listing" : "New listing"}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Category" required error={tried ? errors.category : null}>
          <Select
            options={categoryOptions}
            value={categoryOptions.find((o) => o.value === form.category) ?? null}
            onChange={(o) => setForm((f) => ({ ...f, category: o?.value ?? "" }))}
            placeholder="Select a category…"
            {...selectProps}
          />
        </Field>
        <Field label="Price note" hint='Free text, e.g. "From ₦2,500 per drop".' counter={`${form.price_note.length}/120`}>
          <input value={form.price_note} maxLength={120} onChange={(e) => setForm((f) => ({ ...f, price_note: e.target.value }))} placeholder="From ₦2,500 per drop" className={inputClass} />
        </Field>
      </div>
      <Field label="Title" required error={tried ? errors.title : null}>
        <input value={form.title} maxLength={120} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Same-day bike delivery within Lagos" className={inputClass} />
      </Field>
      <Field label="Description" counter={`${form.description.length}/3000`}>
        <textarea
          value={form.description}
          maxLength={3000}
          rows={3}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Vehicles, capacity, turnaround, what's included…"
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm leading-6 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </Field>
      <Field label="Coverage" hint="The states this service covers. Leave empty if it isn't tied to a place.">
        <Select
          isMulti
          options={STATE_OPTIONS}
          value={form.coverage.map((s) => ({ value: s, label: s }))}
          onChange={(opts) => setForm((f) => ({ ...f, coverage: opts.map((o) => o.value) }))}
          placeholder="Select states…"
          closeMenuOnSelect={false}
          {...selectProps}
        />
      </Field>
      <label className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5">
        <span>
          <span className="block text-sm font-medium text-gray-800">Show on my storefront</span>
          <span className="block text-xs text-gray-500">Hidden listings stay here for later.</span>
        </span>
        <Toggle checked={form.is_active} onChange={(v) => setForm((f) => ({ ...f, is_active: v }))} label="Show on my storefront" />
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-white">Cancel</button>
        <button type="button" onClick={submit} disabled={pending} className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60">
          {pending && <i className="ri-loader-4-line animate-spin" />}
          {listing ? "Save listing" : "Publish listing"}
        </button>
      </div>
    </div>
  );
}
