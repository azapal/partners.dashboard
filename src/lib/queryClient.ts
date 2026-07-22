import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
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
