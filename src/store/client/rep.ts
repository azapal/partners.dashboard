import { Store } from '@tanstack/store';
import type { RepProfile } from '../../service/repService';

const STORAGE_KEY = 'rep_profile';

type RepState = {
  profile: RepProfile | null;
};

const loadFromStorage = (): RepProfile | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RepProfile) : null;
  } catch {
    return null;
  }
};

export const repStore = new Store<RepState>({
  profile: loadFromStorage(),
});

export const repStoreActions = {
  setProfile: (profile: RepProfile) => {
    repStore.setState((state) => ({ ...state, profile }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    localStorage.setItem('rep_auth_token', profile.access);
    localStorage.setItem('rep_refresh_token', profile.refresh);
  },

  clearProfile: () => {
    repStore.setState((state) => ({ ...state, profile: null }));
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('rep_auth_token');
    localStorage.removeItem('rep_refresh_token');
  },
};
