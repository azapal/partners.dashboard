// Authentication hooks using React Query
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { queryClient } from '../lib/queryClient';
import { partnerService, partnerProfileService } from '../service/partnerService';
import { partnerStore, partnerStoreActions } from '../store/client/partner';
import { useRepProfile } from './useRepAuth';
import type { PartnerProfile, UpdatePartnerProfilePayload } from '../service/partnerService';

// Types
export type LoginCredentials = {
  email: string;
  password: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  // Add other user properties as needed
};

export type AuthResponse = {
  user: User;
  token: string;
};

// API functions - Replace these with your actual API endpoints
const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  logout: async (): Promise<void> => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Logout failed');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await fetch('/api/auth/me');
    if (!response.ok) throw new Error('Failed to get user');
    return response.json();
  },

  register: async (userData: LoginCredentials): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  },
};

// Query Keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};

// Hooks
export const useCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: authApi.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Store token in localStorage or cookies
      localStorage.setItem('auth_token', data.token);
      // Invalidate user query to refetch
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear token
      localStorage.removeItem('auth_token');
      // Clear all queries
      queryClient.clear();
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      localStorage.setItem('auth_token', data.token);
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
  });
};

export const useSendOtp = () => {
  return useMutation({
    mutationFn: (partnerCode: string) => partnerService.sendOtp(partnerCode),
  });
};

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: ({ partnerCode, otp }: { partnerCode: string; otp: string }) =>
      partnerService.verifyOtp(partnerCode, otp),
    onSuccess: (data) => {
      if (data?.data) {
        localStorage.setItem('auth_token', data.data.access);
        localStorage.setItem('refresh_token', data.data.refresh);
        partnerStoreActions.setProfile(data.data);
        // queryClient.invalidateQueries({ queryKey: authKeys.user() });
      }
    },
  });
};

export const usePartnerProfile = (): PartnerProfile | null => {
  return useSyncExternalStore(
    partnerStore.subscribe,
    () => partnerStore.state.profile,
    () => partnerStore.state.profile,
  );
};

// "Whoever's logged in" for the main dashboard, regardless of which of the two
// disjoint sessions they came in on — a partner-owner, or a Tenant Admin/Super
// Admin employee (the only rep roles RequireAuth lets in here). Prefer the
// partner profile when both are somehow present (shouldn't normally happen —
// the two logins are mutually exclusive UI flows).
export const useCurrentUserDisplay = (): { name: string; email: string } | null => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();

  if (partnerProfile) {
    return { name: partnerProfile.partner_name ?? 'Partner', email: partnerProfile.partner_email ?? '' };
  }
  if (repProfile) {
    return { name: `${repProfile.first_name} ${repProfile.last_name}`.trim(), email: repProfile.email ?? '' };
  }
  return null;
};

export const useUpdatePartnerProfile = () => {
  return useMutation({
    mutationFn: (payload: UpdatePartnerProfilePayload) => partnerProfileService.update(payload),
    onSuccess: (data) => partnerStoreActions.setProfile(data),
  });
};
