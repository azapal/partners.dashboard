import { MutationCache, QueryClient } from '@tanstack/react-query';
import { feedbackActions } from '../store/client/feedback';

/**
 * What a mutation can say about its own outcome. Every mutation already shows
 * its result in the blocking FeedbackModal (components/FeedbackModal.tsx); these
 * only tune what it says, or opt out.
 *
 *   useMutation({ mutationFn, meta: { successMessage: 'Branch created.' } })
 *
 * - `successMessage` / `successTitle`: the words for a success. Without one the
 *   modal says the generic "Your changes have been saved."
 * - `silentSuccess`: no modal on success — for steps whose success is the next
 *   screen (sending an OTP, signing in) or a quiet background write.
 * - `silentError`: no modal on failure — only where the screen shows the error
 *   better in place (a field-level validation the user is mid-way through).
 */
declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      successMessage?: string;
      successTitle?: string;
      silentSuccess?: boolean;
      silentError?: boolean;
    };
  }
}

const errorText = (error: unknown) =>
  error instanceof Error && error.message
    ? error.message
    : 'Please try again. If it keeps happening, contact Azapal support.';

// Create a client
export const queryClient = new QueryClient({
  // One hook for every mutation's outcome, so no screen can forget to say
  // whether the thing worked.
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      const meta = mutation.meta;
      if (meta?.silentSuccess) return;
      feedbackActions.success(meta?.successMessage ?? 'Your changes have been saved.', meta?.successTitle);
    },
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.silentError) return;
      feedbackActions.error(errorText(error));
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Mutations are non-idempotent writes triggered by an explicit user
      // action (submit a form, verify an OTP, delete a branch...) — auto-
      // retrying on any thrown error risks resubmitting a request whose
      // first attempt actually succeeded server-side but errored client-side
      // (e.g. a slow response), which is a correctness bug, not just wasted
      // work. Retries belong to the user clicking again, not the client.
      retry: false,
    },
  },
});
