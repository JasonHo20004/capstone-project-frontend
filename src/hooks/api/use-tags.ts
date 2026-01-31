import { useQuery } from '@tanstack/react-query';
import { tagService } from '@/lib/api/services/user';

/**
 * Hook để fetch tất cả tags
 */
export const useGetTags = () => {
  return useQuery({
    queryKey: ['tags', 'all'],
    queryFn: async () => (await tagService.getAllTags()).data,
    staleTime: 1000 * 60 * 60, // Tags ít thay đổi, cache 1 giờ
    onError: (error: any) => {
      console.error('Failed to fetch tags:', error);
    },
  });
};