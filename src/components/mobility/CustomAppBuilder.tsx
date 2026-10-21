import { useRef, useState } from "react";
import { PhoneFrame } from "./PhoneFrame";
import { PreviewCanvas } from "./PreviewCanvas";
import { AppStatusCard } from "./AppStatusCard";
import { SalesContactCard } from "./SalesContactCard";
import { useMobilityAppAction, useSaveMobilityApp, useUploadAppImage } from "../../hooks/useMobility";
import {
  LAYOUTS,
  PALETTE_PRESETS,
  SCREENS,
  SECTION_TYPES,
  defaultConfig,
  type AppSection,
  type MobilityConfig,
  type ScreenId,
  type SectionType,
} from "../../lib/data/mobility";
import type { MobilityApp } from "../../service/partnerService";

/**
 * The custom app — the partner's own, in the stores under their name.
 *
 * Left is every decision, in panels that open one at a time so the column stays
 * short. Right is a canvas holding one phone per enabled screen, all rendered
 * live from the same config — which is the point of a canvas rather than a
 * single preview: brand decisions are judged across screens, not on the home
 * screen alone.
 *
 * Edits are a local draft over the saved config, dropped once saved. Images go
 * to S3 and only their URLs are kept, so a config stays small enough to save.
 * What the panels can't express is a conversation with sales, which is why the
 * contact card sits under them.
 */

