/** Super Admin React app base (must match <Route path="/app"> in App.tsx) */
export const APP_BASE = '/app';

export const paths = {
    login: '/login',
    dashboard: `${APP_BASE}/dashboard`,
    companies: `${APP_BASE}/companies`,
    companyDetail: (id: string) => `${APP_BASE}/companies/${id}`,
    invites: `${APP_BASE}/invites`,
    settings: `${APP_BASE}/settings`,
} as const;
