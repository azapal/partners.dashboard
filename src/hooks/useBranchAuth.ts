import { useMutation } from '@tanstack/react-query';
import { branchAuthService } from '../service/repService';
import { repStoreActions } from '../store/client/rep';

export const useSendBranchOtp = () => {
  return useMutation({
    mutationFn: ({ email, branchCode }: { email: string; branchCode: string }) =>
      branchAuthService.sendOtp(email, branchCode),
  });
};

export const useVerifyBranchOtp = () => {
  return useMutation({
    mutationFn: ({ email, otp, branchCode }: { email: string; otp: string; branchCode: string }) =>
      branchAuthService.verifyOtp(email, otp, branchCode),
    onSuccess: (data) => {
      if (data?.data) {
        repStoreActions.setProfile(data.data);
      }
    },
  });
};
