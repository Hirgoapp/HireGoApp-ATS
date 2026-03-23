import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    '/api';

/** Read tokens from persist blob before zustand has finished rehydrating (first ms after load). */
function getPersistedAuthState() {
    const authData = localStorage.getItem('super-admin-auth');
    if (!authData) {
        return null;
    }

    try {
        const parsed = JSON.parse(authData);
        return parsed?.state ?? null;
    } catch {
        return null;
    }
}

function getAccessToken(): string | null {
    const fromStore = useAuthStore.getState().accessToken;
    if (fromStore) return fromStore;
    return getPersistedAuthState()?.accessToken ?? null;
}

function getRefreshToken(): string | null {
    const fromStore = useAuthStore.getState().refreshToken;
    if (fromStore) return fromStore;
    return getPersistedAuthState()?.refreshToken ?? null;
}

function clearSuperAdminAuth() {
    useAuthStore.getState().clearSession();
}

function getErrorMessage(data: unknown): string {
    if (data == null) return '';
    if (typeof data === 'string') return data;
    const d = data as { message?: unknown };
    const m = d.message;
    if (typeof m === 'string') return m;
    if (Array.isArray(m)) return m.map(String).join(' ');
    return String(m ?? '');
}

// Create axios instance with default headers
export const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Serialize concurrent 401 handling so only one refresh runs (avoids invalidating the second refresh)
let isRefreshing = false;
const refreshWaiters: Array<{
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
}> = [];

function flushWaiters(token: string) {
    refreshWaiters.splice(0).forEach((w) => w.resolve(token));
}

function rejectWaiters(err: unknown) {
    refreshWaiters.splice(0).forEach((w) => w.reject(err));
}

// Add token to requests
apiClient.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle token refresh on 401
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        if (!originalRequest || error.response?.status !== 401) {
            return Promise.reject(error);
        }

        const reqUrl = String(originalRequest.url || '');
        if (reqUrl.includes('/super-admin/auth/refresh')) {
            clearSuperAdminAuth();
            window.location.href = '/login';
            return Promise.reject(error);
        }

        const message = getErrorMessage(error.response?.data);
        // These cannot be fixed by refresh — clear session
        if (/jwt malformed|invalid signature/i.test(message)) {
            clearSuperAdminAuth();
            window.location.href = '/login';
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise<string>((resolve, reject) => {
                refreshWaiters.push({ resolve, reject });
            })
                .then((accessToken) => {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return apiClient(originalRequest);
                })
                .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const refreshToken = getRefreshToken();
            if (!refreshToken) {
                throw new Error('No refresh token');
            }

            const response = await axios.post(`${API_BASE_URL}/super-admin/auth/refresh`, {
                refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            useAuthStore.getState().applyRefreshedTokens(accessToken, newRefreshToken);

            apiClient.defaults.headers.Authorization = `Bearer ${accessToken}`;
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;

            flushWaiters(accessToken);
            return apiClient(originalRequest);
        } catch (refreshError) {
            rejectWaiters(refreshError);
            clearSuperAdminAuth();
            window.location.href = '/login';
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    },
);

export default apiClient;
