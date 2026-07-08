import { useQuery } from '@tanstack/react-query';
import { roleService } from '../service/partnerService';

export const useGetRoles = () =>
  useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.getAll(),
    staleTime: 10 * 60 * 1000, // roles rarely change
  });
