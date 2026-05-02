import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

/**
 * Custom hook for fetching data with React Query
 * Provides standardized loading, error, and data states
 */
export function useApiQuery<TData = unknown, TError = unknown>(
  key: unknown[],
  queryFn: () => Promise<TData>,
  options?: UseQueryOptions<TData, TError>
) {
  return useQuery<TData, TError>({
    queryKey: key,
    queryFn,
    ...options,
  });
}

/**
 * Custom hook for mutating data with React Query
 * Provides standardized loading, error, and success states
 */
export function useApiMutation<TData = unknown, TVariables = void, TError = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables>
) {
  return useMutation<TData, TError, TVariables>({
    mutationFn,
    ...options,
  });
}

/**
 * Helper to invalidate queries after mutation
 */
export function invalidateQuery(key: unknown[]) {
  queryClient.invalidateQueries({ queryKey: key });
}

/**
 * Helper to set query data directly
 */
export function setQueryData<TData>(key: unknown[], data: TData) {
  queryClient.setQueryData(key, data);
}

/**
 * Helper to get query data
 */
export function getQueryData<TData>(key: unknown[]): TData | undefined {
  return queryClient.getQueryData<TData>(key);
}

/**
 * Helper to prefetch query data
 */
export function prefetchQuery<TData>(key: unknown[], queryFn: () => Promise<TData>) {
  return queryClient.prefetchQuery({ queryKey: key, queryFn });
}
