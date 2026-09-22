import { Store } from "@tanstack/store";

/**
 * Assistant UI state.
 *
 * `mode` is the three-stage presence:
 *   hidden — not summoned
 *   center — full-screen scrim, orb large, conversation visible
 *   docked — a small always-on-top puck in the corner
 *
 * The assistant demotes itself from `center` to `docked` the moment it starts
 * acting on a screen, because that is exactly when it would otherwise be
 * covering the thing it just did. That is the trigger — not a measurement of
 * how much room the action needs, which is unknowable up front.
 */
export type AssistantMode = "hidden" | "center" | "docked";

/** Drives the orb's animation; `listening` is reserved for voice (stage 3). */
export type AssistantStatus = "idle" | "thinking" | "acting" | "error";

export interface AssistantTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** Shown on an assistant turn that touched money or access. */
  sensitive?: boolean;
  /** Offered when nothing could be performed — where to look instead. */
  signposts?: { label: string; to: string }[];
}

type AssistantState = {
  mode: AssistantMode;
  status: AssistantStatus;
  turns: AssistantTurn[];
  /**
   * A question handed over from elsewhere (the workspace search bar, later a
   * voice transcript) to be asked as soon as the assistant is open. The shell
   * consumes and clears it; it is never left set.
   */
  pending: string | null;
};

export const assistantStore = new Store<AssistantState>({
  mode: "hidden",
  status: "idle",
  turns: [],
  pending: null,
});

let seq = 0;
const nextId = () => `t${++seq}`;

export const assistantActions = {
  open: () => assistantStore.setState((s) => ({ ...s, mode: "center" })),
  /** Opens the assistant and queues `text` to be asked on arrival. */
  ask: (text: string) =>
    assistantStore.setState((s) => ({ ...s, mode: "center", pending: text })),
  consumePending: () => assistantStore.setState((s) => ({ ...s, pending: null })),
  dock: () => assistantStore.setState((s) => ({ ...s, mode: "docked" })),
  close: () => assistantStore.setState((s) => ({ ...s, mode: "hidden", status: "idle" })),
  toggle: () =>
    assistantStore.setState((s) => ({ ...s, mode: s.mode === "hidden" ? "center" : "hidden" })),
  setStatus: (status: AssistantStatus) => assistantStore.setState((s) => ({ ...s, status })),
  say: (
    role: AssistantTurn["role"],
    text: string,
    extra?: { sensitive?: boolean; signposts?: AssistantTurn["signposts"] },
  ) =>
    assistantStore.setState((s) => ({
      ...s,
      turns: [...s.turns, { id: nextId(), role, text, ...extra }],
    })),
  reset: () => assistantStore.setState((s) => ({ ...s, turns: [], status: "idle" })),
};
