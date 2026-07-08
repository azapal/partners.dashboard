import { useQuery } from '@tanstack/react-query';
import { serviceService } from '../service/partnerService';

export const useGetServices = () =>
  useQuery({
    queryKey: ['services'],
    queryFn: () => serviceService.getAll(),
  });
