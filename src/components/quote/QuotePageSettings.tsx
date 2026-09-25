import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useDocumentBranding } from "../../hooks/useBranding";
import { usePartnerProfile } from "../../hooks/useAuth";
import { useQuotePageSettings, useQuoteTeammates, useSaveQuotePageSettings } from "../../hooks/useQuotePage";
import { DEFAULT_PROMPT, type QuoteServiceId } from "../../lib/data/quoteServices";
import { CONTACT_CHANNELS, COPY_CHANNELS, shareLink } from "../../lib/quotePage";
import type {
  PublicQuotePage,
  QuoteContactChannels,
  QuotePageService,
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
import { QuoteQuestionsEditor, questionsProblem } from "./QuoteQuestionsEditor";

/**
 * Setting up the public quote page, beside a live preview of it.
 *
 * Edits collect in a draft and go up together on Save. Branding is deliberately
 * not edited here: the page uses the logo and colour from invoice branding so
 * the quote and the invoice that follows it match, and this panel opens that
 * editor rather than keeping a copy.
 */

const toPayload = (s: Settings): SaveQuotePagePayload => ({
  slug: s.slug,
  is_published: s.is_published,
  headline: s.headline,
  intro: s.intro,
  follow_up_note: s.follow_up_note,
  services: s.services,
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
      copy_channels: [...p.copy_channels].sort(),
      services: p.services,
      // Null is a value here: it's what "inherited from the company page" looks like.
      contact_channels: p.contact_channels
        ? Object.fromEntries(
            Object.entries(p.contact_channels).filter(([, v]) => (typeof v === "string" ? v.trim() : v)),
          )
        : null,
    }),
  );

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-orange-50";

