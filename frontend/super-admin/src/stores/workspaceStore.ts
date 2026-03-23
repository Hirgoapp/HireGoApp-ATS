import { create } from 'zustand';
import { APP_INFO } from '../navigation/navigation.config';

export interface WorkspaceBranding {
    name: string;
    logoUrl?: string;
    brandColor?: string;
    supportEmail?: string;
    website?: string;
    timezone: string;
    currency: string;
}

interface WorkspaceState {
    branding: WorkspaceBranding;
    loading: boolean;
    loaded: boolean;
    error: string | null;
    refreshBranding: () => Promise<void>;
}

const DEFAULT_BRANDING: WorkspaceBranding = {
    name: APP_INFO.company,
    supportEmail: APP_INFO.supportEmail,
    timezone: 'UTC',
    currency: 'USD',
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
    branding: DEFAULT_BRANDING,
    loading: false,
    loaded: false,
    error: null,

    refreshBranding: async () => {
        // Do not call tenant GET /api/v1/settings here. The business portal uses a company JWT;
        // Super Admin uses a different issuer/secret. A request with the super-admin token returns
        // 401 "invalid signature", and apiClient then clears the session and sends the user to /login.
        set({
            branding: DEFAULT_BRANDING,
            loading: false,
            loaded: true,
            error: null,
        });
    },
}));
