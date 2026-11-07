import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/src/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /**
   * False until zustand's `persist` middleware has finished reading
   * `localStorage` on mount. Consumers that render auth-dependent UI (nav
   * role, user menu, route guards) should wait for this before trusting
   * `user`/`isAuthenticated` — otherwise every full page load briefly shows
   * the logged-out/default state before flipping to the real one.
   */
  hasHydrated: boolean;

  login: (token: string, user: User) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      hasHydrated: false,

      login: (accessToken, user) =>
        set({ accessToken, user, isAuthenticated: true }),

      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'auth-storage',
      // Don't persist hasHydrated itself — it must always start false on a
      // fresh load and flip true only once rehydration has actually run.
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
