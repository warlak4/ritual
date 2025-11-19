import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthRole = 'admin' | 'manager' | 'client' | 'guest';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: AuthRole[];
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  roles: AuthRole[];
  user: AuthUser | null;
  setCredentials: (payload: { accessToken: string; refreshToken: string; roles: AuthRole[] }) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      roles: [],
      user: null,
      setCredentials: ({ accessToken, refreshToken, roles }) =>
        set(() => ({
          accessToken,
          refreshToken,
          roles: roles ?? [],
        })),
      setUser: (user) =>
        set((state) => ({
          user,
          roles: user?.roles ?? state.roles,
        })),
      logout: () =>
        set(() => ({
          accessToken: null,
          refreshToken: null,
          roles: [],
          user: null,
        })),
    }),
    {
      name: 'ritual-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        roles: state.roles,
      }),
    },
  ),
);
