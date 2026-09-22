import { findAction } from "./actions";
import { awaitAction, hasAction, invokeAction } from "./registry";
import { assistantActions } from "../../store/client/assistant";
import { signpostFor } from "./signpost";

/**
 * Turns an utterance into a performed action.
 *
 * The sequence is always: pick the action → say what is about to happen →
 * route if we are not already there → wait for the destination screen to
 * register the handler → invoke it with whatever params were understood.
 *
 * Note the ordering: the assistant docks itself *before* invoking, so the form
 * it is about to open is never revealed behind a scrim.
 *
 * Parsing is keyword matching on purpose. It is honest about what it is — a
 * router, not comprehension — and it is the piece designed to be swapped for a
 * model's tool call later. When that happens only this function changes: the
 * registry, the action list and every screen handler stay exactly as they are.
 */
export const runUtterance = async (
  utterance: string,
  navigate: (to: string) => void,
  currentPath: string,
): Promise<void> => {
  const text = utterance.trim();
  if (!text) return;

  assistantActions.say("user", text);

  const action = findAction(text);
  if (!action) {
    // Nothing performable. Rather than dead-ending, point at the screen that
    // already answers this — a destination, never a claimed answer.
    assistantActions.setStatus("idle");
    const signposts = signpostFor(text);
    assistantActions.say(
      "assistant",
      signposts.length
        ? "I can't do that one for you yet. This is where it's handled today:"
        : "I can't do that one yet. I can create a branch, a rate, a route, an invoice or a payout split, and invite a teammate.",
      { signposts },
    );
    return;
  }

  assistantActions.setStatus("thinking");
  assistantActions.say("assistant", action.say, { sensitive: action.sensitive });

  const params = action.extract?.(text) ?? {};

  try {
    assistantActions.setStatus("acting");

    if (!hasAction(action.id)) {
      // Not on the owning screen yet. Dock first so the arrival is visible.
      assistantActions.dock();
      if (currentPath !== action.route) navigate(action.route);
      await awaitAction(action.id);
    } else {
      assistantActions.dock();
    }

    invokeAction(action.id, params);
    assistantActions.setStatus("idle");

    const filled = Object.keys(params).length;
    assistantActions.say(
      "assistant",
      filled
        ? `I've filled in what I understood (${Object.values(params).join(", ")}). Check it over and submit when it looks right — I won't submit for you.`
        : "The form is open. Fill in the details and submit when you're ready — I won't submit for you.",
      { sensitive: action.sensitive },
    );
  } catch {
    assistantActions.setStatus("error");
    assistantActions.say(
      "assistant",
      `I routed to ${action.route} but couldn't open that form. Try it from the page directly.`,
    );
  }
};
