import { Store } from "@tanstack/store";
import { useEffect, useRef } from "react";

/**
 * The assistant action registry.
 *
 * The assistant never touches the DOM. Screens *declare* what they can do by
 * registering a handler under a stable action id; the assistant asks for an id
 * and the screen that owns it performs the work. That keeps the two decoupled:
 * a screen can be refactored freely as long as it still registers its ids, and
 * a mis-typed id fails loudly instead of silently clicking the wrong thing.
 *
 * The other reason for a registry rather than selectors is timing. An action
 * usually needs a route change first, and the target screen only registers once
 * it has mounted. `awaitAction` waits for the registration event rather than
 * guessing with a timeout, so the handshake is correct on a slow connection and
 * fast on a quick one.
 *
 * Handlers open and prefill. They never submit — see ASSISTANT_ACTIONS.
 */

type ActionHandler = (params: Record<string, string>) => void;

type RegistryState = {
  handlers: Record<string, ActionHandler>;
};

export const actionRegistry = new Store<RegistryState>({ handlers: {} });

const register = (id: string, handler: ActionHandler) => {
  actionRegistry.setState((state) => ({ handlers: { ...state.handlers, [id]: handler } }));
};

const unregister = (id: string) => {
  actionRegistry.setState((state) => {
    const handlers = { ...state.handlers };
    delete handlers[id];
    return { handlers };
  });
};

/**
 * Registers this screen as the owner of `id` for as long as it is mounted.
 *
 * Registration happens once per `id`, not per render — re-registering on every
 * render would thrash the store and wake every `awaitAction` subscriber. The
 * handler is therefore reached through a ref that is repointed on each render,
 * so the long-lived registered closure always calls the *current* handler and
 * can safely read props and state.
 */
export const useAssistantAction = (id: string, handler: ActionHandler) => {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    register(id, (params) => ref.current(params));
    return () => unregister(id);
  }, [id]);
};

export const hasAction = (id: string) => Boolean(actionRegistry.state.handlers[id]);

export const invokeAction = (id: string, params: Record<string, string>) => {
  const handler = actionRegistry.state.handlers[id];
  if (!handler) return false;
  handler(params);
  return true;
};

/**
 * Resolves once `id` has a registered handler, or rejects after `timeoutMs`.
 * Used after a route change to wait for the destination screen to mount.
 */
export const awaitAction = (id: string, timeoutMs = 6000) =>
  new Promise<void>((resolve, reject) => {
    if (hasAction(id)) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error(`Timed out waiting for action "${id}"`));
    }, timeoutMs);

    const unsubscribe = actionRegistry.subscribe(() => {
      if (!hasAction(id)) return;
      clearTimeout(timer);
      unsubscribe();
      resolve();
    });
  });
