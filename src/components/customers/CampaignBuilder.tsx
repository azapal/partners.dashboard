import { useMemo, useState, type ReactNode } from "react";
import {
  useCreateEmailTemplate,
  useCustomers,
  useEmailEstimate,
  useEmailPreview,
  useEmailTemplates,
  useQuotePageLink,
  useSendEmailCampaign,
  useSendTestEmail,
  useUpdateEmailTemplate,
} from "../../hooks/useEmailCampaigns";
import {
  CAMPAIGN_TYPES,
  DEFAULT_THEME,
  campaignTypeLabel,
  draftFromTemplate,
  draftProblems,
  naira,
  previewContent,
  sendContent,
  starterDraft,
  useDebounced,
  type BuilderSeed,
  type BuilderStep,
  type EmailDraft,
} from "../../lib/emailDesign";
import { EmailApiError, type Customer, type EmailAudience, type EmailEstimate } from "../../service/partnerService";
import { BlockEditor } from "./BlockEditor";
import { EmailPreviewFrame } from "./EmailPreviewFrame";
import { KycNotice, customerStatus, useEscapeToClose } from "./shared";

/**
 * The full campaign builder: type → design → audience → review & send.
 *
 * Full-screen like CreateBranchDrawer — header, scrolling body, pinned footer —
 * because the design step wants the editor and a live preview side by side.
 * In template mode it stops after the design and saves instead of sending.
 *
 * The cost is estimated server-side and its total is sent back as
 * `confirm_total`, so a price that changed between looking and pressing Send
 * is refused rather than silently charged.
 */

const STEPS: { id: BuilderStep; label: string }[] = [
  { id: "type", label: "Type" },
  { id: "design", label: "Design" },
  { id: "audience", label: "Audience" },
  { id: "review", label: "Review & send" },
];

type Filter = { q: string; source: string; service: string };

