import { useRef, useState } from 'react';
import { DefaultModal } from './DefaultModal';
import {
  useDocumentBranding,
  useResetBranding,
  useUpdateBranding,
  useUploadBrandingAsset,
} from '../../hooks/useBranding';
import { DOCUMENT_TEMPLATE_LIST, DOCUMENT_TEMPLATES } from '../../lib/data/documentTemplates';
import type { DocumentTemplateKey } from '../../service/partnerService';

/**
 * Editor for how this partner's invoices and receipts look.
 *
 * Artwork uploads as soon as it's chosen — an image sitting in local state that
 * only reaches S3 on save is a whole class of "my logo disappeared" bug — but the
 * *settings* only persist when Save is pressed, so a half-finished change can be
 * abandoned.
 */
export const DocumentBrandingModal = ({ onClose }: { onClose: () => void }) => {
  const { data: branding } = useDocumentBranding();
  const update = useUpdateBranding();
  const reset = useResetBranding();
  const upload = useUploadBrandingAsset();

  const logoInput = useRef<HTMLInputElement>(null);
  const watermarkInput = useRef<HTMLInputElement>(null);

  const [template, setTemplate] = useState<DocumentTemplateKey>(branding?.template ?? 'plain');
  const [logoUrl, setLogoUrl] = useState<string | null>(branding?.logo_url ?? null);
  const [watermarkUrl, setWatermarkUrl] = useState<string | null>(branding?.watermark_url ?? null);
  const [opacity, setOpacity] = useState(branding?.watermark_opacity ?? 8);
  const [accent, setAccent] = useState(branding?.accent_color ?? '');
  const [footer, setFooter] = useState(branding?.footer_note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<'logo' | 'watermark' | null>(null);

  const preset = DOCUMENT_TEMPLATES[template];
  const effectiveAccent = accent || preset.accent;

  const handleFile = (kind: 'logo' | 'watermark', file?: File) => {
    if (!file) return;
    setError(null);
    setUploading(kind);
    upload.mutate(
      { kind, file },
      {
        onSuccess: (url) => (kind === 'logo' ? setLogoUrl(url) : setWatermarkUrl(url)),
        onError: (e: any) => setError(e.message || 'The upload failed'),
        onSettled: () => setUploading(null),
      },
    );
  };

  const handleSave = () => {
    setError(null);
    update.mutate(
      {
        template,
        logo_url: logoUrl,
        watermark_url: watermarkUrl,
        watermark_opacity: opacity,
        accent_color: accent || null,
        footer_note: footer.trim() || null,
      },
      { onSuccess: onClose, onError: (e: any) => setError(e.message || 'Could not save') },
    );
  };

  return (
    <DefaultModal
      isOpen
      onClose={onClose}
      title="Document design"
      subtitle="Applies to every invoice and receipt you issue"
      maxWidthClassName="max-w-2xl"
    >
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Azapal designs</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DOCUMENT_TEMPLATE_LIST.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setTemplate(option.key)}
                className={`text-left rounded-xl border p-2.5 transition-colors ${
                  template === option.key ? 'border-brand bg-orange-50/60' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {/* A miniature of the letterhead treatment, so the choice is visible
                    rather than guessed from a name. */}
                <div className="h-10 rounded-md border border-gray-100 overflow-hidden mb-2 bg-white">
                  {option.header === 'band' ? (
                    <div className="h-3.5 w-full" style={{ backgroundColor: option.accent }} />
                  ) : (
                    <div className="h-3.5 w-full border-b-2" style={{ borderBottomColor: option.accent }} />
                  )}
                  <div className="p-1 space-y-1">
                    <div className="h-1 w-2/3 rounded bg-gray-200" />
                    <div className="h-1 w-1/2 rounded bg-gray-100" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-900">{option.name}</p>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">{preset.description}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Logo</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-14 w-24 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="max-h-full max-w-full object-contain" />
                ) : (
                  <i className="ri-image-line text-gray-300 text-xl" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => logoInput.current?.click()}
                  disabled={uploading === 'logo'}
                  className="text-sm font-semibold text-brand hover:text-brand-hover disabled:opacity-50"
                >
                  {uploading === 'logo' ? 'Uploading…' : logoUrl ? 'Replace' : 'Upload'}
                </button>
                {logoUrl && (
                  <button type="button" onClick={() => setLogoUrl(null)} className="text-xs text-gray-400 hover:text-gray-700">
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={logoInput}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleFile('logo', e.target.files?.[0])}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Template sheet or watermark</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-14 w-24 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                {watermarkUrl ? (
                  <img src={watermarkUrl} alt="" className="max-h-full max-w-full object-contain" />
                ) : (
                  <i className="ri-file-paper-2-line text-gray-300 text-xl" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => watermarkInput.current?.click()}
                  disabled={uploading === 'watermark'}
                  className="text-sm font-semibold text-brand hover:text-brand-hover disabled:opacity-50"
                >
                  {uploading === 'watermark' ? 'Uploading…' : watermarkUrl ? 'Replace' : 'Upload'}
                </button>
                {watermarkUrl && (
                  <button
                    type="button"
                    onClick={() => setWatermarkUrl(null)}
                    className="text-xs text-gray-400 hover:text-gray-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={watermarkInput}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleFile('watermark', e.target.files?.[0])}
              />
            </div>
          </div>
        </div>

        {watermarkUrl && (
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="watermark-opacity" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Watermark strength
              </label>
              <span className="text-xs font-semibold text-gray-700">{opacity}%</span>
            </div>
            <input
              id="watermark-opacity"
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full mt-1.5 accent-brand"
            />
            {opacity > 25 && (
              <p className="text-[11px] text-orange-700 mt-1">
                Strong enough to compete with the text — worth checking it still prints legibly.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="accent" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Accent colour
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id="accent"
                type="color"
                value={effectiveAccent}
                onChange={(e) => setAccent(e.target.value)}
                className="h-11 w-14 rounded-lg border border-gray-200 bg-white p-1 cursor-pointer"
              />
              {accent ? (
                <button type="button" onClick={() => setAccent('')} className="text-xs text-gray-400 hover:text-gray-700">
                  Use the design’s colour
                </button>
              ) : (
                <span className="text-[11px] text-gray-400">Using {preset.name}’s colour</span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="footer" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Footer note
            </label>
            <input
              id="footer"
              type="text"
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              placeholder="e.g. Thank you for your business · RC 1234567"
              className="h-11 px-3 mt-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white w-full"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <button
            onClick={() =>
              reset.mutate(undefined, {
                onSuccess: () => {
                  setTemplate('plain');
                  setLogoUrl(null);
                  setWatermarkUrl(null);
                  setOpacity(8);
                  setAccent('');
                  setFooter('');
                },
              })
            }
            disabled={reset.isPending}
            className="text-sm font-semibold text-gray-400 hover:text-gray-700 disabled:opacity-50"
          >
            Reset to Azapal default
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={update.isPending || !!uploading}
              className="bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {update.isPending ? 'Saving…' : 'Save design'}
            </button>
          </div>
        </div>
      </div>
    </DefaultModal>
  );
};
