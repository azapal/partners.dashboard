import { useState } from "react";
import { useCreateEmailTemplate, useDeleteEmailTemplate, useEmailTemplates } from "../../hooks/useEmailCampaigns";
import { campaignTypeLabel, draftFromTemplate, type BuilderSeed } from "../../lib/emailDesign";
import type { EmailTemplate } from "../../service/partnerService";
import { EmailPreviewFrame } from "./EmailPreviewFrame";
import { whenShort } from "./shared";

/** Saved designs, to start a campaign (or a quick email) from. */
export const TemplatesTab = ({ onOpen, onUse }: { onOpen: (seed: BuilderSeed) => void; onUse: (seed: BuilderSeed) => void }) => {
  const { data: templates = [], isPending, isError, error, refetch } = useEmailTemplates();
  const duplicate = useCreateEmailTemplate("Template duplicated.");
  const remove = useDeleteEmailTemplate();
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const newTemplate = () => onOpen({ mode: "template" });

  if (isPending || isError) {
    return (
      <div className="rounded-2xl bg-white py-16 text-center shadow-card">
        {isError ? (
          <>
            <p className="text-sm text-gray-500">Couldn't load your templates{error?.message ? ` — ${error.message}` : "."}</p>
            <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-semibold text-brand hover:text-brand-hover">Try again</button>
          </>
        ) : (
          <p className="text-sm text-gray-400"><i className="ri-loader-4-line mr-1 animate-spin" />Loading templates…</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <button
        type="button"
        onClick={newTemplate}
        className="flex min-h-[18rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-white text-sm font-semibold text-gray-500 transition-colors hover:border-brand hover:text-brand"
      >
        <i className="ri-add-line text-2xl" />
        New template
        <span className="max-w-[14rem] text-center text-xs font-normal text-gray-400">Design once, reuse for every campaign.</span>
      </button>

      {templates.map((t) => (
        <article key={t.id} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-card">
          <button type="button" onClick={() => onOpen(editSeed(t))} className="relative h-56 overflow-hidden bg-[#F4F5F7]" aria-label={`Edit ${t.name}`}>
            {/* A 600px-wide email shown at half size. */}
            <div className="pointer-events-none absolute left-1/2 top-0 w-[600px] origin-top -translate-x-1/2 scale-50">
              <EmailPreviewFrame content={{ subject: t.subject || t.name, preheader: t.preheader, design: t.design }} fixedHeight={460} />
            </div>
            <span className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent" />
          </button>
          <div className="flex flex-1 flex-col gap-1 px-4 pb-3 pt-2">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate font-semibold text-gray-900">{t.name}</p>
              <span className="shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-brand">{campaignTypeLabel(t.campaign_type)}</span>
            </div>
            <p className="truncate text-xs text-gray-500">{t.subject || "No subject yet"}</p>
            <p className="text-[11px] text-gray-400">Updated {whenShort(t.updated_at ?? t.created_at)}</p>
            {confirmDelete === t.id ? (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs">
                <span className="text-red-700">Delete “{t.name}”?</span>
                <span className="flex gap-3 font-semibold">
                  <button type="button" onClick={() => setConfirmDelete(null)} className="text-gray-500">Keep</button>
                  <button type="button" disabled={remove.isPending} onClick={() => remove.mutate(t.id, { onSettled: () => setConfirmDelete(null) })} className="text-red-600">
                    {remove.isPending ? "Deleting…" : "Delete"}
                  </button>
                </span>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-1 border-t border-gray-50 pt-2">
                <button type="button" onClick={() => onUse({ mode: "campaign", draft: draftFromTemplate(t), startAt: "audience" })} className="mr-auto rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover">
                  Use
                </button>
                <ActionButton icon="ri-edit-line" label="Edit" onClick={() => onOpen(editSeed(t))} />
                <ActionButton
                  icon="ri-file-copy-line"
                  label="Duplicate"
                  disabled={duplicate.isPending}
                  onClick={() => duplicate.mutate({ name: `${t.name} (copy)`.slice(0, 120), campaign_type: t.campaign_type, subject: t.subject, preheader: t.preheader, design: t.design })}
                />
                <ActionButton icon="ri-delete-bin-6-line" label="Delete" onClick={() => setConfirmDelete(t.id)} danger />
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
};

const editSeed = (t: EmailTemplate): BuilderSeed => ({ mode: "template", templateId: t.id, draft: { ...draftFromTemplate(t), template_id: null }, startAt: "design" });

const ActionButton = ({ icon, label, onClick, disabled, danger }: { icon: string; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    className={`flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 disabled:opacity-40 ${danger ? "hover:bg-red-50 hover:text-red-500" : "hover:bg-gray-100 hover:text-gray-700"}`}
  >
    <i className={icon} />
  </button>
);
