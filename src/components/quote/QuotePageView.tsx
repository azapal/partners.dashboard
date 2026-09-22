import { useMemo, useState, type ReactNode } from "react";
import { BRAND_ORANGE } from "../../lib/brandColors";
import {
  DISTANCE_BANDS,
  PROPERTY_SIZES,
  baseKey,
  buildQuote,
  fieldOptions,
  isPricedFieldType,
  money,
  type MoveRateSet,
} from "../../lib/data/moveRates";
import {
  CONTACT_CHANNELS,
  COPY_CHANNELS,
  buildPartnerMessage,
  channelLabel,
  contactHref,
  textOn,
  toRateSet,
} from "../../lib/quotePage";
import type {
  PublicQuotePage,
  QuoteContactChannel,
  QuoteCopyChannel,
  QuoteRequestRecord,
  SubmitQuotePayload,
} from "../../service/partnerService";

/**
 * What a partner's customer sees at /quote/<slug> — and, with no `onSubmit`,
 * the live preview beside the quote-page settings in the dashboard.
 *
 * Branded as the partner throughout: their name, logo and colour, with Azapal
 * only in the footer. The estimate is computed here as the customer chooses,
 * but the quote they are given back is the server's (see quote_page.py) — the
 * two agree because they run the same rules, not because this one is trusted.
 */

type Answer = string | number | boolean;

interface QuotePageViewProps {
  page: PublicQuotePage;
  /** Absent in the preview: nothing is saved or sent, and the result is built here. */
  onSubmit?: (payload: SubmitQuotePayload) => Promise<QuoteRequestRecord>;
  onContact?: (reference: string, channel: QuoteContactChannel) => void;
  /** Inside the dashboard's preview frame rather than filling a browser tab. */
  embedded?: boolean;
}

const digitsOnly = (v: string) => v.replace(/[^\d]/g, "");

/** Answers that carry no price, worded as the server words them. */
const recordedAnswers = (set: MoveRateSet, answers: Record<string, Answer>) =>
  set.customFields.flatMap((f) => {
    const value = answers[f.id];
    if (value === undefined || value === "" || value === false || value === 0) return [];
    if (isPricedFieldType(f.type) && f.amount > 0) return [];
    if (f.type === "boolean") return [{ label: f.label, value: "Yes" }];
    const text = String(value).trim();
    return text ? [{ label: f.label, value: text }] : [];
  });

