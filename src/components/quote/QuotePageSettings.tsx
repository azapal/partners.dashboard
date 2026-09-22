import { useState, type ReactNode } from "react";
import { useDocumentBranding } from "../../hooks/useBranding";
import { usePartnerProfile } from "../../hooks/useAuth";
import { useQuotePageSettings, useQuoteTeammates, useSaveQuotePageSettings } from "../../hooks/useQuotePage";
import type { MoveRateSet } from "../../lib/data/moveRates";
import { CONTACT_CHANNELS, COPY_CHANNELS } from "../../lib/quotePage";
import type {
  PublicQuotePage,
  QuoteContactChannel,
  QuoteContactList,
  QuoteListChannel,
  QuotePageSettings as Settings,
  QuoteTeammate,
  SaveQuotePagePayload,
} from "../../service/partnerService";
import { DocumentBrandingModal } from "../modal/DocumentBrandingModal";
import { ContactListEditor } from "./ContactListEditor";
import { QuotePageView } from "./QuotePageView";

/**
 * Setting up the public quote page, beside a live preview of it.
 *
 * Edits collect in a draft and go up together on Save, the same as the price
 * lists on this screen. Branding is deliberately not edited here: the page uses
 * the logo and colour from invoice branding so the quote and the invoice that
 * follows it match, and this panel opens that editor rather than keeping a copy.
 */

const toPayload = (s: Settings): SaveQuotePagePayload => ({
  slug: s.slug,
  is_published: s.is_published,
  headline: s.headline,
  intro: s.intro,
  follow_up_note: s.follow_up_note,
  countries: s.countries,
  contact_channels: s.contact_channels,
  copy_channels: s.copy_channels,
});

/**
 * Order-insensitive comparison: Postgres hands JSON back in its own key order,
 * so a saved page would otherwise look changed the moment it came back.
 */
const stable = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(stable)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .sort(([a], [b]) => (a < b ? -1 : 1))
            .map(([k, v]) => [k, stable(v)]),
        )
      : value;

const canonical = (p: SaveQuotePagePayload) =>
  JSON.stringify(
    stable({
      ...p,
      countries: [...p.countries].sort(),
      copy_channels: [...p.copy_channels].sort(),
      contact_channels: Object.fromEntries(
        Object.entries(p.contact_channels).filter(([, v]) => (typeof v === "string" ? v.trim() : v)),
      ),
    }),
  );

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-orange-50";

