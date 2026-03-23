import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:3001/api/v1`;

const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (token: string | null, error: any = null) => {
    failedQueue.forEach((prom) => {
        if (token && !error) {
            prom.resolve(token);
        } else {
            prom.reject(error);
        }
    });
    failedQueue = [];
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const state = useAuthStore.getState();
    if (state.token) {
        config.headers = config.headers || {};
        (config.headers as any).Authorization = `Bearer ${state.token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const { refreshToken } = useAuthStore.getState();

            if (!refreshToken) {
                useAuthStore.getState().clear();
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((newToken) => {
                        originalRequest.headers = originalRequest.headers || {};
                        (originalRequest.headers as any).Authorization = `Bearer ${newToken}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            isRefreshing = true;

            try {
                const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
                const { token: newToken, refreshToken: newRefresh } = (res.data as any).data;
                useAuthStore.getState().setTokens(newToken, newRefresh);
                processQueue(newToken);
                originalRequest.headers = originalRequest.headers || {};
                (originalRequest.headers as any).Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshErr) {
                processQueue(null, refreshErr);
                useAuthStore.getState().clear();
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
