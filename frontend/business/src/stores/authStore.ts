import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export interface BusinessUser {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    role: string;
    permissions: string[];
    avatarUrl?: string;
    lastLoginAt?: string;
    company: { id: string; name: string };
}

interface AuthState {
    user: BusinessUser | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    sessionStartedAt: string | null;
    previousLoginAt: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    setTokens: (token: string, refreshToken: string) => void;
    clear: () => void;
}

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:3001/api/v1`;

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            sessionStartedAt: null,
            previousLoginAt: null,

            login: async (email: string, password: string) => {
                const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
                if (res.data?.success) {
                    const { token, refreshToken, user } = res.data.data;
                    const nowIso = new Date().toISOString();
                    const previousLoginAt =
                        user?.lastLoginAt ||
                        user?.last_login_at ||
                        get().sessionStartedAt ||
                        get().previousLoginAt ||
                        null;

                    set({
                        user: {
                            ...user,
                            avatarUrl: user?.avatarUrl || user?.avatar_url || undefined,
                            lastLoginAt: user?.lastLoginAt || user?.last_login_at || undefined,
                        },
                        token,
                        refreshToken,
                        isAuthenticated: true,
                        sessionStartedAt: nowIso,
                        previousLoginAt,
                    });
                } else {
                    throw new Error(res.data?.message || 'Login failed');
                }
            },

            logout: async () => {
                const state = get();
                try {
                    if (state.token) {
                        await axios.post(
                            `${API_BASE_URL}/auth/logout`,
                            {},
                            { headers: { Authorization: `Bearer ${state.token}` } }
                        );
                    }
                } finally {
                    set({
                        user: null,
                        token: null,
                        refreshToken: null,
                        isAuthenticated: false,
                        previousLoginAt: state.sessionStartedAt || state.previousLoginAt,
                        sessionStartedAt: null,
                    });
                }
            },

            setTokens: (token: string, refreshToken: string) => {
                set({ token, refreshToken, isAuthenticated: !!token });
            },

            clear: () =>
                set((state) => ({
                    user: null,
                    token: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    previousLoginAt: state.sessionStartedAt || state.previousLoginAt,
                    sessionStartedAt: null,
                })),
        }),
        {
            name: 'ats-business-auth',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
                sessionStartedAt: state.sessionStartedAt,
                previousLoginAt: state.previousLoginAt,
            }),
        }
    )
);
