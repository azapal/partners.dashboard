import { useEffect, useState, type ReactNode } from "react";
import { BRAND_ORANGE } from "../../lib/brandColors";
import { serviceIcon, type QuoteQuestion } from "../../lib/data/quoteServices";
import {
  CONTACT_CHANNELS,
  COPY_CHANNELS,
  buildPartnerMessage,
  channelLabel,
  contactHref,
  textOn,
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
 * One page, however many services: the customer picks what they need and
 * answers the questions the partner wrote for it. Nothing is priced here — the
 * partner reads the answers and quotes back, which is why the page asks for a
 * name and a number before anything else.
 *
 * Branded as the partner throughout: their name, logo and colour, with Azapal
 * only in the footer. Answers are checked here first so the customer hears about
 * a missing one immediately, but the lead and every message about it are the
 * server's (see quote_page.py) — the two agree because they run the same rules,
 * not because this one is trusted.
 */

/** An answer: a checkbox question answers with a list. */
type Answer = string | number | boolean | string[];

interface QuotePageViewProps {
  page: PublicQuotePage;
  /** Absent in the preview: nothing is saved or sent, and the result is built here. */
  onSubmit?: (payload: SubmitQuotePayload) => Promise<QuoteRequestRecord>;
  onContact?: (reference: string, channel: QuoteContactChannel) => void;
  /** Inside the dashboard's preview frame rather than filling a browser tab. */
  embedded?: boolean;
}

const digitsOnly = (v: string) => v.replace(/[^\d]/g, "");

const isEmpty = (value: Answer | undefined) =>
  value === undefined || value === "" || (Array.isArray(value) && value.length === 0);

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Why an answer won't be accepted, or null — the server's checks
 * (_record_answers), run here first so the customer hears it before sending.
 */
const answerProblem = (q: QuoteQuestion, value: Answer | undefined): string | null => {
  if (isEmpty(value)) return q.required ? `Answer "${q.label}".` : null;
  const v = q.validation ?? {};
  if (typeof value === "string" && (q.type === "text" || q.type === "long_text")) {
    const length = value.trim().length;
    if (v.min_length !== undefined && length < v.min_length) return `${q.label}: at least ${v.min_length} characters.`;
    if (v.max_length !== undefined && length > v.max_length) return `${q.label}: at most ${v.max_length} characters.`;
  }
  if (q.type === "number" && typeof value === "number") {
    if (v.min !== undefined && value < v.min) return `${q.label}: at least ${v.min}.`;
    if (v.max !== undefined && value > v.max) return `${q.label}: at most ${v.max}.`;
  }
  if (q.type === "date" && v.not_past && typeof value === "string" && value < today())
    return `${q.label}: pick today or a later date.`;
  if (q.type === "email" && typeof value === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
    return `${q.label}: enter a valid email address.`;
  if (q.type === "phone" && typeof value === "string" && !/^\+?[\d\s\-().]{7,20}$/.test(value.trim()))
    return `${q.label}: enter a valid phone number.`;
  if (q.type === "link" && typeof value === "string" && !/^(https?:\/\/)?[^\s/$.?#][^\s]*\.[^\s]+$/i.test(value.trim()))
    return `${q.label}: enter a web address.`;
  return null;
};

/** The answers worded as the server words them (_record_answers). */
const recordAnswers = (questions: QuoteQuestion[], answers: Record<string, Answer>) =>
  questions.flatMap((q) => {
    const value = answers[q.id];
    if (isEmpty(value)) return [];
    if (q.type === "boolean") return [{ label: q.label, value: value ? "Yes" : "No" }];
    if (Array.isArray(value)) return [{ label: q.label, value: (q.options ?? []).filter((o) => value.includes(o)).join(", ") }];
    if (q.type === "date" && typeof value === "string") {
      const day = new Date(`${value}T00:00:00`);
      return [{ label: q.label, value: day.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) }];
    }
    return [{ label: q.label, value: String(value).trim() }];
  });

export const QuotePageView = ({ page, onSubmit, onContact, embedded }: QuotePageViewProps) => {
  const accent = page.accent_color || BRAND_ORANGE;
  const onAccent = textOn(accent);

  // One service needs no choosing; several start the customer on the chooser.
  const [serviceId, setServiceId] = useState(page.services.length === 1 ? page.services[0].service : "");
  const service = page.services.find((s) => s.service === serviceId);

  // A service can disappear under the customer — the partner edits the page
  // while it's open — so a stale choice falls back to the chooser.
  const offeredIds = page.services.map((s) => s.service).join();
  useEffect(() => {
    setServiceId((current) => {
      if (page.services.length === 1) return page.services[0].service;
      return page.services.some((s) => s.service === current) ? current : "";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offeredIds]);

  const [details, setDetails] = useState("");
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const questions = service?.questions ?? [];
  // The open box: the partner's closing question, or — with no questions of
  // their own — the one thing a customer is asked.
  const detailsPrompt = service ? service.prompt || (questions.length ? "" : "What do you need?") : "";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [copyChannel, setCopyChannel] = useState<QuoteCopyChannel | "">("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<QuoteRequestRecord | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async () => {
    setError("");
    if (!service) return setError("Choose what you need first.");
    const problem = questions.map((q) => answerProblem(q, answers[q.id])).find(Boolean);
    if (problem) return setError(problem);
    if (!questions.length && !details.trim()) return setError("Tell us a little about what you need.");
    if (name.trim().length < 2) return setError("Enter your name.");
    if (digitsOnly(phone).length < 7) return setError("Enter a phone number we can reach you on.");
    if (copyChannel === "email" && !email.trim()) return setError("Enter your email so we can send your copy.");

    const payload: SubmitQuotePayload = {
      service: service.service,
      details: details.trim(),
      answers,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      copy_channel: copyChannel || null,
    };

    if (!onSubmit) {
      const recorded = recordAnswers(questions, answers);
      setResult({
        reference: "PREVIEW",
        service: service.service,
        service_label: service.label,
        details: details.trim(),
        answers: recorded,
        customer_name: payload.name,
        customer_phone: payload.phone,
        customer_email: payload.email ?? null,
        copy_channel: payload.copy_channel ?? null,
        copy_status: copyChannel ? "sent" : "not_requested",
        branch: null,
        contacted_via: [],
        assigned_contacts: {},
        status: "new",
        created_at: new Date().toISOString(),
        message: buildPartnerMessage({
          partnerName: page.partner_name,
          reference: "PREVIEW",
          serviceLabel: service.label,
          details: details.trim(),
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
    setDetails("");
    setAnswers({});
    if (page.services.length > 1) setServiceId("");
  };

  // After a request, the server says which contact it goes to (interchange takes
  // turns between them); before one, the page's own first contact stands in.
  const addresses = result?.contacts ?? page.contact_channels;
  const contacts = CONTACT_CHANNELS.filter((c) => addresses[c.id]);
  const offeredCopies = COPY_CHANNELS.filter((c) => page.copy_channels.includes(c.id));

  const contactButtons = (message: string, reference: string | null) => (
    <div className="grid grid-cols-2 gap-2">
      {contacts.map((c) => {
        const href = contactHref(c.id, addresses[c.id]!, message, reference ? `Quote ${reference}` : "Quote request");
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
            {page.headline || "Ask us for a quote"}
          </h1>
          {page.intro && <p className="mt-1.5 text-sm leading-6 opacity-90">{page.intro}</p>}
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-5">
        {page.services.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-600">Online quotes aren't available right now.</p>
            {contacts.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-gray-500">Ask {page.partner_name} directly</p>
                {contactButtons("Hi, I'd like a quote.", null)}
              </div>
            )}
          </Card>
        ) : result ? (
          <>
            <Card>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-bold text-gray-900">Your request</h2>
                <span className="font-mono text-xs text-gray-400">{result.reference}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {page.partner_name} has your request and will come back to you with a price.
              </p>
              {result.details && (
                <p className="mt-3 whitespace-pre-wrap rounded-xl bg-gray-50 px-3.5 py-3 text-sm text-gray-700">
                  {result.details}
                </p>
              )}
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
                <h2 className="text-sm font-bold text-gray-900">Send this to {page.partner_name}</h2>
                <p className="mb-3 mt-0.5 text-xs text-gray-500">Opens the app with your request ready to send.</p>
                {contactButtons(result.message ?? "", result.reference)}
                {copied && (
                  <p className="mt-2 text-xs text-gray-500">
                    Your request is copied — paste it into your Instagram message.
                  </p>
                )}
              </Card>
            )}

            <button type="button" onClick={startAgain} className="text-sm font-semibold text-gray-500 hover:text-gray-700">
              Start again
            </button>
          </>
        ) : !service ? (
          <Card>
            <h2 className="text-sm font-bold text-gray-900">What do you need?</h2>
            <div className="mt-3 grid gap-2">
              {page.services.map((s) => (
                <button
                  key={s.service}
                  type="button"
                  onClick={() => { setServiceId(s.service); setAnswers({}); setDetails(""); }}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-left transition-colors hover:border-gray-300"
                >
                  <i className={`${serviceIcon(s.service)} text-xl`} style={{ color: accent }} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-800">{s.label}</span>
                    {s.blurb && <span className="block text-xs text-gray-500">{s.blurb}</span>}
                  </span>
                  <span className="shrink-0 text-[11px] text-gray-400">We'll quote you</span>
                </button>
              ))}
            </div>
          </Card>
        ) : (
          <>
            {page.services.length > 1 && (
              <button
                type="button"
                onClick={() => { setServiceId(""); setError(""); }}
                className="-mb-1 self-start text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                <i className="ri-arrow-left-line mr-1" aria-hidden="true" />
                {service.label} — change
              </button>
            )}

            <Card>
              <h2 className="text-sm font-bold text-gray-900">{service.label}</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {service.blurb || `Tell ${page.partner_name} what you need and they'll come back with a price.`}
              </p>
              {questions.length > 0 && (
                <div className="mt-3 flex flex-col gap-3">
                  {questions.map((q) => (
                    <Question
                      key={q.id}
                      question={q}
                      value={answers[q.id]}
                      accent={accent}
                      onChange={(value) => setAnswers((p) => ({ ...p, [q.id]: value }))}
                    />
                  ))}
                </div>
              )}
              {detailsPrompt && (
                <label className="mt-3 flex flex-col gap-1.5">
                  <span className="text-xs text-gray-600">{detailsPrompt}</span>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value.slice(0, 2000))}
                    rows={questions.length ? 3 : 5}
                    className="w-full resize-y rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-300"
                  />
                </label>
              )}
            </Card>

            <Card>
              <h2 className="text-sm font-bold text-gray-900">Where to reach you</h2>
              <p className="mt-0.5 text-xs text-gray-500">So {page.partner_name} can send you a price.</p>
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
                {busy ? "Sending…" : "Send my request"}
              </button>
            </Card>
          </>
        )}

        <footer className="pb-4 pt-2 text-center text-[11px] text-gray-400">
          {page.partner_name} will come back to you with a price.
          <br />
          Powered by Azapal
        </footer>
      </main>
    </div>
  );
};

const inputClass = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-300";

/** One of the partner's questions, with its hint and limits. */
const Question = ({
  question: q,
  value,
  accent,
  onChange,
}: {
  question: QuoteQuestion;
  value: Answer | undefined;
  accent: string;
  onChange: (value: Answer) => void;
}) => {
  const v = q.validation ?? {};
  const text = typeof value === "string" ? value : value === undefined ? "" : String(value);
  const plain = (type: string, limit: number, extra: Record<string, unknown> = {}) => (
    <input
      type={type}
      value={text}
      onChange={(e) => onChange(e.target.value.slice(0, limit))}
      placeholder={q.placeholder}
      aria-label={q.label}
      className={inputClass}
      {...extra}
    />
  );

  return (
    // A div, not a label: a label activates its first button, so tapping a yes/no
    // question's text would silently answer "Yes".
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-600">
        {q.label}
        {q.required && <span className="text-red-500"> *</span>}
      </span>
      {q.type === "boolean" ? (
        <div className="flex gap-2">
          {[true, false].map((b) => (
            <Choice key={String(b)} selected={value === b} accent={accent} onClick={() => onChange(b)}>
              <span className="text-sm font-semibold text-gray-800">{b ? "Yes" : "No"}</span>
            </Choice>
          ))}
        </div>
      ) : q.type === "select" ? (
        <select value={text} onChange={(e) => onChange(e.target.value)} aria-label={q.label} className={inputClass}>
          <option value="">{q.placeholder || "Choose…"}</option>
          {(q.options ?? []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : q.type === "multi_select" ? (
        <div className="grid gap-1 sm:grid-cols-2">
          {(q.options ?? []).map((o) => {
            const picked = Array.isArray(value) ? value : [];
            return (
              <label key={o} className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={picked.includes(o)}
                  onChange={(e) => onChange(e.target.checked ? [...picked, o] : picked.filter((x) => x !== o))}
                  className="h-4 w-4"
                  style={{ accentColor: accent }}
                />
                {o}
              </label>
            );
          })}
        </div>
      ) : q.type === "number" ? (
        <input
          value={text}
          onChange={(e) => {
            const raw = digitsOnly(e.target.value);
            onChange(raw === "" ? "" : Math.min(1_000_000_000, Number(raw)));
          }}
          inputMode="numeric"
          placeholder={q.placeholder || (v.min !== undefined ? String(v.min) : "0")}
          aria-label={q.label}
          className={inputClass}
        />
      ) : q.type === "date" ? (
        <input
          type="date"
          value={text}
          min={v.not_past ? today() : undefined}
          onChange={(e) => onChange(e.target.value)}
          aria-label={q.label}
          className={inputClass}
        />
      ) : q.type === "long_text" ? (
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value.slice(0, v.max_length ?? 2000))}
          rows={3}
          placeholder={q.placeholder}
          aria-label={q.label}
          className={`${inputClass} resize-y`}
        />
      ) : q.type === "email" ? (
        plain("email", 254, { autoComplete: "off", inputMode: "email" })
      ) : q.type === "phone" ? (
        plain("tel", 32, { inputMode: "tel" })
      ) : q.type === "link" ? (
        plain("url", 500, { inputMode: "url" })
      ) : (
        plain("text", v.max_length ?? 300)
      )}
    </div>
  );
};

const Card = ({ children }: { children: ReactNode }) => (
  <section className="rounded-2xl bg-white p-4 shadow-card sm:p-5">{children}</section>
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