export const CampaignBuilder = ({
  seed,
  onClose,
  onSent,
}: {
  seed: BuilderSeed;
  onClose: () => void;
  /** After a send is accepted — the screen switches to Campaigns. */
  onSent: () => void;
}) => {
  const templateMode = seed.mode === "template";
  const quoteLink = useQuotePageLink();
  const { data: templates = [] } = useEmailTemplates();
  const send = useSendEmailCampaign();
  const sendTest = useSendTestEmail();
  const createTemplate = useCreateEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();

  const steps = templateMode ? STEPS.slice(0, 2) : STEPS;
  const [step, setStep] = useState<BuilderStep>(seed.startAt ?? "type");
  const [draft, setDraft] = useState<EmailDraft>(() => seed.draft ?? starterDraft("promo", quoteLink));
  // A design nobody has touched yet follows the type picked; one they've edited
  // (or brought with them) is only replaced when they ask.
  const [pristine, setPristine] = useState(!seed.draft);
  const [tried, setTried] = useState<Partial<Record<BuilderStep, boolean>>>({});
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [mobilePane, setMobilePane] = useState<"edit" | "preview">("edit");
  const [confirming, setConfirming] = useState(false);

  // ── Audience ──
  const seedCustomers = seed.audience?.kind === "customers" ? seed.audience.customers : [];
  const [picked, setPicked] = useState<Customer[]>(seedCustomers);
  const [audienceMode, setAudienceMode] = useState<"customers" | "filter">(seed.audience?.kind === "customers" ? "customers" : "filter");
  const [filter, setFilter] = useState<Filter>(() => {
    const f = seed.audience?.kind === "filter" ? seed.audience.filter : {};
    return { q: f.q ?? "", source: f.source ?? "", service: f.service ?? "" };
  });
  const settledFilter = useDebounced(filter, 400);
  const audience: EmailAudience | null = useMemo(() => {
    if (templateMode) return null;
    if (audienceMode === "customers") return { mode: "customers", customer_ids: picked.map((c) => c.id) };
    const f: Record<string, string> = {};
    if (settledFilter.q.trim()) f.q = settledFilter.q.trim();
    if (settledFilter.source) f.source = settledFilter.source;
    if (settledFilter.service) f.service = settledFilter.service;
    return { mode: "filter", filter: f };
  }, [templateMode, audienceMode, picked, settledFilter]);
  const estimate = useEmailEstimate(audience);
  const est = estimate.data;
  const facets = useCustomers({ page: 1, page_size: 1 }).data;

  const content = previewContent(draft);
  // Same key as the preview frame's, so this rides on its request.
  const preview = useEmailPreview(useDebounced(content, 450));

  const update = (patch: Partial<EmailDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    if ("design" in patch || "subject" in patch) setPristine(false);
  };

  const problems = draftProblems(draft).filter((p) => !(templateMode && p.startsWith("Write a subject")));
  const audienceOk = !!est && est.recipients > 0 && !est.over_cap;
  const stepIndex = steps.findIndex((s) => s.id === step);

  const canLeave = (s: BuilderStep) => {
    if (s === "design") return problems.length === 0;
    if (s === "audience") return audienceOk;
    return true;
  };
  const goTo = (target: BuilderStep) => {
    const to = steps.findIndex((s) => s.id === target);
    // Backwards is always fine; forwards only past steps that are done.
    for (let i = stepIndex; i < to; i++) {
      if (!canLeave(steps[i].id)) {
        setTried((t) => ({ ...t, [steps[i].id]: true }));
        setStep(steps[i].id);
        return;
      }
    }
    setStep(target);
    setConfirming(false);
  };

  const pickType = (type: EmailDraft["campaign_type"]) => {
    if (pristine) setDraft({ ...starterDraft(type, quoteLink), name: draft.name && draft.name !== campaignTypeLabel(draft.campaign_type) ? draft.name : campaignTypeLabel(type) });
    else setDraft((d) => ({ ...d, campaign_type: type }));
  };

  const saveTemplate = (closeAfter: boolean) => {
    setTried((t) => ({ ...t, design: true }));
    if (problems.length || !draft.name.trim()) return;
    const payload = {
      name: draft.name.trim().slice(0, 120),
      campaign_type: draft.campaign_type,
      subject: draft.subject.trim(),
      preheader: draft.preheader.trim(),
      design: draft.design,
    };
    const done = { onSuccess: () => closeAfter && onClose() };
    if (templateMode && seed.templateId) updateTemplate.mutate({ id: seed.templateId, payload }, done);
    else createTemplate.mutate(payload, done);
  };

  const doSend = () => {
    if (!audience || !est) return;
    const one = audienceMode === "customers" && est.recipients === 1 ? picked.find((c) => c.emailable) : undefined;
    send.mutate(
      {
        payload: {
          name: draft.name.trim() || draft.subject.trim(),
          campaign_type: draft.campaign_type,
          ...sendContent(draft),
          template_id: draft.template_id,
          audience,
          confirm_total: est.total,
        },
        recipientName: one?.name.split(" ")[0],
      },
      {
        onSuccess: () => {
          onSent();
          onClose();
        },
        onError: (e) => {
          setConfirming(false);
          if (!(e instanceof EmailApiError)) return;
          if (e.field === "confirm_total" || e.field === "kyc" || e.field === "audience") estimate.refetch();
          if (e.field === "subject" || e.field === "design" || e.field?.startsWith("blocks.")) {
            setTried((t) => ({ ...t, design: true }));
            setStep("design");
          }
        },
      },
    );
  };

  useEscapeToClose(confirming ? () => setConfirming(false) : onClose, !send.isPending);

  const busySaving = createTemplate.isPending || updateTemplate.isPending;
  const title = templateMode ? (seed.templateId ? "Edit template" : "New template") : "New campaign";

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="builder-title" className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* ── Header ── */}
      <header className="flex shrink-0 flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 id="builder-title" className="text-lg font-bold text-gray-900 sm:text-xl">{title}</h2>
            <p className="truncate text-xs text-gray-500">{draft.name || "Untitled"} · {campaignTypeLabel(draft.campaign_type)}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 lg:hidden">
            <i className="ri-close-line text-xl" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <nav aria-label="Steps" className="-mx-1 flex overflow-x-auto px-1">
            <ol className="flex w-max items-center gap-1 rounded-xl bg-gray-50 p-1">
              {steps.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => goTo(s.id)}
                    aria-current={s.id === step ? "step" : undefined}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                      s.id === step ? "bg-white text-gray-900 shadow-card" : i < stepIndex ? "text-gray-600 hover:text-gray-900" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${s.id === step ? "bg-brand text-white" : i < stepIndex ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"}`}>
                      {i < stepIndex ? <i className="ri-check-line" /> : i + 1}
                    </span>
                    {/* On a phone only the current step is spelled out, so all four fit. */}
                    <span className={s.id === step ? "" : "hidden sm:inline"}>{s.label}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <button onClick={onClose} aria-label="Close" className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 lg:flex">
            <i className="ri-close-line text-xl" />
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/40">
        {step === "type" && (
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8">
            <Section title={templateMode ? "Template name" : "Campaign name"} hint="Only you see this.">
              <input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                maxLength={120}
                placeholder="e.g. December discount"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-400"
              />
            </Section>
            <Section title="What kind of email?" hint={pristine ? "Each starts you on a design you can change." : "Your design is kept — pick a starter below to replace it."}>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {CAMPAIGN_TYPES.map((t) => {
                  const on = draft.campaign_type === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => pickType(t.id)}
                      aria-pressed={on}
                      className={`flex flex-col items-start gap-2 rounded-2xl border-2 bg-white p-4 text-left transition-colors ${on ? "border-brand" : "border-transparent shadow-card hover:border-gray-200"}`}
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${on ? "bg-brand text-white" : "bg-orange-50 text-brand"}`}>
                        <i className={t.icon} />
                      </span>
                      <span className="text-sm font-bold text-gray-900">{t.label}</span>
                      <span className="text-xs leading-snug text-gray-500">{t.blurb}</span>
                    </button>
                  );
                })}
              </div>
              {!pristine && (
                <button type="button" onClick={() => { setDraft((d) => ({ ...starterDraft(d.campaign_type, quoteLink), name: d.name })); setPristine(true); }} className="mt-2 self-start text-xs font-semibold text-brand hover:text-brand-hover">
                  <i className="ri-refresh-line mr-1" />Replace my design with the {campaignTypeLabel(draft.campaign_type).toLowerCase()} starter
                </button>
              )}
            </Section>
            {templates.length > 0 && (
              <Section title="Or start from a saved template">
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { setDraft({ ...draftFromTemplate(t), template_id: templateMode ? null : t.id, name: templateMode ? `${t.name} (copy)` : t.name }); setPristine(false); setStep("design"); }}
                      className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-card hover:text-gray-900"
                    >
                      <i className="ri-layout-masonry-line text-brand" />{t.name}
                    </button>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}

        {step === "design" && (
          <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex rounded-xl bg-gray-100 p-1 lg:hidden">
              {(["edit", "preview"] as const).map((p) => (
                <button key={p} type="button" onClick={() => setMobilePane(p)} className={`flex-1 rounded-lg py-1.5 text-sm font-semibold capitalize ${mobilePane === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                  {p}
                </button>
              ))}
            </div>
            <div className={`min-w-0 flex-col gap-5 lg:flex ${mobilePane === "edit" ? "flex" : "hidden"}`}>
              <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card">
                <Labelled label="Subject" error={tried.design && !templateMode && !draft.subject.trim() ? "Write a subject line." : undefined}>
                  <input value={draft.subject} onChange={(e) => update({ subject: e.target.value })} maxLength={150} placeholder="What the inbox shows first" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-gray-400" />
                </Labelled>
                <Labelled label="Preheader" hint="The grey line after the subject in most inboxes">
                  <input value={draft.preheader} onChange={(e) => update({ preheader: e.target.value })} maxLength={150} placeholder="Optional" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-gray-400" />
                </Labelled>
                <p className="rounded-lg bg-orange-50/60 px-3 py-2 text-[11px] leading-relaxed text-gray-600">
                  <i className="ri-magic-line mr-1 text-brand" />
                  <code className="rounded bg-white px-1">{"{{first_name}}"}</code> and <code className="rounded bg-white px-1">{"{{name}}"}</code> in the subject or any text become each customer's name (“there” when we don't have it).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-card">
                <span className="text-xs font-semibold text-gray-700">Colours</span>
                {(["accent", "background", "text"] as const).map((k) => {
                  const value = draft.design.theme?.[k] ?? DEFAULT_THEME[k];
                  return (
                    <label key={k} className="flex items-center gap-2 text-xs capitalize text-gray-500">
                      <input type="color" value={value} onChange={(e) => update({ design: { ...draft.design, theme: { ...DEFAULT_THEME, ...draft.design.theme, [k]: e.target.value.toUpperCase() } } })} className="h-8 w-8 cursor-pointer rounded-lg border border-gray-200 bg-white p-0.5" />
                      {k}
                    </label>
                  );
                })}
              </div>

              <BlockEditor blocks={draft.design.blocks} onChange={(blocks) => update({ design: { ...draft.design, blocks } })} showProblems={!!tried.design} defaultLink={quoteLink} />
              <p className="text-[11px] text-gray-400">
                Your logo or name goes at the top, and your name, email and an unsubscribe link at the bottom — Azapal adds those to every email.
              </p>
            </div>

            <div className={`min-w-0 lg:block ${mobilePane === "preview" ? "block" : "hidden"}`}>
              <div className="flex flex-col gap-3 lg:sticky lg:top-6">
                <PreviewHeader device={device} setDevice={setDevice} />
                <EmailPreviewFrame content={content} device={device} minHeight={520} />
              </div>
            </div>
          </div>
        )}

        {step === "audience" && !templateMode && (
          <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-3">
              {picked.length > 0 && (
                <AudienceOption on={audienceMode === "customers"} onClick={() => setAudienceMode("customers")} icon="ri-user-follow-line" title={`The customers you picked (${picked.length.toLocaleString()})`}>
                  {audienceMode === "customers" && (
                    <div className="mt-3 flex max-h-64 flex-wrap gap-1.5 overflow-y-auto">
                      {picked.map((c) => (
                        <span key={c.id} title={customerStatus(c).why || c.email} className={`flex max-w-full items-center gap-1 rounded-full py-1 pl-2.5 pr-1 text-xs ${c.emailable ? "bg-orange-50 text-gray-800" : "bg-gray-100 text-gray-400"}`}>
                          <span className="truncate">{c.name}</span>
                          {!c.emailable && <span>· {customerStatus(c).label.toLowerCase()}</span>}
                          <button type="button" onClick={(e) => { e.stopPropagation(); setPicked((p) => p.filter((x) => x.id !== c.id)); }} aria-label={`Remove ${c.name}`} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white">
                            <i className="ri-close-line" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </AudienceOption>
              )}
              <AudienceOption on={audienceMode === "filter"} onClick={() => setAudienceMode("filter")} icon="ri-group-line" title="Everyone matching" subtitle="Leave it all blank to email every customer who can be emailed.">
                {audienceMode === "filter" && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-3" onClick={(e) => e.stopPropagation()}>
                    <input value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} placeholder="Name, email or phone" className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-400" />
                    <select value={filter.source} onChange={(e) => setFilter({ ...filter, source: e.target.value })} className="h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm outline-none" aria-label="Source">
                      <option value="">Every source</option>
                      {facets?.sources.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                    <select value={filter.service} onChange={(e) => setFilter({ ...filter, service: e.target.value })} className="h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm outline-none" aria-label="Service">
                      <option value="">Every service</option>
                      {facets?.services.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                )}
              </AudienceOption>
            </div>

            <EstimatePanel estimate={est} loading={estimate.isFetching} error={estimate.isError ? estimate.error?.message : undefined} showEmpty={!!tried.audience} />
          </div>
        )}

        {step === "review" && !templateMode && (
          <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="flex min-w-0 flex-col gap-4">
              {est?.kyc_blocked && <KycNotice />}
              <dl className="divide-y divide-gray-100 rounded-2xl bg-white shadow-card">
                <Row label="From" value={preview.data?.from ?? "…"} mono />
                <Row label="Reply-To" value={preview.data?.reply_to || "Your account email"} mono />
                <Row label="Subject" value={draft.subject} action={() => setStep("design")} />
                {draft.preheader && <Row label="Preheader" value={draft.preheader} action={() => setStep("design")} />}
                <Row label="Type" value={campaignTypeLabel(draft.campaign_type)} action={() => setStep("type")} />
                <Row
                  label="To"
                  value={est ? `${est.recipients.toLocaleString()} customer${est.recipients === 1 ? "" : "s"}` : "…"}
                  sub={est && est.no_email + est.unsubscribed > 0 ? `${(est.no_email + est.unsubscribed).toLocaleString()} skipped — no email or unsubscribed` : undefined}
                  action={() => setStep("audience")}
                />
                <Row label="Cost" value={est ? naira(est.total) : "…"} sub={est ? `${naira(est.unit_amount)} per email, billed for emails actually sent` : undefined} strong />
              </dl>
              {est?.over_cap && <CapWarning cap={est.cap} recipients={est.recipients} />}
              <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Check it in a real inbox</p>
                  <p className="text-xs text-gray-500">A free copy to your own email, marked [Test].</p>
                </div>
                <button
                  type="button"
                  onClick={() => sendTest.mutate(sendContent(draft))}
                  disabled={sendTest.isPending || problems.length > 0}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {sendTest.isPending ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-mail-send-line" />}
                  Send test to me
                </button>
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-3">
              <PreviewHeader device={device} setDevice={setDevice} />
              <EmailPreviewFrame content={content} device={device} minHeight={560} />
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── pinned, so the next step is always one tap away. */}
      {/* Right padding keeps the primary button clear of the assistant orb, which sits above everything. */}
      <footer className="shrink-0 border-t border-gray-100 bg-white py-3 pl-4 pr-20 sm:pl-8 sm:pr-24">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2">
          {stepIndex > 0 ? (
            <button type="button" onClick={() => setStep(steps[stepIndex - 1].id)} className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200">
              Back
            </button>
          ) : (
            <button type="button" onClick={onClose} className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200">
              Cancel
            </button>
          )}
          {step === "design" && tried.design && problems.length > 0 && (
            <p className="hidden min-w-0 flex-1 truncate text-xs text-red-500 sm:block">{problems.join(" ")}</p>
          )}
          {step === "audience" && <span className="hidden text-xs text-gray-500 sm:inline">{est ? `${est.recipients.toLocaleString()} recipients · ${naira(est.total)}` : ""}</span>}
          <div className="ml-auto flex items-center gap-2">
            {!templateMode && stepIndex >= 1 && (
              <button type="button" onClick={() => saveTemplate(false)} disabled={busySaving} className="hidden rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 sm:block">
                <i className="ri-bookmark-line mr-1" />Save as template
              </button>
            )}
            {templateMode && step === "design" ? (
              <PrimaryButton onClick={() => saveTemplate(true)} busy={busySaving} disabled={tried.design && (problems.length > 0 || !draft.name.trim())} icon="ri-save-3-line">
                Save template
              </PrimaryButton>
            ) : step === "review" ? (
              <PrimaryButton
                onClick={() => setConfirming(true)}
                busy={send.isPending}
                disabled={!est || !audienceOk || est.kyc_blocked || problems.length > 0}
                icon="ri-send-plane-2-line"
              >
                {est ? `Send ${est.recipients.toLocaleString()} email${est.recipients === 1 ? "" : "s"} · ${naira(est.total)}` : "Send"}
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={() => goTo(steps[stepIndex + 1].id)} icon="ri-arrow-right-line" iconRight>
                {steps[stepIndex + 1]?.label ?? "Next"}
              </PrimaryButton>
            )}
          </div>
        </div>
        {templateMode && tried.design && !draft.name.trim() && (
          <p className="mx-auto mt-2 max-w-7xl text-xs text-red-500">Give the template a name on the Type step.</p>
        )}
      </footer>

      {confirming && est && (
        <div className="fixed inset-0 z-[55] flex items-end justify-center bg-gray-900/40 p-0 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && !send.isPending && setConfirming(false)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-send-title" className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-xl text-brand"><i className="ri-send-plane-2-line" /></span>
            <h3 id="confirm-send-title" className="mt-4 text-lg font-bold text-gray-900">
              Send to {est.recipients.toLocaleString()} customer{est.recipients === 1 ? "" : "s"}?
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              “{draft.subject}” goes out now. You'll be billed <span className="font-semibold text-gray-900">{naira(est.total)}</span> ({naira(est.unit_amount)} per email) — only for emails that are actually sent.
            </p>
            <div className="mt-6 flex justify-end gap-2 pr-14 sm:pr-0">
              <button type="button" onClick={() => setConfirming(false)} disabled={send.isPending} className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200">
                Not yet
              </button>
              <PrimaryButton onClick={doSend} busy={send.isPending} icon="ri-send-plane-2-line">
                {send.isPending ? "Sending…" : `Send · ${naira(est.total)}`}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Pieces ──────────────────────────────────────────────────────────────────

const EstimatePanel = ({ estimate: e, loading, error, showEmpty }: { estimate?: EmailEstimate; loading: boolean; error?: string; showEmpty: boolean }) => (
  <div className="flex flex-col gap-3 self-start rounded-2xl bg-white p-5 shadow-card lg:sticky lg:top-6">
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Who it reaches</p>
      {loading && <i className="ri-loader-4-line animate-spin text-gray-400" />}
    </div>
    {error && !e ? (
      <p className="text-sm text-gray-500">Couldn't work out the audience — {error}</p>
    ) : !e ? (
      <p className="text-sm text-gray-400">Working it out…</p>
    ) : (
      <>
        <p className="text-3xl font-bold tabular-nums text-gray-900">
          {e.recipients.toLocaleString()} <span className="text-base font-semibold text-gray-500">email{e.recipients === 1 ? "" : "s"}</span>
        </p>
        <dl className="flex flex-col gap-1.5 text-sm">
          <Stat label="Customers selected" value={e.selected} />
          <Stat label="No email address" value={e.no_email} muted />
          <Stat label="Unsubscribed" value={e.unsubscribed} muted />
        </dl>
        <div className="flex items-baseline justify-between border-t border-gray-100 pt-3">
          <span className="text-sm text-gray-500">Cost at {naira(e.unit_amount)} each</span>
          <span className="text-xl font-bold text-gray-900">{naira(e.total)}</span>
        </div>
        {e.over_cap && <CapWarning cap={e.cap} recipients={e.recipients} />}
        {e.recipients === 0 && (
          <p className={`rounded-lg px-3 py-2 text-xs ${showEmpty ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"}`}>
            Nobody here can be emailed. Widen the filter or pick customers with an email address.
          </p>
        )}
        {e.kyc_blocked && <KycNotice />}
      </>
    )}
  </div>
);

const CapWarning = ({ cap, recipients }: { cap: number; recipients: number }) => (
  <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
    <i className="ri-error-warning-line mt-0.5" />
    That's {recipients.toLocaleString()} people — one send can reach up to {cap.toLocaleString()}. Narrow the filter (by service or source) or split it into two campaigns.
  </p>
);

const Stat = ({ label, value, muted }: { label: string; value: number; muted?: boolean }) => (
  <div className="flex justify-between">
    <dt className="text-gray-500">{label}</dt>
    <dd className={`tabular-nums ${muted && value > 0 ? "text-amber-600" : "text-gray-800"}`}>{value.toLocaleString()}</dd>
  </div>
);

const AudienceOption = ({ on, onClick, icon, title, subtitle, children }: { on: boolean; onClick: () => void; icon: string; title: string; subtitle?: string; children?: ReactNode }) => (
  <div
    role="radio"
    aria-checked={on}
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && e.target === e.currentTarget && onClick()}
    className={`cursor-pointer rounded-2xl border-2 bg-white p-4 transition-colors ${on ? "border-brand" : "border-transparent shadow-card hover:border-gray-200"}`}
  >
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-brand" : "border-gray-300"}`}>
        {on && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900"><i className={`${icon} text-gray-400`} />{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        {children}
      </div>
    </div>
  </div>
);

const PreviewHeader = ({ device, setDevice }: { device: "desktop" | "mobile"; setDevice: (d: "desktop" | "mobile") => void }) => (
  <div className="flex items-center justify-between">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Preview · as Ada Obi sees it</p>
    <div className="flex rounded-lg bg-gray-100 p-0.5">
      {(["desktop", "mobile"] as const).map((d) => (
        <button key={d} type="button" onClick={() => setDevice(d)} aria-pressed={device === d} aria-label={`${d} width`} className={`flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold capitalize ${device === d ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
          <i className={d === "desktop" ? "ri-computer-line" : "ri-smartphone-line"} />
          <span className="hidden sm:inline">{d}</span>
        </button>
      ))}
    </div>
  </div>
);

const Row = ({ label, value, sub, action, mono, strong }: { label: string; value: string; sub?: string; action?: () => void; mono?: boolean; strong?: boolean }) => (
  <div className="flex items-start gap-3 px-4 py-3">
    <dt className="w-20 shrink-0 pt-0.5 text-xs font-semibold text-gray-400">{label}</dt>
    <dd className="min-w-0 flex-1">
      <p className={`break-words ${mono ? "font-mono text-xs text-gray-700" : strong ? "text-base font-bold text-gray-900" : "text-sm text-gray-800"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </dd>
    {action && (
      <button type="button" onClick={action} className="shrink-0 text-xs font-semibold text-brand hover:text-brand-hover">Edit</button>
    )}
  </div>
);

const Section = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <section className="flex flex-col gap-2">
    <div>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
    {children}
  </section>
);

const Labelled = ({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-700">
      {label}
      {hint && <span className="ml-1.5 font-normal text-gray-400">{hint}</span>}
    </label>
    {children}
    {error && <p className="text-[11px] text-red-500">{error}</p>}
  </div>
);

const PrimaryButton = ({ onClick, busy, disabled, icon, iconRight, children }: { onClick: () => void; busy?: boolean; disabled?: boolean; icon: string; iconRight?: boolean; children: ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy || disabled}
    className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
  >
    {busy ? <i className="ri-loader-4-line animate-spin" /> : !iconRight && <i className={icon} />}
    {children}
    {!busy && iconRight && <i className={icon} />}
  </button>
);
