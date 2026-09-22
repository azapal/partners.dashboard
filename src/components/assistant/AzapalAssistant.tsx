import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AzapalOrb } from "./AzapalOrb";
import { assistantActions, assistantStore } from "../../store/client/assistant";
import { runUtterance } from "../../lib/assistant/run";
import { ASSISTANT_ACTIONS } from "../../lib/assistant/actions";

const useAssistant = () =>
  useSyncExternalStore(
    assistantStore.subscribe,
    () => assistantStore.state,
    () => assistantStore.state,
  );

/**
 * The assistant shell — mounted once in App.tsx, alongside DefaultResizableSheet.
 *
 * Three presences (see assistant.ts): hidden, center stage, docked. The docked
 * puck is deliberately above every other z-layer in the app, since its whole
 * job is to stay reachable while the user works in a modal the assistant just
 * opened.
 *
 * Stage 1 is text only. Voice (push-to-talk, then a local wake word) plugs into
 * the same `submit` path without changing anything below it.
 */
export const AzapalAssistant = () => {
  const { mode, status, turns, pending } = useAssistant();
  const [draft, setDraft] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Cmd/Ctrl-K summons it from anywhere; Escape dismisses.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        assistantActions.toggle();
      } else if (e.key === "Escape" && assistantStore.state.mode === "center") {
        assistantActions.close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (mode === "center") inputRef.current?.focus();
  }, [mode]);

  // A question handed over from elsewhere (currently the workspace search bar)
  // is asked as soon as the shell is up, so the hand-off doesn't lose what was
  // already typed. Cleared immediately so it can never fire twice.
  useEffect(() => {
    if (!pending || mode === "hidden") return;
    assistantActions.consumePending();
    void runUtterance(pending, navigate, location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, mode]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  const submit = (text: string) => {
    if (!text.trim()) return;
    setDraft("");
    void runUtterance(text, navigate, location.pathname);
  };

  if (mode === "hidden") return null;

  // ── Docked ────────────────────────────────────────────────────────────────
  // Sits above everything, including whatever modal it just opened.
  if (mode === "docked") {
    const last = [...turns].reverse().find((t) => t.role === "assistant");
    return (
      <div className="azapal-dock fixed bottom-5 right-5 flex max-w-[min(22rem,calc(100vw-2.5rem))] items-center gap-3 rounded-2xl border border-orange-100 bg-white/95 p-2.5 pr-3 shadow-2xl shadow-brand/20 backdrop-blur animate-[assistantRise_220ms_cubic-bezier(0.22,1,0.36,1)]">
        <button
          type="button"
          onClick={() => assistantActions.open()}
          aria-label="Expand Azapal assistant"
          className="shrink-0 rounded-full"
        >
          <AzapalOrb status={status} size={40} />
        </button>
        <p className="min-w-0 flex-1 truncate text-[11px] leading-4 text-slate-600">
          {last?.text ?? "Azapal is standing by."}
        </p>
        <button
          type="button"
          onClick={() => assistantActions.close()}
          aria-label="Dismiss Azapal assistant"
          className="shrink-0 text-slate-300 transition-colors hover:text-slate-600"
        >
          <i className="ri-close-line text-base" />
        </button>
      </div>
    );
  }

  // ── Center stage ──────────────────────────────────────────────────────────
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Azapal assistant"
      className="azapal-stage fixed inset-0 flex flex-col items-center justify-center px-4"
    >
      {/* Scrim. Blur only here — full-screen backdrop-filter is expensive, and
          the docked state must never pay for it. */}
      <button
        type="button"
        aria-label="Close assistant"
        onClick={() => assistantActions.close()}
        className="absolute inset-0 cursor-default bg-slate-950/65 backdrop-blur-md"
      />

      <div className="relative flex w-full max-w-xl flex-col items-center animate-[assistantRise_260ms_cubic-bezier(0.22,1,0.36,1)]">
        <AzapalOrb status={status} size={turns.length ? 96 : 150} />

        {turns.length === 0 ? (
          <>
            <h2 className="mt-7 text-center text-xl font-semibold tracking-tight text-white">
              Hey, I'm Azapal
            </h2>
            <p className="mt-1.5 max-w-sm text-center text-sm leading-6 text-white/60">
              Tell me what you need and I'll take you there with the form already
              filled in. You still press the button.
            </p>
          </>
        ) : (
          <div className="mt-6 max-h-[42vh] w-full space-y-2.5 overflow-y-auto pr-1">
            {turns.map((turn) =>
              turn.role === "user" ? (
                <p
                  key={turn.id}
                  className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-brand px-3.5 py-2 text-xs leading-5 text-white"
                >
                  {turn.text}
                </p>
              ) : (
                <div key={turn.id} className="max-w-[90%]">
                  <p className="w-fit rounded-2xl rounded-bl-sm bg-white/10 px-3.5 py-2 text-xs leading-5 text-white/90 backdrop-blur shadow-card">
                    {turn.text}
                  </p>
                  {turn.sensitive && (
                    <p className="mt-1 flex items-center gap-1 px-1 text-[10px] font-medium text-amber-300/90">
                      <i className="ri-shield-check-line" />
                      Affects pricing or money — read it before you submit.
                    </p>
                  )}
                  {turn.signposts && turn.signposts.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {turn.signposts.map((s) => (
                        <button
                          key={s.to}
                          type="button"
                          onClick={() => { assistantActions.close(); navigate(s.to); }}
                          className="group flex w-full items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-left transition-colors hover:border-brand/60 hover:bg-white/10"
                        >
                          <span className="flex-1 truncate text-xs font-semibold text-white/80 group-hover:text-white">
                            {s.label}
                          </span>
                          <i className="ri-arrow-right-line text-sm text-white/30 group-hover:text-brand" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
            <div ref={endRef} />
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); submit(draft); }}
          className="mt-6 w-full"
        >
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 p-1.5 pl-4 backdrop-blur-xl transition focus-within:border-brand/60 focus-within:bg-white/15">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Try: create a new branch in Ikeja, Lagos"
              aria-label="Tell Azapal what you need"
              className="flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-white/40"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white transition-colors hover:bg-brand-hover disabled:bg-white/15 disabled:text-white/30"
            >
              <i className="ri-arrow-up-line text-base" />
            </button>
          </div>
        </form>

        {turns.length === 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {ASSISTANT_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => submit(action.label)}
                className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-medium text-white/70 transition-colors hover:border-brand/60 hover:text-white"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        <p className="mt-5 text-center text-[10px] text-white/35">
          Azapal opens and fills forms. It never submits them for you.
        </p>
      </div>
    </div>
  );
};
