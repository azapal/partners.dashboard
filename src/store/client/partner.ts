import { Store } from '@tanstack/store';
import type { PartnerProfile } from '../../service/partnerService';

const STORAGE_KEY = 'partner_profile';

type PartnerState = {
  profile: PartnerProfile | null;
};

const loadFromStorage = (): PartnerProfile | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PartnerProfile) : null;
  } catch {
    return null;
  }
};

export const partnerStore = new Store<PartnerState>({
  profile: loadFromStorage(),
});

export const partnerStoreActions = {
  setProfile: (profile: PartnerProfile) => {
    partnerStore.setState((state) => ({ ...state, profile }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  },

  clearProfile: () => {
    partnerStore.setState((state) => ({ ...state, profile: null }));
    localStorage.removeItem(STORAGE_KEY);
  },
};
