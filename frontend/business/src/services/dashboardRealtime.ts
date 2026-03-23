import { io, type Socket } from 'socket.io-client';

interface DashboardRealtimeOverviewEvent {
    companyId: string;
    data: any;
}

interface DashboardRealtimeOptions {
    companyId: string;
    token?: string | null;
    onOverview: (event: DashboardRealtimeOverviewEvent) => void;
    onError?: (message: string) => void;
}

function resolveSocketBaseUrl() {
    const apiBase =
        import.meta.env.VITE_API_BASE_URL ||
        `${window.location.protocol}//${window.location.hostname}:3001/api/v1`;

    return String(apiBase).replace(/\/api\/v1\/?$/, '');
}

export function connectDashboardRealtime(options: DashboardRealtimeOptions) {
    const baseUrl = resolveSocketBaseUrl();
    const socket: Socket = io(`${baseUrl}/ws/dashboard`, {
        transports: ['websocket'],
        auth: options.token ? { token: options.token } : undefined,
        withCredentials: true,
    });

    socket.on('connect', () => {
        socket.emit('dashboard:subscribe', { companyId: options.companyId });
    });

    socket.on('dashboard:overview', (event: DashboardRealtimeOverviewEvent) => {
        options.onOverview(event);
    });

    socket.on('dashboard:error', (payload: { message?: string }) => {
        if (options.onError) {
            options.onError(payload?.message || 'Dashboard live updates failed');
        }
    });

    const disconnect = () => {
        socket.emit('dashboard:unsubscribe', { companyId: options.companyId });
        socket.disconnect();
    };

    return { socket, disconnect };
}
