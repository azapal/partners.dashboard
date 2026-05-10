/**
 * Partner Hooks
 * 
 * Custom React Query hooks for partner operations.
 * Provides convenient hooks for fetching, creating, updating, and deleting partners.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';

import partnerService, {
  Partner,
  PartnerId,
  CreatePartnerPayload,
  UpdatePartnerPayload,
  CompleteOnboardingPayload,
  PartnerResponse,
} from '../service/partnerService';

// ============================================================================
// Query Keys
// ============================================================================

export const partnerQueryKeys = {
  all: ['partners'] as const,
  lists: () => [...partnerQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any> = {}) =>
    [...partnerQueryKeys.lists(), filters] as const,
  details: () => [...partnerQueryKeys.all, 'detail'] as const,
  detail: (id: PartnerId) => [...partnerQueryKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch all partners
 */
export const useGetAllPartners = (
  options?: UseQueryOptions<Partner[], Error>
): UseQueryResult<Partner[], Error> => {
  return useQuery({
    queryKey: partnerQueryKeys.lists(),
    queryFn: () => partnerService.getAllPartners(),
    ...options,
  });
};

/**
 * Hook to fetch a single partner by ID
 */
export const useGetPartnerById = (
  id: PartnerId | null,
  options?: UseQueryOptions<Partner, Error>
): UseQueryResult<Partner, Error> => {
  return useQuery({
    queryKey: partnerQueryKeys.detail(id || ''),
    queryFn: () => {
      if (!id) throw new Error('Partner ID is required');
      return partnerService.getPartnerById(id);
    },
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook to fetch partner by partner ID (alternative endpoint)
 */
export const useGetPartnerByPartnerId = (
  partnerId: PartnerId | null,
  options?: UseQueryOptions<Partner, Error>
): UseQueryResult<Partner, Error> => {
  return useQuery({
    queryKey: partnerQueryKeys.detail(partnerId || ''),
    queryFn: () => {
      if (!partnerId) throw new Error('Partner ID is required');
      return partnerService.getPartnerByPartnerId(partnerId);
    },
    enabled: !!partnerId,
    ...options,
  });
};

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to create a new partner
 */
export const useCreatePartner = (
  options?: UseMutationOptions<Partner, Error, CreatePartnerPayload>
): UseMutationResult<Partner, Error, CreatePartnerPayload> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => partnerService.createPartner(payload),
    onSuccess: (data) => {
      // Invalidate the partners list to refetch
      queryClient.invalidateQueries({
        queryKey: partnerQueryKeys.lists(),
      });
      // Add the new partner to cache
      queryClient.setQueryData(
        partnerQueryKeys.detail(data.id),
        data
      );
    },
    ...options,
  });
};

/**
 * Hook to update a partner
 */
export const useUpdatePartner = (
  options?: UseMutationOptions<
    Partner,
    Error,
    { id: PartnerId; payload: UpdatePartnerPayload }
  >
): UseMutationResult<
  Partner,
  Error,
  { id: PartnerId; payload: UpdatePartnerPayload }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) =>
      partnerService.updatePartner(id, payload),
    onSuccess: (data) => {
      // Invalidate the partner detail
      queryClient.setQueryData(
        partnerQueryKeys.detail(data.id),
        data
      );
      // Invalidate the list to refetch
      queryClient.invalidateQueries({
        queryKey: partnerQueryKeys.lists(),
      });
    },
    ...options,
  });
};

/**
 * Hook to complete partner onboarding
 */
export const useCompleteOnboarding = (
  options?: UseMutationOptions<Partner, Error, CompleteOnboardingPayload>
): UseMutationResult<Partner, Error, CompleteOnboardingPayload> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => partnerService.completeOnboarding(payload),
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: partnerQueryKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: partnerQueryKeys.lists(),
      });
    },
    ...options,
  });
};

/**
 * Hook to resend partner invite
 */
export const useResendPartnerInvite = (
  options?: UseMutationOptions<PartnerResponse, Error, PartnerId>
): UseMutationResult<PartnerResponse, Error, PartnerId> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => partnerService.resendInvite(id),
    onSuccess: (_, id) => {
      // Invalidate the partner detail
      queryClient.invalidateQueries({
        queryKey: partnerQueryKeys.detail(id),
      });
    },
    ...options,
  });
};

/**
 * Hook to revoke partner invite
 */
export const useRevokePartnerInvite = (
  options?: UseMutationOptions<PartnerResponse, Error, PartnerId>
): UseMutationResult<PartnerResponse, Error, PartnerId> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => partnerService.revokeInvite(id),
    onSuccess: (_, id) => {
      // Invalidate the partner detail
      queryClient.invalidateQueries({
        queryKey: partnerQueryKeys.detail(id),
      });
      // Invalidate the list
      queryClient.invalidateQueries({
        queryKey: partnerQueryKeys.lists(),
      });
    },
    ...options,
  });
};

/**
 * Hook to delete a partner
 */
export const useDeletePartner = (
  options?: UseMutationOptions<PartnerResponse, Error, PartnerId>
): UseMutationResult<PartnerResponse, Error, PartnerId> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => partnerService.deletePartner(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: partnerQueryKeys.detail(id),
      });
      // Invalidate the list to refetch
      queryClient.invalidateQueries({
        queryKey: partnerQueryKeys.lists(),
      });
    },
    ...options,
  });
};

export default {
  // Queries
  useGetAllPartners,
  useGetPartnerById,
  useGetPartnerByPartnerId,
  // Mutations
  useCreatePartner,
  useUpdatePartner,
  useCompleteOnboarding,
  useResendPartnerInvite,
  useRevokePartnerInvite,
  useDeletePartner,
};
