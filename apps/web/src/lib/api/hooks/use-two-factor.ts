import { useMutation } from '@tanstack/react-query';
import { api } from '../client';

export function useSetupTwoFactor() {
  return useMutation({
    mutationFn: () => api.post<{ secret: string; qrCodeUrl: string; backupCodes: string[] }>('/api/v1/auth/2fa/setup', {}),
  });
}

export function useEnableTwoFactor() {
  return useMutation({
    mutationFn: (code: string) => api.post('/api/v1/auth/2fa/enable', { code }),
  });
}

export function useDisableTwoFactor() {
  return useMutation({
    mutationFn: (code: string) => api.post('/api/v1/auth/2fa/disable', { code }),
  });
}
