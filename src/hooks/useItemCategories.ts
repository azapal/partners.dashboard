import { useQuery } from '@tanstack/react-query';
import { itemCategoryService } from '../service/partnerService';

export const itemCategoryKeys = {
  all: ['item-categories'] as const,
  lists: () => [...itemCategoryKeys.all, 'list'] as const,
};

export const useGetItemCategories = () =>
  useQuery({
    queryKey: itemCategoryKeys.lists(),
    queryFn: () => itemCategoryService.getAll(),
  });
