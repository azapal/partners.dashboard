import { useRef, useState } from "react";
import { PhoneFrame } from "./PhoneFrame";
import { PreviewCanvas } from "./PreviewCanvas";
import { AppStatusCard } from "./AppStatusCard";
import { useMobilityAppAction, useSaveMobilityApp, useUploadAppImage } from "../../hooks/useMobility";
import {
  PALETTE_PRESETS,
  defaultWhiteLabel,
  whiteLabelPreview,
  type ScreenId,
  type WhiteLabelConfig,
} from "../../lib/data/mobility";
import type { MobilityApp } from "../../service/partnerService";

/**
 * The white-labelled Azapal app: logo and colours, nothing else.
 *
 * Edits are held as a local draft over the saved config, and the draft is
 * dropped once saved — so "unsaved changes" is just "is there a draft", with no
 * effect syncing server state into the form.
 */

const PREVIEW_SCREENS: { id: ScreenId; label: string }[] = [
  { id: "splash", label: "Splash" },
  { id: "signin", label: "Sign in" },
  { id: "home", label: "Home" },
  { id: "book", label: "Booking" },
  { id: "track", label: "Tracking" },
];

export const WhiteLabelConfigurator = ({
  app,
  partnerName,
  services,
  billableBlocked,
}: {
  app: MobilityApp | null;
  partnerName?: string;
  services: string[];
  billableBlocked: boolean;
}) => {
  const logoRef = useRef<HTMLInputElement>(null);
  const save = useSaveMobilityApp();
  const act = useMobilityAppAction();
  const upload = useUploadAppImage();
  const [draft, setDraft] = useState<WhiteLabelConfig | null>(null);

  const saved: WhiteLabelConfig = { ...defaultWhiteLabel(partnerName), ...(app?.config as Partial<WhiteLabelConfig> | undefined) };
  const config = draft ?? saved;
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(saved);
  const set = <K extends keyof WhiteLabelConfig>(key: K, value: WhiteLabelConfig[K]) =>
    setDraft({ ...config, [key]: value });

  const missing = [
    !config.logo_url && { label: "your logo" },
    config.display_name.trim().length < 2 && { label: "a display name" },
  ].filter(Boolean) as { label: string }[];

  const onSave = async () => {
    await save.mutateAsync({ product: "white_label", config });
    setDraft(null);
  };

  const preview = whiteLabelPreview(config, services);

  return (
    <div className="flex flex-col gap-4 xl:flex-row">
      {/* Full width while the preview canvas is hidden; restore xl:w-[380px] xl:shrink-0 with it. */}
      <div className="flex w-full flex-col gap-3">
        <AppStatusCard
          product="white_label"
          app={app}
          name={config.display_name || partnerName || ""}
          dirty={dirty || !app}
          saving={save.isPending}
          onSave={onSave}
          missing={missing}
          billableBlocked={billableBlocked}
          onAction={(action) => act.mutateAsync({ product: "white_label", action })}
          acting={act.isPending}
        />

        <section className="rounded-2xl bg-white p-5 shadow-card">
          <h3 className="text-sm font-semibold text-gray-800">Your brand</h3>
          <p className="mt-0.5 text-xs text-gray-400">
            Your customers book and track in the Azapal app, under your name and colours.
          </p>

          <label className="mt-4 block">
            <span className="text-xs font-medium text-gray-500">Display name</span>
            <input
              value={config.display_name}
              onChange={(e) => set("display_name", e.target.value)}
              maxLength={40}
              placeholder="e.g. Ikeja Freight"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-orange-50"
            />
          </label>

          <div className="mt-4">
            <span className="text-xs font-medium text-gray-500">Logo</span>
            <div className="mt-1 flex items-center gap-3">
              {config.logo_url ? (
                <img src={config.logo_url} alt="" className="h-12 w-12 rounded-xl border border-gray-200 object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-300">
                  <i className="ri-image-line text-lg" />
                </span>
              )}
              <input
                ref={logoRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) upload.mutate({ kind: "app_logo", file }, { onSuccess: (url) => set("logo_url", url) });
                }}
              />
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                disabled={upload.isPending}
                className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:text-gray-300"
              >
                {upload.isPending ? "Uploading…" : config.logo_url ? "Replace" : "Upload"}
              </button>
              {config.logo_url && (
                <button type="button" onClick={() => set("logo_url", null)} className="text-xs font-medium text-gray-400 hover:text-gray-700">
                  Remove
                </button>
              )}
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400">Square PNG or SVG works best, up to 2MB. Until you add one, the Azapal logo is used.</p>
          </div>

          <div className="mt-4">
            <span className="text-xs font-medium text-gray-500">Colours</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {PALETTE_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setDraft({ ...config, primary: p.primary, accent: p.accent })}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    config.primary === p.primary && config.accent === p.accent
                      ? "border-brand bg-orange-50 text-brand"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex">
                    <span className="h-3.5 w-3.5 rounded-l" style={{ background: p.primary }} />
                    <span className="h-3.5 w-3.5 rounded-r" style={{ background: p.accent }} />
                  </span>
                  {p.name}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-4">
              <label className="flex items-center gap-2 text-xs text-gray-600">
                Primary
                <input type="color" value={config.primary} onChange={(e) => set("primary", e.target.value)} className="h-7 w-10 cursor-pointer rounded border border-gray-200 bg-white" />
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600">
                Accent
                <input type="color" value={config.accent} onChange={(e) => set("accent", e.target.value)} className="h-7 w-10 cursor-pointer rounded border border-gray-200 bg-white" />
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* Preview canvas hidden for now — uncomment to bring it back.
      <div className="min-w-0 flex-1">
        <PreviewCanvas>
          <div className="flex items-start gap-8">
            {PREVIEW_SCREENS.map((s) => (
              <PhoneFrame key={s.id} config={preview} screen={s.id} label={s.label} />
            ))}
          </div>
        </PreviewCanvas>
        <p className="mt-3 text-center text-[11px] leading-4 text-gray-400">
          An impression of the Azapal app with your brand applied — layout and screens are Azapal's.
        </p>
      </div>
      */}
    </div>
  );
};
