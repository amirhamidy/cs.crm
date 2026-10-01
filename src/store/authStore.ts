"use client";

import { createContext, useContext } from "react";
import { createStore, useStore, type StoreApi } from "zustand";

export interface AuthState {
  username: string | null;
  userType: 1 | 2 | null;
  userId: number | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setAuth: (params: {
    username: string;
    userType: 1 | 2;
    userId: number;
  }) => void;
  clearAuth: () => void;
}

export interface InitialAuth {
  username: string;
  userType: 1 | 2;
  userId: number;
}

export function createAuthStore(initial?: InitialAuth | null) {
  return createStore<AuthState>((set) => ({
    username: initial?.username ?? null,
    userType: initial?.userType ?? null,
    userId: initial?.userId ?? null,
    isAuthenticated: Boolean(initial),
    hasHydrated: true,

    setAuth: ({ username, userType, userId }) =>
      set({
        username,
        userType,
        userId,
        isAuthenticated: true,
        hasHydrated: true,
      }),

    clearAuth: () =>
      set({
        username: null,
        userType: null,
        userId: null,
        isAuthenticated: false,
        hasHydrated: true,
      }),
  }));
}

export const AuthStoreContext = createContext<StoreApi<AuthState> | null>(null);

export function useAuthStore(): AuthState;
export function useAuthStore<T>(selector: (state: AuthState) => T): T;
export function useAuthStore<T>(selector?: (state: AuthState) => T) {
  const store = useContext(AuthStoreContext);

  if (!store) {
    throw new Error("useAuthStore must be used inside <AuthHydrator>");
  }

  return useStore(
    store,
    selector ?? ((state: AuthState) => state as unknown as T),
  );
}