const Panel = ({
  id, title, hint, open, onToggle, children,
}: {
  id: string; title: string; hint?: string; open: boolean;
  onToggle: (id: string) => void; children: React.ReactNode;
}) => (
  <section className="overflow-hidden rounded-2xl bg-white shadow-card">
    <button
      type="button"
      onClick={() => onToggle(id)}
      aria-expanded={open}
      className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-gray-800">{title}</span>
        {hint && <span className="mt-0.5 block truncate text-xs text-gray-400">{hint}</span>}
      </span>
      <i className={`ri-arrow-down-s-line shrink-0 text-lg text-gray-300 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div className="border-t border-gray-100 px-5 py-4">{children}</div>}
  </section>
);

const Toggle = ({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex cursor-pointer items-start gap-3 py-1.5">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#F14724]" />
    <span className="min-w-0">
      <span className="block text-sm font-medium text-gray-800">{label}</span>
      {hint && <span className="block text-xs text-gray-400">{hint}</span>}
    </span>
  </label>
);

export const CustomAppBuilder = ({
  app,
  partnerName,
  services,
  billableBlocked,
}: {
  app: MobilityApp | null;
  partnerName?: string;
  services: { id: number | string; name: string }[];
  billableBlocked: boolean;
}) => {
  const logoRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLInputElement>(null);
  const mediaTarget = useRef<string | null>(null);
  const [panel, setPanel] = useState<string | null>("brand");
  const save = useSaveMobilityApp();
  const act = useMobilityAppAction();
  const upload = useUploadAppImage();

  const saved: MobilityConfig = { ...defaultConfig(partnerName), ...(app?.config as Partial<MobilityConfig> | undefined) };
  const [draft, setDraft] = useState<MobilityConfig | null>(null);
  const config = draft ?? saved;
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(saved);

  const setConfig = (fn: (p: MobilityConfig) => MobilityConfig) => setDraft((d) => fn(d ?? saved));
  const set = <K extends keyof MobilityConfig>(key: K, value: MobilityConfig[K]) =>
    setConfig((p) => ({ ...p, [key]: value }));

  const togglePanel = (id: string) => setPanel((p) => (p === id ? null : id));

  const uploadImage = (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: "app_logo" | "app_media",
    onDone: (url: string) => void,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    upload.mutate({ kind, file }, { onSuccess: onDone });
  };

  const addSection = (type: SectionType) =>
    setConfig((p) => ({
      ...p,
      sections: [...p.sections, {
        id: `s${Date.now()}`, type,
        title: SECTION_TYPES.find((t) => t.type === type)?.label ?? "Section",
      }],
    }));

  const editSection = (id: string, patch: Partial<AppSection>) =>
    setConfig((p) => ({ ...p, sections: p.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));

  /**
   * What is still missing, and which panel fixes it. Named rather than counted
   * so the disabled button can say *why* — "one service short" is actionable,
   * a greyed-out button is not. The server checks the same four.
   */
  const missing = [
    config.appName.trim().length < 2 && { label: "an app name", panel: "brand" },
    config.services.length === 0 && { label: "a service", panel: "services" },
    !(config.platforms.ios || config.platforms.android) && { label: "a platform", panel: "platforms" },
    !Object.values(config.auth).some(Boolean) && { label: "a sign-in method", panel: "auth" },
  ].filter(Boolean) as { label: string; panel: string }[];

  const onSave = async () => {
    await save.mutateAsync({ product: "custom", config });
    setDraft(null);
  };

  const visibleScreens = SCREENS.filter((s) => s.always || config.screens[s.id]);

  return (
    <div className="flex flex-col gap-4 xl:flex-row">
      {/* Full width while the preview canvas is hidden; restore xl:w-[380px] xl:shrink-0 with it. */}
      <div className="flex w-full flex-col gap-3">
        <AppStatusCard
          product="custom"
          app={app}
          name={config.appName || partnerName || ""}
          dirty={dirty || !app}
          saving={save.isPending}
          onSave={onSave}
          missing={missing}
          onFix={setPanel}
          billableBlocked={billableBlocked}
          onAction={(action) => act.mutateAsync({ product: "custom", action })}
          acting={act.isPending}
        />

            <Panel id="layout" title="Layout" hint={LAYOUTS.find((l) => l.id === config.layout)?.label} open={panel === "layout"} onToggle={togglePanel}>
              <div className="space-y-2">
                {LAYOUTS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => set("layout", l.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                      config.layout === l.id ? "border-brand bg-orange-50" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: config.layout === l.id ? config.primary : "#f1f5f9" }}>
                      <i className={`${l.nav === "tabs" ? "ri-layout-bottom-2-line" : l.nav === "floating" ? "ri-more-line" : "ri-menu-line"} text-base ${config.layout === l.id ? "text-white" : "text-gray-400"}`} />
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-sm font-semibold ${config.layout === l.id ? "text-brand" : "text-gray-800"}`}>{l.label}</span>
                      <span className="block text-xs leading-4 text-gray-400">{l.blurb}</span>
                    </span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel id="brand" title="Brand" hint="Name, logo, colour" open={panel === "brand"} onToggle={togglePanel}>
              <label className="block">
                <span className="text-xs font-medium text-gray-500">App name</span>
                <input value={config.appName} onChange={(e) => set("appName", e.target.value)} placeholder="e.g. Ikeja Freight"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-orange-50" />
              </label>
              <label className="mt-3 block">
                <span className="text-xs font-medium text-gray-500">Tagline</span>
                <input value={config.tagline} onChange={(e) => set("tagline", e.target.value)} maxLength={40}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-orange-50" />
              </label>

              <div className="mt-4">
                <span className="text-xs font-medium text-gray-500">Logo</span>
                <div className="mt-1 flex items-center gap-3">
                  {config.logo_url ? (
                    <img src={config.logo_url} alt="" className="h-12 w-12 rounded-xl border border-gray-200 object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-300"><i className="ri-image-line text-lg" /></span>
                  )}
                  <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden"
                    onChange={(e) => uploadImage(e, "app_logo", (url) => set("logo_url", url))} />
                  <button type="button" onClick={() => logoRef.current?.click()} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    {config.logo_url ? "Replace" : "Upload"}
                  </button>
                  {config.logo_url && (
                    <button type="button" onClick={() => set("logo_url", null)} className="text-xs font-medium text-gray-400 hover:text-gray-700">Remove</button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <span className="text-xs font-medium text-gray-500">Palette</span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {PALETTE_PRESETS.map((p) => (
                    <button key={p.name} type="button"
                      onClick={() => setConfig((c) => ({ ...c, primary: p.primary, accent: p.accent }))}
                      className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        config.primary === p.primary ? "border-brand bg-orange-50 text-brand" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}>
                      <span className="flex">
                        <span className="h-3.5 w-3.5 rounded-l" style={{ background: p.primary }} />
                        <span className="h-3.5 w-3.5 rounded-r" style={{ background: p.accent }} />
                      </span>
                      {p.name}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-gray-600">Primary
                    <input type="color" value={config.primary} onChange={(e) => set("primary", e.target.value)} className="h-7 w-10 cursor-pointer rounded border border-gray-200 bg-white" />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-600">Accent
                    <input type="color" value={config.accent} onChange={(e) => set("accent", e.target.value)} className="h-7 w-10 cursor-pointer rounded border border-gray-200 bg-white" />
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <span className="text-xs font-medium text-gray-500">Appearance</span>
                <div className="mt-1.5 flex gap-2">
                  {(["light", "dark"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => set("theme", t)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                        config.theme === t ? "border-brand bg-orange-50 text-brand" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}>{t}</button>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel id="auth" title="Sign in" hint={Object.entries(config.auth).filter(([, v]) => v).map(([k]) => k).join(", ") || "None enabled"} open={panel === "auth"} onToggle={togglePanel}>
              <Toggle label="Google" hint="One tap on Android" checked={config.auth.google} onChange={(v) => set("auth", { ...config.auth, google: v })} />
              <Toggle label="Apple" hint="Apple requires this if you offer any other social sign-in" checked={config.auth.apple} onChange={(v) => set("auth", { ...config.auth, apple: v })} />
              <Toggle label="Email" hint="Address and password, or a magic link" checked={config.auth.email} onChange={(v) => set("auth", { ...config.auth, email: v })} />
              <Toggle label="Phone number" hint="OTP by SMS" checked={config.auth.phone} onChange={(v) => set("auth", { ...config.auth, phone: v })} />
            </Panel>

            <Panel id="screens" title="Screens" hint={`${visibleScreens.length} in the app`} open={panel === "screens"} onToggle={togglePanel}>
              {SCREENS.map((s) => (
                <Toggle key={s.id} label={s.label}
                  hint={s.always ? "Always included" : undefined}
                  checked={s.always ? true : config.screens[s.id]}
                  onChange={(v) => !s.always && set("screens", { ...config.screens, [s.id]: v })} />
              ))}
            </Panel>

            <Panel id="services" title="Services" hint={`${config.services.length} selected`} open={panel === "services"} onToggle={togglePanel}>
              {services.length === 0 ? (
                <p className="rounded-xl bg-gray-50 px-3 py-4 text-xs text-gray-500">
                  You have no registered services yet — add some before applying, so the app has something to sell.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {services.map((service) => {
                    const on = config.services.includes(service.name);
                    return (
                      <button key={service.id} type="button"
                        onClick={() => set("services", on ? config.services.filter((s) => s !== service.name) : [...config.services, service.name])}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          on ? "border-brand bg-orange-50 text-brand" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}>
                        {on && <i className="ri-check-line mr-1" />}{service.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </Panel>

            <Panel id="sections" title="Home sections" hint={`${config.sections.length} blocks`} open={panel === "sections"} onToggle={togglePanel}>
              <div className="space-y-2">
                {config.sections.map((section) => (
                  <div key={section.id} className="rounded-xl border border-gray-200 p-3">
                    <div className="flex items-center gap-2">
                      <i className={`${SECTION_TYPES.find((t) => t.type === section.type)?.icon} text-base text-gray-400`} />
                      <input value={section.title} onChange={(e) => editSection(section.id, { title: e.target.value })}
                        className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand" />
                      <button type="button" aria-label={`Remove ${section.title}`}
                        onClick={() => setConfig((p) => ({ ...p, sections: p.sections.filter((s) => s.id !== section.id) }))}
                        className="text-gray-300 hover:text-red-500"><i className="ri-delete-bin-line text-base" /></button>
                    </div>
                    {(section.type === "text" || section.type === "carousel") && (
                      <input value={section.body ?? ""} onChange={(e) => editSection(section.id, { body: e.target.value })}
                        placeholder={section.type === "text" ? "Body text" : "Promo caption"}
                        className="mt-2 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand" />
                    )}
                    {(section.type === "image" || section.type === "carousel") && (
                      <button type="button"
                        onClick={() => { mediaTarget.current = section.id; mediaRef.current?.click(); }}
                        className="mt-2 text-xs font-semibold text-brand hover:text-brand-hover">
                        <i className="ri-upload-2-line mr-1" />
                        {section.media?.length ? `${section.media.length} image${section.media.length === 1 ? "" : "s"} — add another` : "Upload an image"}
                      </button>
                    )}
                    {section.type === "video" && (
                      <input value={section.media?.[0] ?? ""} onChange={(e) => editSection(section.id, { media: [e.target.value] })}
                        placeholder="Video URL" className="mt-2 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand" />
                    )}
                  </div>
                ))}
              </div>
              <input ref={mediaRef} type="file" accept="image/png,image/jpeg" className="hidden"
                onChange={(e) => uploadImage(e, "app_media", (d) => {
                  const id = mediaTarget.current;
                  if (!id) return;
                  setConfig((p) => ({ ...p, sections: p.sections.map((s) => s.id === id ? { ...s, media: [...(s.media ?? []), d] } : s) }));
                })} />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {SECTION_TYPES.map((t) => (
                  <button key={t.type} type="button" onClick={() => addSection(t.type)} title={t.hint}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                    <i className={`${t.icon} text-sm`} />{t.label}
                  </button>
                ))}
              </div>
            </Panel>

            <Panel id="profile" title="Profile" hint={`${config.profileFields.filter((f) => f.enabled).length} fields shown`} open={panel === "profile"} onToggle={togglePanel}>
              <p className="mb-2 text-xs text-gray-400">What a customer sees about themselves.</p>
              {config.profileFields.map((f) => (
                <Toggle key={f.id} label={f.label} checked={f.enabled}
                  onChange={(v) => set("profileFields", config.profileFields.map((x) => x.id === f.id ? { ...x, enabled: v } : x))} />
              ))}
            </Panel>

            <Panel id="legal" title="Legal" hint="Privacy policy and terms" open={panel === "legal"} onToggle={togglePanel}>
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5">
                <i className="ri-error-warning-line mt-0.5 text-sm text-amber-600" />
                <p className="text-[11px] leading-4 text-amber-800">
                  The text below is a prompt, not a policy. Replace both before you publish — take
                  advice rather than copying another company's.
                </p>
              </div>
              <label className="mt-3 block">
                <span className="text-xs font-medium text-gray-500">Privacy policy</span>
                <textarea value={config.legal.privacy} onChange={(e) => set("legal", { ...config.legal, privacy: e.target.value })} rows={5}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs leading-5 outline-none focus:border-brand focus:ring-4 focus:ring-orange-50" />
              </label>
              <label className="mt-3 block">
                <span className="text-xs font-medium text-gray-500">Terms &amp; conditions</span>
                <textarea value={config.legal.terms} onChange={(e) => set("legal", { ...config.legal, terms: e.target.value })} rows={5}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs leading-5 outline-none focus:border-brand focus:ring-4 focus:ring-orange-50" />
              </label>
            </Panel>

            <Panel id="platforms" title="Platforms" hint={[config.platforms.ios && "iOS", config.platforms.android && "Android"].filter(Boolean).join(" + ") || "None"} open={panel === "platforms"} onToggle={togglePanel}>
              <div className="flex gap-2">
                {([["ios", "iOS", "ri-apple-fill"], ["android", "Android", "ri-android-fill"]] as const).map(([key, label, icon]) => (
                  <button key={key} type="button"
                    onClick={() => set("platforms", { ...config.platforms, [key]: !config.platforms[key] })}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                      config.platforms[key] ? "border-brand bg-orange-50 text-brand" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}>
                    <i className={`${icon} text-base`} />{label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-400">
                Sales quotes the one-time fee for the platforms you pick.
              </p>
            </Panel>

        <SalesContactCard
          body="Different screens, an integration, your own backend or anything the panels above don't cover — sales will scope it with you and quote it."
          topic={`a custom app${config.appName ? ` for ${config.appName}` : ""}`}
        />
      </div>

      {/* Preview canvas hidden for now — uncomment to bring it back.
      <div className="min-w-0 flex-1">
        <PreviewCanvas>
          <div className="flex items-start gap-8">
            {visibleScreens.map((s) => (
              <PhoneFrame key={s.id} config={config} screen={s.id as ScreenId} label={s.label} />
            ))}
          </div>
        </PreviewCanvas>
        {services.length === 0 && (
          <p className="mt-3 text-center text-[11px] leading-4 text-gray-400">
            You have no registered services yet — add one under Services and it will appear here.
          </p>
        )}
      </div>
      */}
    </div>
  );
};
