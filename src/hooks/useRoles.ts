import { useQuery } from '@tanstack/react-query';
import { roleService, type Role } from '../service/partnerService';

/**
 * Roles that hand over the keys — full access to money, pricing and who else
 * gets in. They sort to the bottom of every picker so the one at the top, which
 * the invite form pre-selects, is never the most powerful one going.
 */
// Ordered least to most powerful, so the strongest role ends up last of all.
const KEYS_TO_THE_KINGDOM = ['tenant admin', 'super admin'];

const rank = (role: Role) => {
  const name = (role.name ?? '').trim().toLowerCase();
  const index = KEYS_TO_THE_KINGDOM.indexOf(name);
  return index === -1 ? -1 : index;
};

const byPower = (roles: Role[]) =>
  [...roles].sort((a, b) => rank(a) - rank(b) || (a.name ?? '').localeCompare(b.name ?? ''));

export const useGetRoles = () =>
  useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.getAll(),
    select: byPower,
    staleTime: 10 * 60 * 1000, // roles rarely change
  });
