import {
  QueryCache,
  QueryClient,
  MutationCache,
} from "@tanstack/react-query";
import { handleQueryError, handleMutationError } from "./globalErrorHandler";

/**
 * QueryClient with global error handling for React Query v5.
 * - QueryCache.onError: Shows toast for all failed queries
 * - MutationCache.onError: Shows toast for all failed mutations
 *
 * Use with QueryClientProvider in your app root.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      handleQueryError(error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      handleMutationError(error);
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: false,
    },
  },
});
