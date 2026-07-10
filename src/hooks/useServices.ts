import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { partnerServicesService, serviceService } from '../service/partnerService';

export const useGetServices = () =>
  useQuery({
    queryKey: ['services'],
    queryFn: () => serviceService.getAll(),
  });

export const useGetPartnerServices = () =>
  useQuery({
    queryKey: ['partner-services'],
    queryFn: () => partnerServicesService.getSelected(),
  });

export const useUpdatePartnerServices = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serviceIds: number[]) => partnerServicesService.updateSelected(serviceIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner-services'] }),
  });
};
