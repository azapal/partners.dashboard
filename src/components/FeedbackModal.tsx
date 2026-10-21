import { useEffect, useRef, useSyncExternalStore } from "react";
import { feedbackActions, feedbackStore } from "../store/client/feedback";

/**
 * The one place success and error messages appear. Mounted once in App.
 *
 * Blocking on purpose: the backdrop doesn't dismiss it, only the button (or
 * Enter/Escape, which are the same decision made from the keyboard). The button
 * takes focus so the keyboard path works without hunting for it.
 */
export const FeedbackModal = () => {
  const current = useSyncExternalStore(
    feedbackStore.subscribe,
    () => feedbackStore.state.queue[0],
    () => feedbackStore.state.queue[0],
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!current) return;
    buttonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        feedbackActions.dismiss();
      }
    };
    // Capture phase, so the modal underneath (if any) doesn't also close.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [current]);

  if (!current) return null;
  const error = current.kind === "error";

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" aria-hidden="true" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        aria-describedby="feedback-message"
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
      >
        <span
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
            error ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
          }`}
        >
          <i className={`${error ? "ri-error-warning-line" : "ri-checkbox-circle-line"} text-3xl`} />
        </span>
        <h2 id="feedback-title" className="mt-4 text-base font-semibold text-gray-900">
          {current.title}
        </h2>
        <p id="feedback-message" className="mt-1.5 whitespace-pre-line text-sm leading-6 text-gray-600">
          {current.message}
        </p>
        <button
          ref={buttonRef}
          type="button"
          onClick={feedbackActions.dismiss}
          className={`mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
            error ? "bg-gray-900 hover:bg-gray-700" : "bg-brand hover:bg-brand-hover"
          }`}
        >
          {error ? "OK, got it" : "Continue"}
        </button>
      </div>
    </div>
  );
};
