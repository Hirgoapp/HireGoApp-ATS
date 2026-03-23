import api from '../../../services/api';

export interface SettingRecord {
    id: string;
    setting_key: string;
    setting_value: any;
    created_at: string;
    updated_at: string;
}

export interface SettingDefinition {
    key: string;
    label: string;
    description?: string;
    group: 'general' | 'localization' | 'email' | 'notifications';
    type: 'string' | 'number' | 'boolean' | 'json';
    sensitive?: boolean;
    defaultValue: any;
}

export async function fetchSettingsSchema(): Promise<SettingDefinition[]> {
    const res = await api.get('/settings/schema');
    return (res.data as any).data as SettingDefinition[];
}

export async function fetchAllSettings(): Promise<SettingRecord[]> {
    const res = await api.get('/settings');
    return (res.data as any).data as SettingRecord[];
}

export async function setSetting(key: string, value: any): Promise<SettingRecord> {
    const res = await api.post('/settings', { key, value });
    return (res.data as any).data as SettingRecord;
}

export async function putSetting(key: string, value: any): Promise<SettingRecord> {
    const res = await api.put(`/settings/${encodeURIComponent(key)}`, { value });
    return (res.data as any).data as SettingRecord;
}

export async function resetSetting(key: string): Promise<void> {
    await api.post(`/settings/${encodeURIComponent(key)}/reset`, {});
}

export async function deleteSetting(key: string): Promise<void> {
    await api.delete(`/settings/${encodeURIComponent(key)}`);
}