export const QuotePageSettings = ({
  view,
  branchId = null,
  limited = false,
}: {
  /** "page" for the page itself, or the service being set up. */
  view: "page" | QuoteServiceId;
  /** Null edits the company's page; a branch id edits that branch's. */
  branchId?: number | null;
  /**
   * For editors without admin rights — a branch manager in the support shell.
   * Drops the preview and the branding panel, whose data they can't read.
   */
  limited?: boolean;
}) => {
  const { data: settings, isPending, isError, error, refetch } = useQuotePageSettings(branchId);
  const save = useSaveQuotePageSettings(branchId);
  const { data: branding } = useDocumentBranding(!limited);
  const { data: teammates = [] } = useQuoteTeammates();
  const profile = usePartnerProfile();

  const [draft, setDraft] = useState<SaveQuotePagePayload | null>(null);
  /**
   * Which sections the editor has unlocked on a branch page. Unlocking alone
   * changes nothing: a field starts overriding the company's only once it's
   * edited, so switching this off to change a headline doesn't quietly freeze
   * the note underneath it.
   */
  const [unlocked, setUnlocked] = useState({ wording: false, contacts: false });
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

  const isBranch = !!settings.branch;
  // What the page says once inheritance is applied — the preview and the
  // "you're showing the company's" notes read this, not the raw draft.
  const effective = settings.effective;
  const ownWording = current.headline !== null || current.intro !== null || current.follow_up_note !== null;
  const ownContacts = current.contact_channels !== null;
  const wordingInherited = isBranch && !ownWording && !unlocked.wording;
  const contactsInherited = isBranch && !ownContacts && !unlocked.contacts;
  const wording = {
    headline: current.headline ?? effective.headline,
    intro: current.intro ?? effective.intro,
    follow_up_note: current.follow_up_note ?? effective.follow_up_note,
  };
  const contacts: QuoteContactChannels = current.contact_channels ?? effective.contact_channels;

  const available = settings.available_services;
  const serviceName = (id: string) =>
    available.find((a) => a.service === id)?.name ?? current.services.find((x) => x.service === id)?.label ?? "Service";
  // An unfinished question would only have the whole save refused, so it's
  // caught here, where the partner can see which service it's on.
  const unfinished = current.services.find((x) => questionsProblem(x.questions ?? []));
  const problem = unfinished
    ? `${unfinished.label || serviceName(unfinished.service)}: ${questionsProblem(unfinished.questions ?? [])}`
    : null;

  const link = shareLink(current.slug);
  const liveLink = shareLink(settings.slug);

  const submit = () => {
    // The draft as it stands right now: what's cleared on success, so anything
    // typed while the save was in flight survives as a new change.
    const submitted = draft;
    // A branch sends only what it may differ on; the rest belongs to the company
    // page, and the server refuses a branch that tries to set it.
    const body: SaveQuotePagePayload = isBranch
      ? ({
          slug: current.slug,
          is_published: current.is_published,
          headline: current.headline,
          intro: current.intro,
          follow_up_note: current.follow_up_note,
          contact_channels: current.contact_channels,
        } as SaveQuotePagePayload)
      : current;
    save.mutate(body, {
      onSuccess: () => setDraft((prev) => (prev === null || prev === submitted ? null : prev)),
    });
  };

  const status = save.isPending
    ? { dot: "bg-gray-300", title: "Saving…", note: "" }
    : !settings.exists
      ? { dot: "bg-amber-500", title: "Not set up yet", note: "Check the details below, then save to create your page." }
      : dirty
        ? { dot: "bg-amber-500", title: "Unsaved changes", note: problem ?? "Customers see the saved version until you save." }
        : settings.is_published
          ? { dot: "bg-emerald-500", title: "Live", note: liveLink }
          : { dot: "bg-gray-300", title: "Not published", note: "Customers can't open your page until you publish it." };

  const preview: PublicQuotePage = {
    slug: current.slug,
    partner_name: profile?.partner_name || "Your company",
    logo_url: branding?.logo_url ?? null,
    accent_color: branding?.accent_color ?? null,
    headline: wording.headline,
    intro: wording.intro,
    follow_up_note: wording.follow_up_note,
    // On the company page the preview follows what's being edited; a branch
    // can't change these, so it shows what it inherits. A service the partner no
    // longer offers stays off the page here, as it does live.
    services: (isBranch ? effective.services : current.services).filter((entry) =>
      available.some((a) => a.service === entry.service),
    ),
    contact_channels: previewAddresses(contacts, teammates),
    copy_channels: (isBranch ? effective.copy_channels : current.copy_channels).filter((c) =>
      settings.available_copy_channels.includes(c),
    ),
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
            disabled={!dirty || !!problem || save.isPending}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {save.isPending ? "Saving…" : "Save quote page"}
          </button>
        </div>
      </div>

      <div className={`grid gap-4 ${limited ? "" : "lg:grid-cols-5"}`}>
        <div className={`flex flex-col gap-4 ${limited ? "" : "lg:col-span-3"}`}>
          {isBranch && view !== "page" ? (
            <Panel title={serviceName(view)}>
              <p className="text-sm text-gray-500">
                What this page quotes for, and the questions it asks, are set once on the company page — this branch
                offers the same. It can differ on its link, its wording and who its leads go to.
              </p>
            </Panel>
          ) : view === "page" ? (
            <>
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
                <span className="block text-xs text-gray-400">Anyone with the link can ask you for a quote and leave their details.</span>
              </span>
            </label>
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-medium text-gray-600">Your link</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex min-w-0 flex-1 items-center rounded-xl border border-gray-200 bg-white focus-within:border-brand focus-within:ring-4 focus-within:ring-orange-50">
                  <span className="shrink-0 truncate pl-3 text-sm text-gray-400">{link.replace(/[^/]+$/, "")}</span>
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
            {isBranch && (
              <InheritSwitch
                label="Use the company page's wording"
                inherited={wordingInherited}
                onChange={(inherit) => {
                  setUnlocked((u) => ({ ...u, wording: !inherit }));
                  if (inherit) update({ headline: null, intro: null, follow_up_note: null });
                }}
              />
            )}
            <div className={`flex flex-col gap-3 ${wordingInherited ? "pointer-events-none opacity-50" : ""}`}>
              <TextField label="Headline" value={wording.headline} max={120} onChange={(headline) => update({ headline })} />
              <TextField label="Introduction" value={wording.intro} max={500} multiline placeholder="Who you are, where you move people, what makes you different." onChange={(intro) => update({ intro })} />
              <TextField
                label="What happens next"
                hint="Shown with their request, and in the copy we send the customer."
                value={wording.follow_up_note}
                max={300}
                multiline
                onChange={(follow_up_note) => update({ follow_up_note })}
              />
            </div>
          </Panel>

          <Panel
            title="Where customers send you their request"
            hint="Once they've filled in your questions, a customer taps one of these and their app opens with their request typed. Leave one empty to hide it."
          >
            {isBranch && (
              <InheritSwitch
                label="Use the company page's contacts"
                hint="Switch this off to send this branch's leads to its own people."
                inherited={contactsInherited}
                onChange={(inherit) => {
                  setUnlocked((u) => ({ ...u, contacts: !inherit }));
                  // Contacts are one set, so the branch starts from a copy of
                  // the company's and edits from there.
                  update({ contact_channels: inherit ? null : effective.contact_channels });
                }}
              />
            )}
            <div className={`flex flex-col gap-3 ${contactsInherited ? "pointer-events-none opacity-50" : ""}`}>
              {CONTACT_CHANNELS.filter((c) => c.kind === "single").map((c) => (
                <div key={c.id} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
                  <span className="flex w-32 shrink-0 items-center gap-2 pt-2.5 text-sm font-medium text-gray-700">
                    <i className={`${c.icon} text-base text-gray-400`} aria-hidden="true" />
                    {c.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <input
                      value={(contacts[c.id as "email"] as string) ?? ""}
                      onChange={(e) => update({ contact_channels: { ...contacts, [c.id]: e.target.value } })}
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
                  value={contacts[c.id as QuoteListChannel]}
                  teammates={teammates}
                  onChange={(value) => update({ contact_channels: { ...contacts, [c.id]: value } })}
                />
              ))}
            </div>
          </Panel>

          {isBranch ? (
            <Panel title="Send customers their own copy">
              <p className="text-sm text-gray-500">
                Set once on the company page, for every branch.
              </p>
            </Panel>
          ) : (
          <Panel
            title="Send customers their own copy"
            hint="Their own copy of the quote, by email, sent from Azapal in your name with your logo and colour."
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

          )}

          {!limited && (
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
          )}
            </>
          ) : (
            (() => {
            const meta = available.find((a) => a.service === view);
            const entry = current.services.find((x) => x.service === view);
            if (!meta) {
              return (
                <Panel title={entry?.label ?? "Service"}>
                  <p className="text-sm text-gray-500">
                    You don't offer this service any more, so it's off your page. Tick it again under{" "}
                    <Link to="/service" className="font-semibold text-brand hover:text-brand-hover">Services</Link>{" "}
                    and your questions for it will still be here.
                  </p>
                </Panel>
              );
            }
            const offer = (on: boolean) =>
              update({
                services: on
                  ? [...current.services, { service: meta.service, label: meta.name, blurb: "", prompt: "", questions: [] }]
                  : current.services.filter((x) => x.service !== meta.service),
              });
            const patch = (fields: Partial<QuotePageService>) =>
              update({ services: current.services.map((x) => (x.service === view ? { ...x, ...fields } : x)) });

            return (
              <>
                <Panel title={meta.name} hint="Customers answer your questions; you come back with a price.">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={!!entry}
                      onChange={(e) => offer(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#F14724]"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-gray-800">Offer this on your quote page</span>
                      <span className="block text-xs text-gray-400">
                        {meta.description || "Customers ask you for a price for it."}
                      </span>
                    </span>
                  </label>

                  {entry && (
                    <div className="mt-4 flex flex-col gap-3">
                      <TextField
                        label="What customers see it called"
                        value={entry.label}
                        max={80}
                        placeholder={meta.name}
                        onChange={(label) => patch({ label })}
                      />
                      <TextField
                        label="A line about it"
                        value={entry.blurb}
                        max={300}
                        placeholder="Shown under the name on the page"
                        onChange={(blurb) => patch({ blurb })}
                      />
                    </div>
                  )}
                </Panel>

                {entry && (
                  <Panel
                    title="Your quote questions"
                    hint="What you need to know before you can price the job. The answers come to you with the customer's details."
                  >
                    <QuoteQuestionsEditor questions={entry.questions ?? []} onChange={(questions) => patch({ questions })} />
                    <div className="mt-4">
                      <TextField
                        label="Closing question"
                        hint={
                          (entry.questions ?? []).length
                            ? "An open box at the end, for anything your questions don't cover. Leave it empty to skip it."
                            : "With no questions above, this is the one thing a customer is asked."
                        }
                        value={entry.prompt}
                        max={200}
                        placeholder={DEFAULT_PROMPT}
                        onChange={(prompt) => patch({ prompt })}
                      />
                    </div>
                  </Panel>
                )}

              </>
            );
            })()
          )}
        </div>

        {!limited && (
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-4">
            <p className="mb-2 text-xs font-medium text-gray-400">Preview — nothing is saved or sent from here</p>
            <div className="max-h-[80vh] overflow-y-auto rounded-3xl border border-gray-200 shadow-card">
              <QuotePageView key={preview.services.map((s) => s.service).join()} page={preview} embedded />
            </div>
          </div>
        </div>
        )}
      </div>

      {showBranding && <DocumentBrandingModal onClose={() => setShowBranding(false)} />}
    </div>
  );
};

/**
 * What the preview shows as the contact for each channel: the first number,
 * which is also what a real page shows before interchange takes its turn.
 */
const previewAddresses = (channels: QuoteContactChannels, teammates: QuoteTeammate[]) => {
  const addresses: Partial<Record<QuoteContactChannel, string>> = {};
  const email = channels.email;
  if (email && email.trim()) addresses.email = email.trim();
  for (const channel of ["whatsapp", "sms", "instagram"] as const) {
    const list: QuoteContactList | undefined = channels[channel];
    for (const contact of list?.contacts ?? []) {
      const teammate = teammates.find((t) => t.id === contact.employee_id);
      const address = contact.employee_id
        ? channel === "instagram" ? teammate?.social_handle : teammate?.phone
        : contact.address;
      if (address?.trim()) {
        addresses[channel] = address.trim();
        break;
      }
    }
  }
  return addresses;
};

/** Inherit from the company page, or set this branch's own. */
const InheritSwitch = ({
  label,
  hint,
  inherited,
  onChange,
}: {
  label: string;
  hint?: string;
  inherited: boolean;
  onChange: (inherited: boolean) => void;
}) => (
  <label className="mb-3 flex cursor-pointer items-start gap-3 rounded-xl bg-gray-50 px-3.5 py-3">
    <input
      type="checkbox"
      checked={inherited}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 h-4 w-4 accent-[#F14724]"
    />
    <span>
      <span className="block text-sm font-medium text-gray-800">{label}</span>
      <span className="block text-[11px] text-gray-400">
        {hint ?? "Changes on the company page reach this branch while this is on."}
      </span>
    </span>
  </label>
);

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