export const QuotePageView = ({ page, onSubmit, onContact, embedded }: QuotePageViewProps) => {
  const accent = page.accent_color || BRAND_ORANGE;
  const onAccent = textOn(accent);
  const sets = useMemo(() => page.rate_sets.map(toRateSet), [page.rate_sets]);

  const [country, setCountry] = useState(sets[0]?.country ?? "");
  const set = sets.find((s) => s.country === country) ?? sets[0];

  const [sizeId, setSizeId] = useState("");
  const [bandId, setBandId] = useState("");
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [copyChannel, setCopyChannel] = useState<QuoteCopyChannel | "">("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<QuoteRequestRecord | null>(null);
  const [copied, setCopied] = useState(false);

  const priced = (s: string, b: string) => (set?.base[baseKey(s, b)] ?? 0) > 0;
  const sizes = set ? PROPERTY_SIZES.filter((s) => DISTANCE_BANDS.some((b) => priced(s.id, b.id))) : [];
  const size = sizes.find((s) => s.id === sizeId);
  const bands = size ? DISTANCE_BANDS.filter((b) => priced(size.id, b.id)) : [];
  // One distance on offer needs no choosing.
  const band = bands.find((b) => b.id === bandId) ?? (bands.length === 1 ? bands[0] : undefined);

  const customValues = useMemo(() => {
    const values: Record<string, number> = {};
    for (const f of set?.customFields ?? []) {
      const v = answers[f.id];
      if (f.type === "number" && typeof v === "number") values[f.id] = v;
      if (f.type === "boolean" && v === true) values[f.id] = 1;
    }
    return values;
  }, [set, answers]);

  const estimate = set && size && band ? buildQuote(set, size.id, band.id, selections, customValues) : null;

  const chooseCountry = (c: string) => {
    setCountry(c);
    setSizeId("");
    setBandId("");
    setSelections({});
    setAnswers({});
  };

  const submit = async () => {
    setError("");
    if (!set || !size || !band || !estimate) return setError("Choose what you're moving and how far first.");
    if (name.trim().length < 2) return setError("Enter your name.");
    if (digitsOnly(phone).length < 7) return setError("Enter a phone number we can reach you on.");
    if (copyChannel === "email" && !email.trim()) return setError("Enter your email so we can send your copy.");

    const payload: SubmitQuotePayload = {
      country: set.country,
      property_size: size.id,
      distance_band: band.id,
      selections,
      answers,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      copy_channel: copyChannel || null,
    };

    if (!onSubmit) {
      const recorded = recordedAnswers(set, answers);
      setResult({
        reference: "PREVIEW",
        country: set.country,
        currency: set.currency,
        property_size: size.id,
        distance_band: band.id,
        lines: estimate.lines.map((l) => ({ label: l.label, detail: l.detail ?? null, amount: l.amount })),
        answers: recorded,
        total: estimate.total,
        customer_name: payload.name,
        customer_phone: payload.phone,
        customer_email: payload.email ?? null,
        copy_channel: payload.copy_channel ?? null,
        copy_status: copyChannel ? "sent" : "not_requested",
        contacted_via: [],
        assigned_contacts: {},
        status: "new",
        created_at: new Date().toISOString(),
        message: buildPartnerMessage({
          partnerName: page.partner_name,
          reference: "PREVIEW",
          symbol: set.symbol,
          lines: estimate.lines,
          total: estimate.total,
          answers: recorded,
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
        }),
      });
      return;
    }

    setBusy(true);
    try {
      setResult(await onSubmit(payload));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong — try again.");
    } finally {
      setBusy(false);
    }
  };

  const startAgain = () => {
    setResult(null);
    setCopied(false);
    setError("");
  };

  // After a quote, the server says which contact it goes to (interchange takes
  // turns between them); before one, the page's own first contact stands in.
  const addresses = result?.contacts ?? page.contact_channels;
  const contacts = CONTACT_CHANNELS.filter((c) => addresses[c.id]);
  const offeredCopies = COPY_CHANNELS.filter((c) => page.copy_channels.includes(c.id));
  const symbol = set?.symbol ?? "";

  const contactButtons = (message: string, reference: string | null) => (
    <div className="grid grid-cols-2 gap-2">
      {contacts.map((c) => {
        const href = contactHref(c.id, addresses[c.id]!, message, reference ? `Quote ${reference}` : "Moving quote");
        const external = href.startsWith("http");
        return (
          <a
            key={c.id}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            onClick={() => {
              if (c.id === "instagram") {
                navigator.clipboard?.writeText(message).then(() => setCopied(true), () => undefined);
              }
              if (reference) onContact?.(reference, c.id);
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
          >
            <i className={`${c.icon} text-lg`} style={{ color: accent }} aria-hidden="true" />
            {c.label}
          </a>
        );
      })}
    </div>
  );

  return (
    <div className={embedded ? "bg-gray-50" : "min-h-screen bg-gray-50"}>
      <header style={{ backgroundColor: accent, color: onAccent }}>
        <div className={`mx-auto max-w-xl px-5 ${embedded ? "py-5" : "py-8"}`}>
          <div className="flex items-center gap-3">
            {page.logo_url ? (
              <img src={page.logo_url} alt="" className="h-10 w-10 rounded-lg bg-white object-contain p-1" />
            ) : (
              <span
                className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold"
                style={{ backgroundColor: onAccent, color: accent }}
              >
                {(page.partner_name || "?").trim().charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-sm font-semibold opacity-90">{page.partner_name}</span>
          </div>
          <h1 className={`mt-4 font-bold leading-tight ${embedded ? "text-xl" : "text-2xl"}`}>
            {page.headline || "Get a moving quote"}
          </h1>
          {page.intro && <p className="mt-1.5 text-sm leading-6 opacity-90">{page.intro}</p>}
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-5">
        {!set ? (
          <Card>
            <p className="text-sm text-gray-600">Online quotes aren't available right now.</p>
            {contacts.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-gray-500">Ask {page.partner_name} directly</p>
                {contactButtons("Hi, I'd like a quote for a move.", null)}
              </div>
            )}
          </Card>
        ) : result ? (
          <>
            <Card>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-bold text-gray-900">Your quote</h2>
                <span className="font-mono text-xs text-gray-400">{result.reference}</span>
              </div>
              <Breakdown symbol={symbol} lines={result.lines} total={result.total} />
              {result.answers.length > 0 && (
                <ul className="mt-3 space-y-0.5 text-xs text-gray-500">
                  {result.answers.map((a) => (
                    <li key={a.label}>{a.label}: <span className="text-gray-700">{a.value}</span></li>
                  ))}
                </ul>
              )}
              <CopyStatus result={result} />
              {page.follow_up_note && (
                <p className="mt-3 rounded-xl bg-gray-50 px-3.5 py-3 text-sm text-gray-700">{page.follow_up_note}</p>
              )}
            </Card>

            {contacts.length > 0 && (
              <Card>
                <h2 className="text-sm font-bold text-gray-900">Send this quote to {page.partner_name}</h2>
                <p className="mb-3 mt-0.5 text-xs text-gray-500">Opens the app with your quote ready to send.</p>
                {contactButtons(result.message ?? "", result.reference)}
                {copied && (
                  <p className="mt-2 text-xs text-gray-500">
                    Quote copied — paste it into your Instagram message.
                  </p>
                )}
              </Card>
            )}

            <button type="button" onClick={startAgain} className="text-sm font-semibold text-gray-500 hover:text-gray-700">
              Start a new quote
            </button>
          </>
        ) : (
          <>
            <Card>
              {sets.length > 1 && (
                <Field label="Where are you moving?">
                  <select
                    value={set.country}
                    onChange={(e) => chooseCountry(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none"
                  >
                    {sets.map((s) => (
                      <option key={s.country} value={s.country}>{s.country}</option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label="What are you moving?">
                <div className="grid grid-cols-2 gap-2">
                  {sizes.map((s) => (
                    <Choice key={s.id} selected={size?.id === s.id} accent={accent} onClick={() => setSizeId(s.id)}>
                      <span className="block text-sm font-semibold text-gray-800">{s.label}</span>
                      <span className="block text-[11px] text-gray-400">about {s.volumeCbm} m³</span>
                    </Choice>
                  ))}
                </div>
              </Field>

              {size && bands.length > 1 && (
                <Field label="How far?">
                  <div className="grid grid-cols-3 gap-2">
                    {bands.map((b) => (
                      <Choice key={b.id} selected={band?.id === b.id} accent={accent} onClick={() => setBandId(b.id)}>
                        <span className="block text-sm font-semibold text-gray-800">{b.label}</span>
                        <span className="block text-[11px] text-gray-400">{b.hint}</span>
                      </Choice>
                    ))}
                  </div>
                </Field>
              )}

              {set.modifiers.length > 0 && (
                <Field label="Anything extra?">
                  <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                    {set.modifiers.map((m) => {
                      const counted = m.kind === "per_floor" || m.kind === "per_hour" || m.kind === "per_week";
                      const qty = selections[m.id] ?? 0;
                      const unit = m.kind === "per_floor" ? "floors" : m.kind === "per_hour" ? "hours" : "weeks";
                      return (
                        <div key={m.id} className="flex items-center gap-3 px-3 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-800">{m.label}</p>
                            {m.hint && <p className="text-[11px] text-gray-400">{m.hint}</p>}
                          </div>
                          {counted ? (
                            <div className="flex items-center gap-1.5" aria-label={`${m.label}, ${unit}`}>
                              <Stepper label={`Fewer ${unit}`} icon="ri-subtract-line" disabled={qty <= 0} onClick={() => setSelections((p) => ({ ...p, [m.id]: Math.max(0, qty - 1) }))} />
                              <span className="w-6 text-center text-sm font-semibold text-gray-800">{qty}</span>
                              <Stepper label={`More ${unit}`} icon="ri-add-line" onClick={() => setSelections((p) => ({ ...p, [m.id]: Math.min(99, qty + 1) }))} />
                            </div>
                          ) : (
                            <input
                              type="checkbox"
                              checked={qty > 0}
                              onChange={(e) => setSelections((p) => ({ ...p, [m.id]: e.target.checked ? 1 : 0 }))}
                              aria-label={m.label}
                              className="h-5 w-5"
                              style={{ accentColor: accent }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Field>
              )}

              {set.customFields.length > 0 && (
                <Field label="A few questions">
                  <div className="flex flex-col gap-2.5">
                    {set.customFields.map((f) => (
                      // A div, not a label: a label activates its first button, so
                      // tapping a yes/no question's text would silently answer "Yes".
                      <div key={f.id} className="flex flex-col gap-1">
                        <span className="text-xs text-gray-600">{f.label}</span>
                        {f.type === "boolean" ? (
                          <div className="flex gap-2">
                            {[true, false].map((v) => (
                              <Choice key={String(v)} selected={answers[f.id] === v} accent={accent} onClick={() => setAnswers((p) => ({ ...p, [f.id]: v }))}>
                                <span className="text-sm font-semibold text-gray-800">{v ? "Yes" : "No"}</span>
                              </Choice>
                            ))}
                          </div>
                        ) : f.type === "select" ? (
                          <select
                            value={String(answers[f.id] ?? "")}
                            onChange={(e) => setAnswers((p) => ({ ...p, [f.id]: e.target.value }))}
                            aria-label={f.label}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none"
                          >
                            <option value="">Choose…</option>
                            {fieldOptions(f).map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        ) : f.type === "number" ? (
                          <input
                            value={answers[f.id] === undefined ? "" : String(answers[f.id])}
                            onChange={(e) => {
                              const raw = digitsOnly(e.target.value);
                              setAnswers((p) => ({ ...p, [f.id]: raw === "" ? "" : Math.min(1_000_000_000, Number(raw)) }));
                            }}
                            inputMode="numeric"
                            placeholder="0"
                            aria-label={f.label}
                            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none"
                          />
                        ) : (
                          <input
                            value={String(answers[f.id] ?? "")}
                            onChange={(e) => setAnswers((p) => ({ ...p, [f.id]: e.target.value.slice(0, 300) }))}
                            aria-label={f.label}
                            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </Field>
              )}
            </Card>

            <Card>
              <h2 className="text-sm font-bold text-gray-900">Your estimate</h2>
              {estimate ? (
                <Breakdown symbol={set.symbol} lines={estimate.lines} total={estimate.total} />
              ) : (
                <p className="mt-2 text-sm text-gray-400">
                  {size ? "Choose how far you're going." : "Choose what you're moving to see a price."}
                </p>
              )}
            </Card>

            <Card>
              <h2 className="text-sm font-bold text-gray-900">Get your quote</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                So {page.partner_name} can reach you about it.
              </p>
              <div className="mt-3 flex flex-col gap-2.5">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" type="tel" autoComplete="tel" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={copyChannel === "email" ? "Email" : "Email (optional)"}
                  type="email"
                  autoComplete="email"
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none"
                />
              </div>

              {offeredCopies.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1.5 text-xs text-gray-600">Send me a copy by</p>
                  <div className="flex flex-wrap gap-2">
                    {[{ id: "" as const, label: "No thanks" }, ...offeredCopies].map((c) => (
                      <Choice key={c.id || "none"} selected={copyChannel === c.id} accent={accent} onClick={() => setCopyChannel(c.id)} compact>
                        <span className="text-xs font-semibold text-gray-700">{c.label}</span>
                      </Choice>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: accent, color: onAccent }}
              >
                {busy ? "Getting your quote…" : estimate ? `Get my quote · ${money(set.symbol, estimate.total)}` : "Get my quote"}
              </button>
            </Card>
          </>
        )}

        <footer className="pb-4 pt-2 text-center text-[11px] text-gray-400">
          Prices are an estimate until {page.partner_name} confirms your booking.
          <br />
          Powered by Azapal
        </footer>
      </main>
    </div>
  );
};

const Card = ({ children }: { children: ReactNode }) => (
  <section className="rounded-2xl bg-white p-4 shadow-card sm:p-5">{children}</section>
);

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="mb-4 last:mb-0">
    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
    {children}
  </div>
);

const Choice = ({
  selected,
  accent,
  onClick,
  compact,
  children,
}: {
  selected: boolean;
  accent: string;
  onClick: () => void;
  compact?: boolean;
  children: ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`rounded-xl border bg-white text-left transition-colors ${compact ? "px-3 py-1.5" : "flex-1 px-3 py-2.5"} ${
      selected ? "" : "border-gray-200 hover:border-gray-300"
    }`}
    style={selected ? { borderColor: accent, boxShadow: `0 0 0 1px ${accent}` } : undefined}
  >
    {children}
  </button>
);

const Stepper = ({ label, icon, onClick, disabled }: { label: string; icon: string; onClick: () => void; disabled?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
  >
    <i className={icon} />
  </button>
);

const Breakdown = ({
  symbol,
  lines,
  total,
}: {
  symbol: string;
  lines: { label: string; detail?: string | null; amount: number }[];
  total: number;
}) => (
  <div className="mt-3">
    {lines.map((line, i) => (
      <div key={`${line.label}-${i}`} className="flex items-start justify-between gap-3 py-1 text-sm">
        <span className="min-w-0 text-gray-600">
          {line.label}
          {line.detail && <span className="block text-[11px] text-gray-400">{line.detail}</span>}
        </span>
        <span className="shrink-0 text-gray-800">{money(symbol, line.amount)}</span>
      </div>
    ))}
    <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2.5">
      <span className="text-sm font-semibold text-gray-700">Total</span>
      <span className="text-xl font-bold text-gray-900">{money(symbol, total)}</span>
    </div>
  </div>
);

const CopyStatus = ({ result }: { result: QuoteRequestRecord }) => {
  if (!result.copy_channel || result.copy_status === "not_requested") return null;
  const where = result.copy_channel === "email" ? result.customer_email : result.customer_phone;
  const text =
    result.copy_status === "sent"
      ? `We've sent a copy to ${where} by ${channelLabel(result.copy_channel).toLowerCase()}.`
      : result.copy_status === "limited"
        ? "We've already sent copies there today, so we didn't send another. Keep this page for your records."
        : "We couldn't send your copy just now — keep this page or take a screenshot.";
  return (
    <p className={`mt-3 text-xs ${result.copy_status === "sent" ? "text-emerald-700" : "text-amber-700"}`}>{text}</p>
  );
};
