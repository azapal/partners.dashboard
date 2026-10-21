import { Store } from '@tanstack/store';

/**
 * The outcome of something the user just did — saved, sent, failed — shown as a
 * modal they have to dismiss, so nobody misses that a payment failed because
 * the banner was scrolled off screen.
 *
 * Fed automatically for every mutation by the MutationCache in
 * lib/queryClient.ts; call `feedbackActions.show` directly only for outcomes
 * that aren't a mutation. Messages queue rather than replace each other, so an
 * error arriving behind a success is never lost.
 */

export type FeedbackKind = 'success' | 'error';

export interface FeedbackMessage {
  id: number;
  kind: FeedbackKind;
  title: string;
  message: string;
}

type FeedbackState = { queue: FeedbackMessage[] };

export const feedbackStore = new Store<FeedbackState>({ queue: [] });

let nextId = 1;

export const feedbackActions = {
  show: (kind: FeedbackKind, message: string, title?: string) => {
    const entry: FeedbackMessage = {
      id: nextId++,
      kind,
      title: title ?? (kind === 'success' ? 'Done' : 'Something went wrong'),
      message,
    };
    feedbackStore.setState((s) => {
      // The same message twice in a row (a double-click, a retry) is one message.
      const last = s.queue[s.queue.length - 1];
      if (last && last.kind === entry.kind && last.message === entry.message) return s;
      return { queue: [...s.queue, entry] };
    });
  },
  success: (message: string, title?: string) => feedbackActions.show('success', message, title),
  error: (message: string, title?: string) => feedbackActions.show('error', message, title),
  dismiss: () => feedbackStore.setState((s) => ({ queue: s.queue.slice(1) })),
};
