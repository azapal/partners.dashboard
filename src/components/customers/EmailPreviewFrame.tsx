import { useRef, useState } from "react";
import { useEmailPreview } from "../../hooks/useEmailCampaigns";
import { useDebounced } from "../../lib/emailDesign";
import type { EmailContent } from "../../service/partnerService";

/**
 * The email exactly as a customer gets it — the server renders it, header,
 * footer and unsubscribe link included, so what's shown here is what's sent.
 *
 * The HTML goes into a sandboxed iframe with scripts off. `allow-same-origin` is
 * there only so the frame can be sized to its content; with no scripts allowed
 * the document can't use it for anything.
 */
export const EmailPreviewFrame = ({
  content,
  device = "desktop",
  minHeight = 420,
  fixedHeight,
  className = "",
}: {
  content: (EmailContent & { sample_name?: string }) | null;
  device?: "desktop" | "mobile";
  minHeight?: number;
  /** A fixed-height window instead of growing to fit — for thumbnails and the compose modal. */
  fixedHeight?: number;
  className?: string;
}) => {
  const settled = useDebounced(content, 450);
  const { data, isFetching, isError, error } = useEmailPreview(settled);
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(minHeight);
  const empty = !content || content.design.blocks.length === 0;

  const fit = () => {
    if (fixedHeight) return;
    const doc = frame.current?.contentDocument;
    if (doc?.body) setHeight(Math.max(minHeight, doc.documentElement.scrollHeight));
  };

  return (
    <div className={`relative flex justify-center ${className}`}>
      <div
        className={`relative w-full overflow-hidden rounded-xl bg-[#F4F5F7] transition-[max-width] duration-300 ${
          device === "mobile" ? "max-w-[375px] ring-8 ring-gray-900/90" : "max-w-full"
        }`}
        style={{ height: fixedHeight ?? height }}
      >
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-gray-400">
            <i className="ri-mail-open-line text-3xl text-gray-300" />
            Start writing and the email appears here.
          </div>
        ) : data ? (
          <iframe
            ref={frame}
            title="Email preview"
            sandbox="allow-same-origin"
            srcDoc={data.html}
            onLoad={fit}
            className="h-full w-full border-0 bg-white"
          />
        ) : isError ? null : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            <i className="ri-loader-4-line mr-2 animate-spin" /> Rendering preview…
          </div>
        )}
        {isFetching && data && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-gray-500 shadow-card">
            <i className="ri-loader-4-line animate-spin" /> Updating
          </span>
        )}
        {isError && !empty && (
          <div className={`${data ? "absolute inset-x-2 bottom-2" : "flex h-full items-center justify-center p-6"}`}>
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <i className="ri-error-warning-line mr-1" />
              Preview unavailable{error?.message ? ` — ${error.message}` : "."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
