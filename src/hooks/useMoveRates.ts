import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { moveRateService, type MoveRateSetDTO } from '../service/partnerService';
import { currencySymbol, type MoveRateSet } from '../lib/data/moveRates';
import { usePartnerProfile } from './useAuth';
import { useRepProfile } from './useRepAuth';

export const moveRateKeys = {
  all: ['move-rates'] as const,
  lists: () => [...moveRateKeys.all, 'list'] as const,
};

/** The cache holds the server's shape; the screen only ever sees its own. */
const fromDTO = (dto: MoveRateSetDTO): MoveRateSet => ({
  country: dto.country,
  currency: dto.currency,
  symbol: currencySymbol(dto.currency),
  base: dto.base,
  modifiers: dto.modifiers,
  customFields: dto.custom_fields,
  updatedAt: dto.updated_at,
});

// Module-level so its identity is stable and the query only re-selects when
// the data itself changes.
const selectSets = (dtos: MoveRateSetDTO[]) => dtos.map(fromDTO);

export const useMoveRateSets = () => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();
  return useQuery({
    queryKey: moveRateKeys.lists(),
    queryFn: () => moveRateService.getAll(),
    select: selectSets,
    enabled: !!partnerProfile || !!repProfile,
  });
};

/*
 * Both mutations write their result straight into the cache instead of the
 * usual invalidateQueries. A save returns the server's normalised copy, and the
 * screen decides "unsaved changes" by comparing its draft against the cache —
 * waiting on a refetch would flash "unsaved" for a list that just saved.
 */

export const useSaveMoveRateSet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (set: MoveRateSet) =>
      moveRateService.save(set.country, {
        base: set.base,
        modifiers: set.modifiers,
        custom_fields: set.customFields,
      }),
    onSuccess: (saved) =>
      qc.setQueryData<MoveRateSetDTO[]>(moveRateKeys.lists(), (prev = []) =>
        [...prev.filter((s) => s.country !== saved.country), saved].sort((a, b) =>
          a.country.localeCompare(b.country),
        ),
      ),
  });
};

export const useDeleteMoveRateSet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (country: string) => moveRateService.delete(country),
    onSuccess: (_, country) =>
      qc.setQueryData<MoveRateSetDTO[]>(moveRateKeys.lists(), (prev = []) =>
        prev.filter((s) => s.country !== country),
      ),
  });
};
