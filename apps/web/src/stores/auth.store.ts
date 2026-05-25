import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api/client';
import type { AuthUser } from '@erp/shared-types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setAccessToken: (token: string | null) => void;
  login: (email: string, password: string, organizationSlug?: string, twoFactorCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,

      setUser: (user) => set({ user }),
      setAccessToken: (token) => {
        set({ accessToken: token });
        if (token) localStorage.setItem('access_token', token);
        else localStorage.removeItem('access_token');
      },

      login: async (email, password, organizationSlug, twoFactorCode) => {
        set({ isLoading: true });
        try {
          const result = await api.post<{
            accessToken: string;
            user: AuthUser;
            requiresTwoFactor?: boolean;
          }>('/api/v1/auth/login', { email, password, organizationSlug, twoFactorCode });

          if (result.data?.requiresTwoFactor) {
            throw new Error('TWO_FACTOR_REQUIRED');
          }

          if (result.data?.accessToken) {
            get().setAccessToken(result.data.accessToken);
            set({ user: result.data.user });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await api.post('/api/v1/auth/logout');
        } catch {
          // ignore errors
        } finally {
          set({ user: null, accessToken: null });
          localStorage.removeItem('access_token');
        }
      },

      refreshUser: async () => {
        try {
          const user = await api.get<AuthUser>('/api/v1/auth/me');
          set({ user });
        } catch {
          set({ user: null, accessToken: null });
        }
      },
    }),
    {
      name: 'erp-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    }
  )
);
