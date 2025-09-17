import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { usePageVisibility } from '@/hooks/usePageVisibility';

// Wrapper hook that automatically pauses queries when page is not visible
export function useQueryWithPageVisibility<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  const isPageVisible = usePageVisibility();

  return useQuery({
    queryKey,
    queryFn,
    enabled: isPageVisible && (options?.enabled !== false),
    refetchOnWindowFocus: false,
    ...options,
  });
}