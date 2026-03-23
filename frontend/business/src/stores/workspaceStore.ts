import { create } from 'zustand';
import api from '../services/api';
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

interface SettingRecord {
    setting_key: string;
    setting_value: any;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
    branding: DEFAULT_BRANDING,
    loading: false,
    loaded: false,
    error: null,

    refreshBranding: async () => {
        try {
            set({ loading: true, error: null });
            const response = await api.get('/settings');
            const list: SettingRecord[] = (response.data as any)?.data || [];
            const map = list.reduce<Record<string, any>>((acc, row) => {
                acc[row.setting_key] = row.setting_value;
                return acc;
            }, {});

            const profile = map.company_profile ?? {};
            set({
                branding: {
                    name: profile?.name || DEFAULT_BRANDING.name,
                    logoUrl: profile?.logoUrl || undefined,
                    brandColor: profile?.brandColor || undefined,
                    supportEmail: profile?.supportEmail || DEFAULT_BRANDING.supportEmail,
                    website: profile?.website || undefined,
                    timezone: map.timezone || DEFAULT_BRANDING.timezone,
                    currency: map.currency || DEFAULT_BRANDING.currency,
                },
                loading: false,
                loaded: true,
                error: null,
            });
        } catch (err: any) {
            set((state) => ({
                branding: state.branding || DEFAULT_BRANDING,
                loading: false,
                loaded: true,
                error: err?.response?.data?.message || err?.message || 'Unable to load workspace branding',
            }));
        }
    },
}));
