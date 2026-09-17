import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { partnerServicesService, serviceService } from '../service/partnerService';
import type { ServiceConfigResponses } from '../service/partnerService';

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

/** The partner's answers to each service's configuration options. */
export const useGetServiceConfig = () =>
  useQuery({
    queryKey: ['partner-service-config'],
    queryFn: () => partnerServicesService.getConfig(),
  });

export const useSaveServiceConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (responses: ServiceConfigResponses) => partnerServicesService.saveConfig(responses),
    // Saving answers also marks those services as offered server-side, so the
    // selection is stale too — not just the answers.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner-service-config'] });
      qc.invalidateQueries({ queryKey: ['partner-services'] });
    },
  });
};

export const useUpdatePartnerServices = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serviceIds: number[]) => partnerServicesService.updateSelected(serviceIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner-services'] }),
  });
};
