import { useRef } from "react";
import { useUploadEmailImage } from "../../hooks/useEmailCampaigns";
import { blockProblem, newBlock } from "../../lib/emailDesign";
import type { EmailAlign, EmailBlock } from "../../service/partnerService";

/**
 * The email's body as a stack of blocks — the same six the server renders. Each
 * one is edited in place, moved with up/down (not drag: it has to work with a
 * thumb on a phone) and checked against the server's rules as it's written.
 */

const BLOCK_META: Record<EmailBlock["type"], { label: string; icon: string }> = {
  heading: { label: "Heading", icon: "ri-heading" },
  text: { label: "Text", icon: "ri-text" },
  image: { label: "Image", icon: "ri-image-line" },
  button: { label: "Button", icon: "ri-cursor-line" },
  divider: { label: "Divider", icon: "ri-separator" },
  spacer: { label: "Spacer", icon: "ri-space" },
};

const ADDABLE: EmailBlock["type"][] = ["heading", "text", "image", "button", "divider", "spacer"];

const input = "w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-400";

export const BlockEditor = ({
  blocks,
  onChange,
  showProblems,
  defaultLink,
}: {
  blocks: EmailBlock[];
  onChange: (blocks: EmailBlock[]) => void;
  showProblems: boolean;
  defaultLink: string;
}) => {
  const set = (i: number, b: EmailBlock) => onChange(blocks.map((x, j) => (j === i ? b : x)));
  const move = (i: number, by: number) => {
    const next = [...blocks];
    const [b] = next.splice(i, 1);
    next.splice(i + by, 0, b);
    onChange(next);
  };
  const remove = (i: number) => onChange(blocks.filter((_, j) => j !== i));
  const add = (type: EmailBlock["type"], at = blocks.length) => {
    const next = [...blocks];
    next.splice(at, 0, newBlock(type, defaultLink));
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {blocks.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
          The email is empty. Add a heading or some text to start.
        </p>
      )}
      {blocks.map((b, i) => {
        const problem = blockProblem(b);
        const flagged = showProblems && !!problem;
        return (
          <div key={i} data-block={i} className={`rounded-xl border bg-white ${flagged ? "border-red-300" : "border-gray-200"}`}>
            <div className="flex items-center gap-1 border-b border-gray-100 px-3 py-1.5">
              <i className={`${BLOCK_META[b.type].icon} text-gray-400`} />
              <span className="mr-auto text-xs font-semibold text-gray-600">{BLOCK_META[b.type].label}</span>
              {(b.type === "heading" || b.type === "text" || b.type === "button") && (
                <AlignPicker value={b.align ?? (b.type === "button" ? "center" : "left")} onChange={(align) => set(i, { ...b, align } as EmailBlock)} />
              )}
              <IconButton icon="ri-arrow-up-line" label="Move up" disabled={i === 0} onClick={() => move(i, -1)} />
              <IconButton icon="ri-arrow-down-line" label="Move down" disabled={i === blocks.length - 1} onClick={() => move(i, 1)} />
              <IconButton icon="ri-delete-bin-6-line" label="Delete block" onClick={() => remove(i)} danger />
            </div>
            <div className="p-3">
              <BlockFields block={b} onChange={(nb) => set(i, nb)} defaultLink={defaultLink} />
              {flagged && <p className="mt-1.5 text-[11px] text-red-500">{problem}</p>}
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-gray-50 p-2">
        <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Add</span>
        {ADDABLE.map((t) => (
          <button
            key={t}
            type="button"
            disabled={blocks.length >= 40}
            onClick={() => add(t)}
            className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 shadow-card hover:text-gray-900 disabled:opacity-40"
          >
            <i className={BLOCK_META[t].icon} />
            {BLOCK_META[t].label}
          </button>
        ))}
      </div>
    </div>
  );
};

const BlockFields = ({ block: b, onChange, defaultLink }: { block: EmailBlock; onChange: (b: EmailBlock) => void; defaultLink: string }) => {
  switch (b.type) {
    case "heading":
      return <input value={b.text} maxLength={150} onChange={(e) => onChange({ ...b, text: e.target.value })} className={`${input} h-10 text-base font-bold`} placeholder="Heading" />;
    case "text":
      return (
        <textarea
          value={b.text}
          maxLength={3000}
          rows={Math.min(8, Math.max(3, b.text.split("\n").length + 1))}
          onChange={(e) => onChange({ ...b, text: e.target.value })}
          className={`${input} resize-y py-2 leading-relaxed`}
          placeholder="Write your message. A new line is a line break."
        />
      );
    case "image":
      return <ImageFields block={b} onChange={onChange} />;
    case "button":
      return (
        <div className="flex flex-col gap-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_1.6fr]">
            <input value={b.label} maxLength={40} onChange={(e) => onChange({ ...b, label: e.target.value })} className={`${input} h-9`} placeholder="Label" aria-label="Button label" />
            <input value={b.url} onChange={(e) => onChange({ ...b, url: e.target.value })} className={`${input} h-9`} placeholder="https://…, mailto: or tel:" aria-label="Button link" />
          </div>
          {defaultLink && b.url !== defaultLink && (
            <button type="button" onClick={() => onChange({ ...b, url: defaultLink })} className="self-start text-[11px] font-semibold text-brand hover:text-brand-hover">
              Use my quote page link
            </button>
          )}
        </div>
      );
    case "spacer":
      return (
        <label className="flex items-center gap-3 text-xs text-gray-500">
          Height
          <input type="range" min={8} max={64} step={4} value={b.size ?? 24} onChange={(e) => onChange({ ...b, size: Number(e.target.value) })} className="flex-1 accent-[#F14724]" />
          <span className="w-10 text-right tabular-nums">{b.size ?? 24}px</span>
        </label>
      );
    default:
      return <hr className="border-gray-200" />;
  }
};

const ImageFields = ({ block: b, onChange }: { block: Extract<EmailBlock, { type: "image" }>; onChange: (b: EmailBlock) => void }) => {
  const upload = useUploadEmailImage();
  const file = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={() => file.current?.click()}
        disabled={upload.isPending}
        className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs font-semibold text-gray-500 hover:border-gray-400 sm:w-32"
      >
        {upload.isPending ? (
          <span><i className="ri-loader-4-line animate-spin" /> Uploading…</span>
        ) : b.url ? (
          <img src={b.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1"><i className="ri-upload-cloud-2-line text-xl" />Upload image</span>
        )}
      </button>
      <input
        ref={file}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) upload.mutate(f, { onSuccess: (url) => onChange({ ...b, url }) });
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <input value={b.url} onChange={(e) => onChange({ ...b, url: e.target.value })} className={`${input} h-9`} placeholder="…or paste an https:// image address" aria-label="Image address" />
        <input value={b.alt ?? ""} maxLength={150} onChange={(e) => onChange({ ...b, alt: e.target.value })} className={`${input} h-9`} placeholder="Describe it (shown if images are off)" aria-label="Alt text" />
        <input value={b.link ?? ""} onChange={(e) => onChange({ ...b, link: e.target.value })} className={`${input} h-9`} placeholder="Link when clicked (optional, https://)" aria-label="Image link" />
      </div>
    </div>
  );
};

const AlignPicker = ({ value, onChange }: { value: EmailAlign; onChange: (a: EmailAlign) => void }) => (
  <div className="mr-1 flex rounded-md bg-gray-100 p-0.5">
    {(["left", "center", "right"] as EmailAlign[]).map((a) => (
      <button
        key={a}
        type="button"
        aria-label={`Align ${a}`}
        aria-pressed={value === a}
        onClick={() => onChange(a)}
        className={`flex h-6 w-6 items-center justify-center rounded text-xs ${value === a ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
      >
        <i className={`ri-align-${a}`} />
      </button>
    ))}
  </div>
);

const IconButton = ({ icon, label, onClick, disabled, danger }: { icon: string; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={onClick}
    className={`flex h-7 w-7 items-center justify-center rounded-md text-gray-400 disabled:opacity-30 ${danger ? "hover:bg-red-50 hover:text-red-500" : "hover:bg-gray-100 hover:text-gray-700"}`}
  >
    <i className={icon} />
  </button>
);
