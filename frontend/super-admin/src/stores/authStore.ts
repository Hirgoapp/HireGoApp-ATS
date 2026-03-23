import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User {
    id: string | number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    /** Optional tenant label when API includes it */
    company?: { name: string };
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshAccessToken: () => Promise<boolean>;
    /** Called by apiClient after a successful token refresh (keeps store + persist in sync). */
    applyRefreshedTokens: (accessToken: string, refreshToken: string) => void;
    /** Hard reset session (used by apiClient on auth failure). */
    clearSession: () => void;
}

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    '/api';

/** Legacy keys — removed from active use to avoid clashing with business portal / other tools. */
const LEGACY_ACCESS = 'accessToken';
const LEGACY_REFRESH = 'refreshToken';

function scrubLegacyTokenKeys() {
    try {
        localStorage.removeItem(LEGACY_ACCESS);
        localStorage.removeItem(LEGACY_REFRESH);
    } catch {
        /* ignore */
    }
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,

            applyRefreshedTokens: (accessToken: string, refreshToken: string) => {
                set({ accessToken, refreshToken, isAuthenticated: true });
            },

            clearSession: () => {
                scrubLegacyTokenKeys();
                set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
            },

            login: async (email: string, password: string) => {
                const url = `${API_BASE_URL}/super-admin/auth/login`;

                try {
                    const response = await axios.post(url, {
                        email,
                        password,
                    });

                    const payload = response?.data?.data;
                    if (!payload?.accessToken || !payload?.refreshToken) {
                        throw new Error('Invalid response from server (missing tokens)');
                    }

                    const { accessToken, refreshToken, user } = payload;

                    scrubLegacyTokenKeys();

                    set({
                        user,
                        accessToken,
                        refreshToken,
                        isAuthenticated: true,
                    });
                } catch (error: any) {
                    console.error('Super admin login failed', error?.response?.data || error?.message);
                    throw error;
                }
            },

            logout: async () => {
                const state = get();
                try {
                    if (state.accessToken) {
                        await axios.post(
                            `${API_BASE_URL}/super-admin/auth/logout`,
                            {},
                            {
                                headers: {
                                    Authorization: `Bearer ${state.accessToken}`,
                                },
                            },
                        );
                    }
                } catch (error) {
                    console.error('Logout error:', error);
                }

                scrubLegacyTokenKeys();
                get().clearSession();
            },

            refreshAccessToken: async () => {
                const state = get();
                if (!state.refreshToken) {
                    return false;
                }

                try {
                    const response = await axios.post(`${API_BASE_URL}/super-admin/auth/refresh`, {
                        refreshToken: state.refreshToken,
                    });

                    const { accessToken, refreshToken } = response.data.data;
                    set({ accessToken, refreshToken });
                    return true;
                } catch (error) {
                    get().clearSession();
                    return false;
                }
            },
        }),
        {
            name: 'super-admin-auth',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
            /**
             * Rehydration from disk is async. If the user submits login before it finishes,
             * the persisted read can complete afterwards and overwrite the new session with
             * stale empty state — looks like "can't log in". Never clobber an in-memory session.
             */
            merge: (persistedState, currentState) => {
                const disk = persistedState as Partial<{
                    user: User | null;
                    accessToken: string | null;
                    refreshToken: string | null;
                    isAuthenticated: boolean;
                }> | undefined;

                if (currentState.isAuthenticated && currentState.accessToken) {
                    return currentState;
                }

                if (!disk) {
                    return currentState;
                }

                return {
                    ...currentState,
                    user: disk.user ?? currentState.user,
                    accessToken: disk.accessToken ?? currentState.accessToken,
                    refreshToken: disk.refreshToken ?? currentState.refreshToken,
                    isAuthenticated: disk.isAuthenticated ?? currentState.isAuthenticated,
                };
            },
        },
    ),
);

// Drop stale global keys once on app load (older builds mirrored tokens here).
scrubLegacyTokenKeys();
