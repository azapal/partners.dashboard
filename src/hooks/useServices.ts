import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { partnerServicesService, serviceService } from '../service/partnerService';
import type { ServiceConfigResponses } from '../service/partnerService';
import { quotePageKeys } from './useQuotePage';

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
    meta: { successMessage: 'Service details saved.' },
    mutationFn: (responses: ServiceConfigResponses) => partnerServicesService.saveConfig(responses),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner-service-config'] });
    },
  });
};

export const useUpdatePartnerServices = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Your services are updated.' },
    mutationFn: (serviceIds: number[]) => partnerServicesService.updateSelected(serviceIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner-services'] });
      // What a quote page can offer follows what's ticked here.
      qc.invalidateQueries({ queryKey: quotePageKeys.all });
    },
  });
};
