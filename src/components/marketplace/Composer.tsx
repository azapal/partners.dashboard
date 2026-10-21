import { useEffect, useRef, type ReactNode } from "react";

export const MAX_MESSAGE_CHARS = 4000;

/**
 * The message box used everywhere a partner writes to another: the inbox
 * thread, a storefront's "Message", and answering a brief. Enter sends,
 * Shift+Enter is a newline (and IME composition never sends).
 */
export const Composer = ({
  value,
  onChange,
  onSend,
  sending,
  placeholder = "Write a message…",
  autoFocus,
  context,
  sendLabel = "Send",
  minRows = 1,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  sending?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  /** Shown above the box — e.g. which listing or brief this is about. */
  context?: ReactNode;
  sendLabel?: string;
  minRows?: number;
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const tooLong = value.length > MAX_MESSAGE_CHARS;
  const canSend = !!value.trim() && !tooLong && !sending;

  // Grow with the text, up to a cap, then scroll.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <div className="flex flex-col gap-2">
      {context}
      <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white p-1.5 pl-3 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100">
        <textarea
          ref={ref}
          rows={minRows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          placeholder={placeholder}
          aria-label="Message"
          className="max-h-[180px] min-w-0 flex-1 resize-none bg-transparent py-2 text-sm leading-5 text-gray-800 placeholder:text-gray-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label={sendLabel}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-send-plane-2-fill" />}
          <span className="hidden sm:inline">{sendLabel}</span>
        </button>
      </div>
      <div className="flex justify-between px-1 text-[11px] text-gray-400">
        <span className="hidden sm:inline">Enter to send · Shift+Enter for a new line</span>
        <span className={`ml-auto tabular-nums ${tooLong ? "font-semibold text-red-600" : ""}`}>
          {value.length > MAX_MESSAGE_CHARS * 0.8 || tooLong ? `${value.length.toLocaleString()} / ${MAX_MESSAGE_CHARS.toLocaleString()}` : ""}
        </span>
      </div>
    </div>
  );
};