export const QuotePageSettings = ({
  savedSets,
  onOpenPriceLists,
}: {
  /** Only lists already saved to the account — a draft can't be offered to customers. */
  savedSets: MoveRateSet[];
  onOpenPriceLists: () => void;
}) => {
  const { data: settings, isPending, isError, error, refetch } = useQuotePageSettings();
  const save = useSaveQuotePageSettings();
  const { data: branding } = useDocumentBranding();
  const { data: teammates = [] } = useQuoteTeammates();
  const profile = usePartnerProfile();

  const [draft, setDraft] = useState<SaveQuotePagePayload | null>(null);
  const [showBranding, setShowBranding] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  if (isPending || isError || !settings) {
    return (
      <div className="rounded-2xl bg-white py-14 text-center shadow-card">
        {isError ? (
          <>
            <p className="text-sm text-gray-500">Couldn't load your quote page{error?.message ? ` — ${error.message}` : "."}</p>
            <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-semibold text-brand hover:text-brand-hover">
              Try again
            </button>
          </>
        ) : (
          <p className="text-sm text-gray-400">Loading…</p>
        )}
      </div>
    );
  }

  const baseline = toPayload(settings);
  const current = draft ?? baseline;
  const dirty = !settings.exists || (!!draft && canonical(draft) !== canonical(baseline));
  const update = (patch: Partial<SaveQuotePagePayload>) => setDraft((prev) => ({ ...(prev ?? baseline), ...patch }));

  const link = `${window.location.origin}/quote/${current.slug}`;
  const liveLink = `${window.location.origin}/quote/${settings.slug}`;
  const pricedSets = savedSets.filter((s) => Object.values(s.base).some((v) => v > 0));

  const submit = () => {
    const sent = current;
    save.mutate(sent, {
      // Keep anything typed while the save was in flight.
      onSuccess: () => setDraft((prev) => (prev === null || prev === sent ? null : prev)),
    });
  };

  const status = save.isPending
    ? { dot: "bg-gray-300", title: "Saving…", note: "" }
    : !settings.exists
      ? { dot: "bg-amber-500", title: "Not set up yet", note: "Check the details below, then save to create your page." }
      : dirty
        ? { dot: "bg-amber-500", title: "Unsaved changes", note: "Customers see the saved version until you save." }
        : settings.is_published
          ? { dot: "bg-emerald-500", title: "Live", note: liveLink }
          : { dot: "bg-gray-300", title: "Not published", note: "Customers can't open your page until you publish it." };

  const preview: PublicQuotePage = {
    slug: current.slug,
    partner_name: profile?.partner_name || "Your company",
    logo_url: branding?.logo_url ?? null,
    accent_color: branding?.accent_color ?? null,
    headline: current.headline,
    intro: current.intro,
    follow_up_note: current.follow_up_note,
    contact_channels: previewAddresses(current, teammates),
    copy_channels: current.copy_channels.filter((c) => settings.available_copy_channels.includes(c)),
    rate_sets: pricedSets
      .filter((s) => current.countries.includes(s.country))
      .map((s) => ({
        country: s.country,
        currency: s.currency,
        base: s.base,
        modifiers: s.modifiers.filter((m) => m.enabled),
        custom_fields: s.customFields,
      })),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl bg-white px-5 py-3.5 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className={`h-2 w-2 shrink-0 rounded-full ${status.dot}`} />
            {status.title}
          </p>
          {save.error ? (
            <p className="mt-0.5 text-xs text-red-600">{save.error.message}</p>
          ) : (
            status.note && <p className="mt-0.5 truncate text-xs text-gray-400">{status.note}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {settings.exists && dirty && (
            <button
              type="button"
              onClick={() => { setDraft(null); save.reset(); }}
              disabled={save.isPending}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-40"
            >
              Discard changes
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!dirty || save.isPending}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {save.isPending ? "Saving…" : "Save quote page"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <Panel title="Your page" hint="The link you share on your website, social profiles and WhatsApp status.">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={current.is_published}
                onChange={(e) => update({ is_published: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-[#F14724]"
              />
              <span>
                <span className="block text-sm font-semibold text-gray-800">Published</span>
                <span className="block text-xs text-gray-400">Anyone with the link can price a move and send you their details.</span>
              </span>
            </label>
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-medium text-gray-600">Your link</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex min-w-0 flex-1 items-center rounded-xl border border-gray-200 bg-white focus-within:border-brand focus-within:ring-4 focus-within:ring-orange-50">
                  <span className="shrink-0 truncate pl-3 text-sm text-gray-400">{window.location.host}/quote/</span>
                  <input
                    value={current.slug}
                    onChange={(e) => update({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 48) })}
                    aria-label="Your link"
                    className="min-w-0 flex-1 rounded-r-xl py-2.5 pr-3 text-sm outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(link).then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }, () => undefined)}
                    className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    <i className={`${linkCopied ? "ri-check-line" : "ri-file-copy-line"} mr-1`} />
                    {linkCopied ? "Copied" : "Copy"}
                  </button>
                  {settings.exists && settings.is_published && (
                    <a
                      href={liveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      <i className="ri-external-link-line mr-1" />
                      Open
                    </a>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Wording">
            <div className="flex flex-col gap-3">
              <TextField label="Headline" value={current.headline} max={120} onChange={(headline) => update({ headline })} />
              <TextField label="Introduction" value={current.intro} max={500} multiline placeholder="Who you are, where you move people, what makes you different." onChange={(intro) => update({ intro })} />
              <TextField
                label="What happens next"
                hint="Shown with the quote, and in the copy we send the customer."
                value={current.follow_up_note}
                max={300}
                multiline
                onChange={(follow_up_note) => update({ follow_up_note })}
              />
            </div>
          </Panel>

          <Panel title="Price lists on the page" hint="Only saved lists can be offered.">
            {savedSets.length === 0 ? (
              <p className="text-sm text-gray-500">
                You haven't saved a price list yet.{" "}
                <button type="button" onClick={onOpenPriceLists} className="font-semibold text-brand hover:text-brand-hover">
                  Set up your prices
                </button>
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {savedSets.map((s) => {
                  const hasPrices = pricedSets.includes(s);
                  return (
                    <label key={s.country} className={`flex items-center gap-3 ${hasPrices ? "cursor-pointer" : "opacity-50"}`}>
                      <input
                        type="checkbox"
                        disabled={!hasPrices}
                        checked={current.countries.includes(s.country)}
                        onChange={(e) =>
                          update({
                            countries: e.target.checked
                              ? [...current.countries, s.country]
                              : current.countries.filter((c) => c !== s.country),
                          })
                        }
                        className="h-4 w-4 accent-[#F14724]"
                      />
                      <span className="text-sm text-gray-800">{s.country}</span>
                      <span className="text-xs text-gray-400">{s.currency}{hasPrices ? "" : " · no prices yet"}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel
            title="Where customers send you their quote"
            hint="After pricing, a customer taps one of these and their app opens with the quote typed. Leave one empty to hide it."
          >
            <div className="flex flex-col gap-3">
              {CONTACT_CHANNELS.filter((c) => c.kind === "single").map((c) => (
                <div key={c.id} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
                  <span className="flex w-32 shrink-0 items-center gap-2 pt-2.5 text-sm font-medium text-gray-700">
                    <i className={`${c.icon} text-base text-gray-400`} aria-hidden="true" />
                    {c.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <input
                      value={(current.contact_channels[c.id as "email" | "instagram"] as string) ?? ""}
                      onChange={(e) => update({ contact_channels: { ...current.contact_channels, [c.id]: e.target.value } })}
                      placeholder={c.placeholder}
                      aria-label={c.inputLabel}
                      className={inputClass}
                    />
                    <p className="mt-1 text-[11px] text-gray-400">{c.hint}</p>
                  </div>
                </div>
              ))}
              {CONTACT_CHANNELS.filter((c) => c.kind === "list").map((c) => (
                <ContactListEditor
                  key={c.id}
                  channel={c.id as QuoteListChannel}
                  label={c.label}
                  icon={c.icon}
                  placeholder={c.placeholder}
                  hint={c.hint}
                  value={current.contact_channels[c.id as QuoteListChannel]}
                  teammates={teammates}
                  onChange={(value) =>
                    update({ contact_channels: { ...current.contact_channels, [c.id]: value } })
                  }
                />
              ))}
            </div>
          </Panel>

          <Panel
            title="Send customers their own copy"
            hint="The customer picks one of these, or none. It goes out from Azapal in your name, with your logo and colour."
          >
            <div className="flex flex-col gap-2.5">
              {COPY_CHANNELS.map((c) => {
                const available = settings.available_copy_channels.includes(c.id);
                return (
                  <label key={c.id} className={`flex items-start gap-3 ${available ? "cursor-pointer" : ""}`}>
                    <input
                      type="checkbox"
                      disabled={!available}
                      checked={available && current.copy_channels.includes(c.id)}
                      onChange={(e) =>
                        update({
                          copy_channels: e.target.checked
                            ? [...current.copy_channels, c.id]
                            : current.copy_channels.filter((x) => x !== c.id),
                        })
                      }
                      className="mt-0.5 h-4 w-4 accent-[#F14724]"
                    />
                    <span>
                      <span className={`flex items-center gap-1.5 text-sm font-medium ${available ? "text-gray-800" : "text-gray-400"}`}>
                        <i className={c.icon} aria-hidden="true" />
                        {c.label}
                      </span>
                      {!available && <span className="block text-[11px] text-gray-400">{c.unavailable}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </Panel>

          <Panel title="Branding" hint="The page uses your invoice branding, so the quote and the invoice after it match.">
            <div className="flex items-center gap-3">
              {branding?.logo_url ? (
                <img src={branding.logo_url} alt="" className="h-10 w-10 rounded-lg border border-gray-100 object-contain p-1" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">Logo</span>
              )}
              <span
                className="h-10 w-10 rounded-lg border border-gray-100"
                style={{ backgroundColor: branding?.accent_color || "#F14724" }}
                title="Accent colour"
              />
              <button
                type="button"
                onClick={() => setShowBranding(true)}
                className="ml-auto rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Edit branding
              </button>
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-4">
            <p className="mb-2 text-xs font-medium text-gray-400">Preview — nothing is saved or sent from here</p>
            <div className="max-h-[80vh] overflow-y-auto rounded-3xl border border-gray-200 shadow-card">
              <QuotePageView page={preview} embedded />
            </div>
          </div>
        </div>
      </div>

      {showBranding && <DocumentBrandingModal onClose={() => setShowBranding(false)} />}
    </div>
  );
};

/**
 * What the preview shows as the contact for each channel: the first number,
 * which is also what a real page shows before interchange takes its turn.
 */
const previewAddresses = (settings: SaveQuotePagePayload, teammates: QuoteTeammate[]) => {
  const addresses: Partial<Record<QuoteContactChannel, string>> = {};
  for (const channel of ["email", "instagram"] as const) {
    const value = settings.contact_channels[channel];
    if (value && value.trim()) addresses[channel] = value.trim();
  }
  for (const channel of ["whatsapp", "sms"] as const) {
    const list: QuoteContactList | undefined = settings.contact_channels[channel];
    for (const contact of list?.contacts ?? []) {
      const phone = contact.employee_id
        ? teammates.find((t) => t.id === contact.employee_id)?.phone
        : contact.phone;
      if (phone?.trim()) {
        addresses[channel] = phone.trim();
        break;
      }
    }
  }
  return addresses;
};

const Panel = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <section className="rounded-2xl bg-white p-5 shadow-card">
    <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
    {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

const TextField = ({
  label,
  hint,
  value,
  max,
  multiline,
  placeholder,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  max: number;
  multiline?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}) => (
  <label className="flex flex-col gap-1.5">
    <span className="flex items-baseline justify-between text-xs font-medium text-gray-600">
      {label}
      <span className="font-normal text-gray-300">{value.length}/{max}</span>
    </span>
    {multiline ? (
      <textarea value={value} maxLength={max} rows={3} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`${inputClass} resize-y`} />
    ) : (
      <input value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    )}
    {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
  </label>
);
