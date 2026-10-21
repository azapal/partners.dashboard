import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  useEmailEstimate,
  useEmailTemplates,
  useQuotePageLink,
  useSendEmailCampaign,
} from "../../hooks/useEmailCampaigns";
import {
  DEFAULT_THEME,
  blockProblem,
  draftProblems,
  firstName,
  previewContent,
  type BuilderSeed,
  type EmailDraft,
} from "../../lib/emailDesign";
import { EmailApiError, type Customer, type EmailBlock, type EmailTemplate } from "../../service/partnerService";
import { EmailPreviewFrame } from "./EmailPreviewFrame";
import { CostLine, KycNotice, customerStatus, useEscapeToClose } from "./shared";

/**
 * The quick way to email one customer, or a handful: a subject, a message, an
 * optional button. Anything more — images, a design, a big audience — is the
 * campaign builder, and "Open full editor" carries what's written here across.
 *
 * Under the hood it's still a campaign of one (or a few), so it's billed and
 * logged like any other and shows up under Campaigns.
 */
export const ComposeEmailModal = ({
  customers,
  onClose,
  onOpenEditor,
}: {
  customers: Customer[];
  onClose: () => void;
  onOpenEditor: (seed: BuilderSeed) => void;
}) => {
  const quoteLink = useQuotePageLink();
  const { data: templates = [] } = useEmailTemplates();
  const send = useSendEmailCampaign();

  const [to, setTo] = useState(customers);
  const [subject, setSubject] = useState("");
  const [heading, setHeading] = useState("");
  const [message, setMessage] = useState("Hi {{first_name}},\n\n");
  const [button, setButton] = useState<{ label: string; url: string } | null>(null);
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [tried, setTried] = useState(false);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEscapeToClose(onClose, !send.isPending);

  const emailable = to.filter((c) => c.emailable);
  const audience = useMemo(() => ({ mode: "customers" as const, customer_ids: to.map((c) => c.id) }), [to]);
  const estimate = useEmailEstimate(to.length ? audience : null);

  const blocks: EmailBlock[] = template
    ? template.design.blocks
    : [
        ...(heading.trim() ? [{ type: "heading", text: heading, align: "left" } as EmailBlock] : []),
        ...(message.trim() && message.trim() !== "Hi {{first_name}}," ? [{ type: "text", text: message.trim(), align: "left" } as EmailBlock] : []),
        ...(button ? [{ type: "button", label: button.label, url: button.url, align: "left" } as EmailBlock] : []),
      ];
  const draft: EmailDraft = {
    name: emailable.length === 1 ? `Email to ${emailable[0].name}` : subject,
    campaign_type: template?.campaign_type ?? "update",
    subject,
    preheader: template?.preheader ?? "",
    design: { theme: { ...DEFAULT_THEME, ...template?.design.theme }, blocks },
    template_id: template?.id ?? null,
  };
  const problems = draftProblems(draft);
  const buttonProblem = button ? blockProblem({ type: "button", ...button }) : null;
  const est = estimate.data;
  const canSend =
    problems.length === 0 && !!est && est.recipients > 0 && !est.kyc_blocked && !est.over_cap && !send.isPending;

  const insertToken = () => {
    const el = messageRef.current;
    const token = "{{first_name}}";
    if (!el) return setMessage((m) => m + token);
    const [a, b] = [el.selectionStart, el.selectionEnd];
    setMessage((m) => m.slice(0, a) + token + m.slice(b));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + token.length, a + token.length);
    });
  };

  const pickTemplate = (id: string) => {
    const t = templates.find((x) => String(x.id) === id) ?? null;
    setTemplate(t);
    if (t?.subject && !subject.trim()) setSubject(t.subject);
  };

  const submit = () => {
    setTried(true);
    if (!canSend || !est) return;
    send.mutate(
      {
        payload: {
          name: draft.name.slice(0, 120),
          campaign_type: draft.campaign_type,
          subject: subject.trim(),
          preheader: draft.preheader,
          design: draft.design,
          template_id: draft.template_id,
          audience,
          confirm_total: est.total,
        },
        recipientName: emailable.length === 1 ? firstName(emailable[0].name) : undefined,
      },
      {
        onSuccess: onClose,
        onError: (e) => {
          if (e instanceof EmailApiError && e.field === "confirm_total") estimate.refetch();
        },
      },
    );
  };

  const openEditor = () =>
    onOpenEditor({
      mode: "campaign",
      draft: {
        ...draft,
        name: draft.name || subject,
        // An empty compose still opens on something to edit.
        design: blocks.length ? draft.design : { theme: DEFAULT_THEME, blocks: [{ type: "text", text: message || "Hi {{first_name}},", align: "left" }] },
      },
      audience: { kind: "customers", customers: to },
      startAt: "design",
    });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/40 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && !send.isPending && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="compose-title" className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 id="compose-title" className="text-base font-bold text-gray-900">New email</h2>
            <p className="truncate text-xs text-gray-500">Sent through Azapal under your name — replies come straight to you.</p>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setShowPreview((v) => !v)} className="flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 lg:hidden">
              <i className={showPreview ? "ri-edit-line" : "ri-eye-line"} /> {showPreview ? "Edit" : "Preview"}
            </button>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
              <i className="ri-close-line text-xl" />
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:overflow-hidden">
          {/* ── Form ── */}
          <div className={`flex-col gap-4 px-4 py-4 sm:px-6 lg:flex lg:overflow-y-auto ${showPreview ? "hidden" : "flex"}`}>
            <Field label="To">
              <div className="flex flex-wrap gap-1.5 rounded-xl border border-gray-200 px-2 py-2">
                {to.map((c) => {
                  const s = customerStatus(c);
                  return (
                    <span
                      key={c.id}
                      title={s.why || c.email}
                      className={`flex max-w-full items-center gap-1 rounded-full py-1 pl-2.5 pr-1 text-xs ${
                        c.emailable ? "bg-orange-50 text-gray-800" : "bg-gray-100 text-gray-400 line-through decoration-gray-300"
                      }`}
                    >
                      <span className="truncate font-semibold">{c.name}</span>
                      <span className={`truncate ${c.emailable ? "text-gray-500" : ""}`}>{c.email || "no email"}</span>
                      {!c.emailable && <span className="no-underline">· {s.label.toLowerCase()}</span>}
                      {to.length > 1 && (
                        <button type="button" onClick={() => setTo((t) => t.filter((x) => x.id !== c.id))} aria-label={`Remove ${c.name}`} className="flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:bg-white hover:text-gray-700">
                          <i className="ri-close-line" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
              {to.some((c) => !c.emailable) && (
                <p className="text-[11px] text-gray-400">Greyed-out customers have no email or unsubscribed — they're skipped and not charged.</p>
              )}
            </Field>

            {templates.length > 0 && (
              <Field label="Start from template">
                <select
                  value={template?.id ?? ""}
                  onChange={(e) => pickTemplate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-400"
                >
                  <option value="">No template — write a message</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Subject">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={150}
                placeholder="e.g. Your move on Saturday"
                className={`h-10 w-full rounded-xl border px-3 text-sm outline-none focus:border-gray-400 ${tried && !subject.trim() ? "border-red-300" : "border-gray-200"}`}
              />
              {tried && !subject.trim() && <p className="text-[11px] text-red-500">Write a subject line.</p>}
            </Field>

            {template ? (
              <div className="flex items-start gap-3 rounded-xl bg-gray-50 px-4 py-3">
                <i className="ri-layout-masonry-line mt-0.5 text-lg text-brand" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800">Using “{template.name}”</p>
                  <p className="text-xs text-gray-500">{template.design.blocks.length} blocks. Change the words or pictures in the full editor.</p>
                  <div className="mt-2 flex gap-3 text-xs font-semibold">
                    <button type="button" onClick={openEditor} className="text-brand hover:text-brand-hover">Edit in full editor</button>
                    <button type="button" onClick={() => setTemplate(null)} className="text-gray-500 hover:text-gray-800">Write a message instead</button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Field label="Heading" hint="Optional">
                  <input
                    value={heading}
                    onChange={(e) => setHeading(e.target.value)}
                    maxLength={150}
                    placeholder="e.g. Your quote is ready"
                    className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                  />
                </Field>
                <Field
                  label="Message"
                  action={
                    <button type="button" onClick={insertToken} className="text-[11px] font-semibold text-brand hover:text-brand-hover">
                      + Insert first name
                    </button>
                  }
                >
                  <textarea
                    ref={messageRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={7}
                    maxLength={3000}
                    className="w-full resize-y rounded-xl border border-gray-200 px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-gray-400"
                  />
                  <p className="text-[11px] text-gray-400">
                    <code className="rounded bg-gray-100 px-1">{"{{first_name}}"}</code> becomes each customer's first name — “there” when we don't know it.
                  </p>
                </Field>

                {button ? (
                  <div className="flex flex-col gap-2 rounded-xl border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700"><i className="ri-cursor-line mr-1" />Button</span>
                      <button type="button" onClick={() => setButton(null)} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[1fr_1.6fr]">
                      <input value={button.label} maxLength={40} onChange={(e) => setButton({ ...button, label: e.target.value })} placeholder="Label" className="h-9 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-gray-400" />
                      <input value={button.url} onChange={(e) => setButton({ ...button, url: e.target.value })} placeholder="https://… , mailto: or tel:" className="h-9 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-gray-400" />
                    </div>
                    {buttonProblem && (tried || button.url) && <p className="text-[11px] text-red-500">{buttonProblem}</p>}
                    {quoteLink && button.url !== quoteLink && (
                      <button type="button" onClick={() => setButton({ ...button, url: quoteLink })} className="self-start text-[11px] font-semibold text-brand">
                        Use my quote page link
                      </button>
                    )}
                  </div>
                ) : (
                  <button type="button" onClick={() => setButton({ label: "Get a quote", url: quoteLink })} className="flex items-center gap-1.5 self-start rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-gray-400 hover:text-gray-800">
                    <i className="ri-add-line" /> Add button
                  </button>
                )}
              </>
            )}

            {est?.kyc_blocked && <KycNotice />}
          </div>

          {/* ── Preview ── */}
          <div className={`flex-col gap-2 border-gray-100 bg-gray-50/70 px-4 py-4 sm:px-6 lg:flex lg:overflow-y-auto lg:border-l ${showPreview ? "flex" : "hidden"}`}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Preview{emailable[0] ? ` · as ${firstName(emailable[0].name)} sees it` : ""}
            </p>
            <EmailPreviewFrame content={blocks.length ? { ...previewContent(draft), sample_name: emailable[0]?.name } : null} minHeight={460} />
          </div>
        </div>

        <footer className="flex shrink-0 flex-col gap-2 border-t border-gray-100 py-3 pl-4 pr-20 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <CostLine estimate={est} loading={estimate.isFetching} />
          <div className="flex items-center gap-2">
            <button type="button" onClick={openEditor} className="mr-auto rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 sm:mr-0">
              <i className="ri-layout-masonry-line mr-1" />Open full editor
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={send.isPending || (tried && !canSend)}
              className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
              {send.isPending ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-send-plane-2-line" />}
              {send.isPending ? "Sending…" : emailable.length > 1 ? `Send ${emailable.length} emails` : "Send"}
            </button>
          </div>
        </footer>
        {tried && problems.length > 0 && !problems.every((p) => p === "Write a subject line.") && (
          <p className="border-t border-red-50 bg-red-50/60 px-6 py-2 text-[11px] text-red-600">{problems.filter((p) => p !== "Write a subject line.").join(" ")}</p>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, hint, action, children }: { label: string; hint?: string; action?: ReactNode; children: ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between">
      <label className="text-xs font-semibold text-gray-700">
        {label}
        {hint && <span className="ml-1 font-normal text-gray-400">{hint}</span>}
      </label>
      {action}
    </div>
    {children}
  </div>
);
