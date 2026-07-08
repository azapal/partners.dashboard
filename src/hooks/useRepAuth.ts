import { useMutation } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { repAuthService, isSupportRole } from '../service/repService';
import { repStore, repStoreActions } from '../store/client/rep';
import type { RepProfile } from '../service/repService';

export const useSendRepOtp = () => {
  return useMutation({
    mutationFn: ({ email }: { email: string }) => repAuthService.sendOtp(email),
  });
};

export const useVerifyRepOtp = () => {
  return useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      const result = await repAuthService.verifyOtp(email, otp);
      const profile = result?.data;

      if (profile && !isSupportRole(profile.invite_role?.name)) {
        throw new Error('This account is not registered as a Customer Support rep.');
      }

      return result;
    },
    onSuccess: (data) => {
      if (data?.data) {
        repStoreActions.setProfile(data.data);
      }
    },
  });
};

export const useRepProfile = (): RepProfile | null => {
  return useSyncExternalStore(
    repStore.subscribe,
    () => repStore.state.profile,
    () => repStore.state.profile,
  );
};

export const useRepLogout = () => {
  return () => {
    repStoreActions.clearProfile();
  };
};
