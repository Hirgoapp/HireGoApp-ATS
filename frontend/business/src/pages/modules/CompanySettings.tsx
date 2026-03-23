import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import SurfaceCard from '../../components/ui/SurfaceCard';
import StatePanel from '../../components/ui/StatePanel';
import { useAuthStore } from '../../stores/authStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { fetchAllSettings, fetchSettingsSchema, putSetting, resetSetting, type SettingDefinition } from '../../modules/admin/services/settings.api';
import {
    connectIntegration,
    disconnectIntegration,
    listIntegrations,
    type IntegrationRecord,
} from '../../modules/admin/services/integrations.api';

type TabKey = 'profile' | 'localization' | 'email' | 'notifications' | 'integrations';

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid #d1d5db',
    fontSize: 14,
    backgroundColor: 'white',
};

const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#6b7280',
    marginBottom: 6,
};

function parseJsonSafe(text: string): { ok: true; value: any } | { ok: false; error: string } {
    try {
        const value = text.trim().length ? JSON.parse(text) : {};
        return { ok: true, value };
    } catch (e: any) {
        return { ok: false, error: e?.message || 'Invalid JSON' };
    }
}

export default function CompanySettings() {
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const hasPermission = (permission: string) => permissions.includes('*') || permissions.includes(permission);

    const canViewSettings = hasPermission('settings:view');
    const canUpdateSettings = hasPermission('settings:update');
    const canViewIntegrations = hasPermission('integrations:view');
    const canUpdateIntegrations = hasPermission('integrations:update');

    const [tab, setTab] = useState<TabKey>('profile');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

    const [schema, setSchema] = useState<SettingDefinition[]>([]);
    const [settingsMap, setSettingsMap] = useState<Record<string, any>>({});
    const [integrations, setIntegrations] = useState<IntegrationRecord[]>([]);
    const [integrationsLoading, setIntegrationsLoading] = useState(false);

    // Editable models (derived from settingsMap on load)
    const [companyProfile, setCompanyProfile] = useState<{ name?: string; website?: string; supportEmail?: string; brandColor?: string; logoUrl?: string }>({});
    const [timezone, setTimezone] = useState('UTC');
    const [currency, setCurrency] = useState('USD');
    const [emailSettingsText, setEmailSettingsText] = useState('{}');
    const [notificationPrefsText, setNotificationPrefsText] = useState('{}');

    const [integrationType, setIntegrationType] = useState('aws_s3');
    const [integrationConfigText, setIntegrationConfigText] = useState('{}');

    const [dirty, setDirty] = useState(false);

    const tabs = useMemo(
        () => [
            { key: 'profile' as const, label: 'Company Profile', visible: true },
            { key: 'localization' as const, label: 'Localization', visible: true },
            { key: 'email' as const, label: 'Email', visible: true },
            { key: 'notifications' as const, label: 'Notifications', visible: true },
            { key: 'integrations' as const, label: 'Integrations', visible: true },
        ],
        []
    );

    const timezoneOptions = useMemo(() => {
        const defaults = ['UTC', 'Asia/Kolkata', 'America/New_York', 'Europe/London'];
        const supported =
            typeof (Intl as any).supportedValuesOf === 'function'
                ? ((Intl as any).supportedValuesOf('timeZone') as string[])
                : [];
        const merged = new Set<string>([...defaults, ...supported, timezone]);
        return Array.from(merged).sort((a, b) => a.localeCompare(b));
    }, [timezone]);

    const currencyOptions = useMemo(() => {
        const defaults = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'CAD', 'AUD', 'SGD'];
        const merged = new Set<string>([...defaults, currency]);
        return Array.from(merged).sort((a, b) => a.localeCompare(b));
    }, [currency]);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                if (canViewSettings) {
                    const s = await fetchSettingsSchema();
                    setSchema(s);
                    const all = await fetchAllSettings();
                    const map: Record<string, any> = {};
                    all.forEach((row) => {
                        map[row.setting_key] = row.setting_value;
                    });
                    setSettingsMap(map);

                    const profile = map.company_profile ?? {};
                    setCompanyProfile({
                        name: profile?.name ?? '',
                        website: profile?.website ?? '',
                        supportEmail: profile?.supportEmail ?? '',
                        brandColor: profile?.brandColor ?? '',
                        logoUrl: profile?.logoUrl ?? '',
                    });
                    setTimezone(map.timezone ?? 'UTC');
                    setCurrency(map.currency ?? 'USD');
                    setEmailSettingsText(JSON.stringify(map.email_settings ?? {}, null, 2));
                    setNotificationPrefsText(JSON.stringify(map.notification_preferences ?? {}, null, 2));
                }

                if (canViewIntegrations) {
                    setIntegrationsLoading(true);
                    const list = await listIntegrations();
                    setIntegrations(list);
                }
            } catch (err: any) {
                setError(err?.response?.data?.message || err.message || 'Failed to load settings');
            } finally {
                setIntegrationsLoading(false);
                setLoading(false);
            }
        };

        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showToast = (message: string) => {
        setSuccess(message);
        setTimeout(() => setSuccess(null), 2500);
    };

    const saveKey = async (key: string, value: any) => {
        if (!canUpdateSettings) {
            setError('Missing required permissions: settings:update');
            return;
        }
        try {
            setSavingKey(key);
            setError(null);
            await putSetting(key, value);
            // Re-fetch to confirm persistence and keep UI consistent with backend
            const all = await fetchAllSettings();
            const map: Record<string, any> = {};
            all.forEach((row) => {
                map[row.setting_key] = row.setting_value;
            });
            setSettingsMap(map);

            // Keep editors in sync with stored values
            const profile = map.company_profile ?? {};
            setCompanyProfile({
                name: profile?.name ?? '',
                website: profile?.website ?? '',
                supportEmail: profile?.supportEmail ?? '',
                brandColor: profile?.brandColor ?? '',
                logoUrl: profile?.logoUrl ?? '',
            });
            setTimezone(map.timezone ?? 'UTC');
            setCurrency(map.currency ?? 'USD');
            setEmailSettingsText(JSON.stringify(map.email_settings ?? {}, null, 2));
            setNotificationPrefsText(JSON.stringify(map.notification_preferences ?? {}, null, 2));

            const ts = new Date().toLocaleString();
            setLastSavedAt(ts);
            showToast(`Saved • ${ts}`);
            setDirty(false);

            // Refresh global workspace store so other components see the changes
            await useWorkspaceStore.getState().refreshBranding();
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to save setting');
        } finally {
            setSavingKey(null);
        }
    };

    const saveLocalization = async () => {
        if (!canUpdateSettings) {
            setError('Missing required permissions: settings:update');
            return;
        }
        try {
            setSavingKey('localization');
            setError(null);

            await putSetting('timezone', timezone);
            await putSetting('currency', currency);

            const all = await fetchAllSettings();
            const map: Record<string, any> = {};
            all.forEach((row) => {
                map[row.setting_key] = row.setting_value;
            });
            setSettingsMap(map);

            setTimezone(map.timezone ?? 'UTC');
            setCurrency(map.currency ?? 'USD');

            const ts = new Date().toLocaleString();
            setLastSavedAt(ts);
            showToast(`Localization saved • ${ts}`);
            setDirty(false);

            await useWorkspaceStore.getState().refreshBranding();
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to save localization settings');
        } finally {
            setSavingKey(null);
        }
    };

    const schemaByKey = useMemo(() => {
        const m = new Map<string, SettingDefinition>();
        schema.forEach((d) => m.set(d.key, d));
        return m;
    }, [schema]);

    if (!canViewSettings && !canViewIntegrations) {
        return (
            <StatePanel
                title="Access Denied"
                message="You do not have permission to view company settings."
                tone="danger"
            />
        );
    }

    if (loading) {
        return (
            <div className="page-stack">
                <PageHeader title="Company Settings" subtitle="Manage company configuration, notifications, and integrations." />
                <SurfaceCard>
                    <div className="state-message">Loading…</div>
                </SurfaceCard>
            </div>
        );
    }

    return (
        <div className="page-stack">
            <PageHeader
                title="Company Settings"
                subtitle="Manage company profile, preferences, notifications, and integrations."
                actions={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {savingKey ? (
                            <span className="nav-badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                                Saving…
                            </span>
                        ) : null}
                        {success ? (
                            <span className="nav-badge" style={{ background: '#dcfce7', color: '#166534' }}>
                                {success}
                            </span>
                        ) : null}
                        {lastSavedAt ? (
                            <span className="nav-badge" style={{ background: '#f3f4f6', color: '#374151' }}>
                                Last saved: {lastSavedAt}
                            </span>
                        ) : null}
                    </div>
                }
            />

            {error && (
                <SurfaceCard>
                    <div className="state-message" style={{ color: '#b91c1c' }}>
                        {error}
                    </div>
                </SurfaceCard>
            )}

            <SurfaceCard>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {tabs.filter((t) => t.visible).map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            className="ghost-button"
                            onClick={() => setTab(t.key)}
                            style={{
                                borderColor: tab === t.key ? 'color-mix(in srgb, var(--accent-color) 40%, var(--border))' : undefined,
                                background:
                                    tab === t.key
                                        ? 'color-mix(in srgb, var(--accent-color) 10%, white)'
                                        : undefined,
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </SurfaceCard>

            {dirty ? (
                <SurfaceCard>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div className="state-message" style={{ margin: 0 }}>
                            You have unsaved changes.
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                type="button"
                                className="ghost-button"
                                onClick={() => {
                                    // Simple reset: re-apply last loaded values from settingsMap
                                    const profile = settingsMap.company_profile ?? {};
                                    setCompanyProfile({
                                        name: profile?.name ?? '',
                                        website: profile?.website ?? '',
                                        supportEmail: profile?.supportEmail ?? '',
                                        brandColor: profile?.brandColor ?? '',
                                        logoUrl: profile?.logoUrl ?? '',
                                    });
                                    setTimezone(settingsMap.timezone ?? 'UTC');
                                    setCurrency(settingsMap.currency ?? 'USD');
                                    setEmailSettingsText(JSON.stringify(settingsMap.email_settings ?? {}, null, 2));
                                    setNotificationPrefsText(JSON.stringify(settingsMap.notification_preferences ?? {}, null, 2));
                                    setDirty(false);
                                }}
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </SurfaceCard>
            ) : null}

            {tab === 'profile' && (
                <SurfaceCard>
                    <h2 className="block-title">Company Profile</h2>
                    {schemaByKey.get('company_profile')?.description ? (
                        <div className="state-message" style={{ marginBottom: 10 }}>
                            {schemaByKey.get('company_profile')?.description}
                        </div>
                    ) : null}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                        <div>
                            <div style={labelStyle}>Company name</div>
                            <input value={companyProfile.name || ''} onChange={(e) => { setDirty(true); setCompanyProfile((p) => ({ ...p, name: e.target.value })); }} style={inputStyle} />
                        </div>
                        <div>
                            <div style={labelStyle}>Website</div>
                            <input value={companyProfile.website || ''} onChange={(e) => { setDirty(true); setCompanyProfile((p) => ({ ...p, website: e.target.value })); }} style={inputStyle} placeholder="https://…" />
                        </div>
                        <div>
                            <div style={labelStyle}>Support email</div>
                            <input value={companyProfile.supportEmail || ''} onChange={(e) => { setDirty(true); setCompanyProfile((p) => ({ ...p, supportEmail: e.target.value })); }} style={inputStyle} placeholder="support@…" />
                        </div>
                        <div>
                            <div style={labelStyle}>Brand color</div>
                            <input value={companyProfile.brandColor || ''} onChange={(e) => { setDirty(true); setCompanyProfile((p) => ({ ...p, brandColor: e.target.value })); }} style={inputStyle} placeholder="#0c5ccc" />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <div style={labelStyle}>Logo URL</div>
                            <input value={companyProfile.logoUrl || ''} onChange={(e) => { setDirty(true); setCompanyProfile((p) => ({ ...p, logoUrl: e.target.value })); }} style={inputStyle} placeholder="https://…" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                        <button type="button" className="primary-button" onClick={() => saveKey('company_profile', companyProfile)}>
                            Save profile
                        </button>
                        <button
                            type="button"
                            className="ghost-button"
                            onClick={async () => {
                                try {
                                    setError(null);
                                    await resetSetting('company_profile');
                                    setCompanyProfile({});
                                    setSettingsMap((prev) => {
                                        const next = { ...prev };
                                        delete next.company_profile;
                                        return next;
                                    });
                                    showToast('Reset');
                                } catch (err: any) {
                                    setError(err?.response?.data?.message || err.message || 'Failed to reset');
                                }
                            }}
                        >
                            Reset
                        </button>
                    </div>
                </SurfaceCard>
            )}

            {tab === 'localization' && (
                <SurfaceCard>
                    <h2 className="block-title">Localization</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                        <div>
                            <div style={labelStyle}>Timezone</div>
                            <select value={timezone} onChange={(e) => { setDirty(true); setTimezone(e.target.value); }} style={inputStyle}>
                                {timezoneOptions.map((tz) => (
                                    <option key={tz} value={tz}>{tz}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <div style={labelStyle}>Currency</div>
                            <select value={currency} onChange={(e) => { setDirty(true); setCurrency(e.target.value); }} style={inputStyle}>
                                {currencyOptions.map((code) => (
                                    <option key={code} value={code}>{code}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                        <button type="button" className="primary-button" onClick={saveLocalization}>
                            Save localization
                        </button>
                    </div>
                </SurfaceCard>
            )}

            {tab === 'email' && (
                <SurfaceCard>
                    <h2 className="block-title">Email Settings</h2>
                    <div className="state-message" style={{ marginBottom: 10 }}>
                        Advanced configuration stored as JSON. Example: SMTP sender name, reply-to, templates, etc.
                    </div>
                    <textarea
                        value={emailSettingsText}
                        onChange={(e) => { setDirty(true); setEmailSettingsText(e.target.value); }}
                        style={{ ...inputStyle, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', minHeight: 220 }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                        <button
                            type="button"
                            className="primary-button"
                            onClick={() => {
                                const parsed = parseJsonSafe(emailSettingsText);
                                if (!parsed.ok) {
                                    setError(parsed.error);
                                    return;
                                }
                                saveKey('email_settings', parsed.value);
                            }}
                        >
                            Save email settings
                        </button>
                    </div>
                </SurfaceCard>
            )}

            {tab === 'notifications' && (
                <SurfaceCard>
                    <h2 className="block-title">Notification Preferences</h2>
                    <div className="state-message" style={{ marginBottom: 10 }}>
                        Stored as JSON. Example: enable/disable categories, channels, digest settings.
                    </div>
                    <textarea
                        value={notificationPrefsText}
                        onChange={(e) => { setDirty(true); setNotificationPrefsText(e.target.value); }}
                        style={{ ...inputStyle, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', minHeight: 220 }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                        <button
                            type="button"
                            className="primary-button"
                            onClick={() => {
                                const parsed = parseJsonSafe(notificationPrefsText);
                                if (!parsed.ok) {
                                    setError(parsed.error);
                                    return;
                                }
                                saveKey('notification_preferences', parsed.value);
                            }}
                        >
                            Save preferences
                        </button>
                    </div>
                </SurfaceCard>
            )}

            {tab === 'integrations' && (
                <SurfaceCard>
                    <h2 className="block-title">Integrations</h2>

                    {!canViewIntegrations ? (
                        <StatePanel title="Access Denied" message="Missing required permissions: integrations:view" tone="danger" />
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 14 }}>
                                <div>
                                    <div style={labelStyle}>Integration type</div>
                                    <input value={integrationType} onChange={(e) => setIntegrationType(e.target.value)} style={inputStyle} placeholder="aws_s3 / slack / smtp" />
                                </div>
                                <div>
                                    <div style={labelStyle}>Config (JSON)</div>
                                    <input value={integrationConfigText} onChange={(e) => setIntegrationConfigText(e.target.value)} style={inputStyle} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={async () => {
                                        if (!canUpdateIntegrations) {
                                            setError('Missing required permissions: integrations:update');
                                            return;
                                        }
                                        const parsed = parseJsonSafe(integrationConfigText);
                                        if (!parsed.ok) {
                                            setError(parsed.error);
                                            return;
                                        }
                                        try {
                                            setError(null);
                                            const created = await connectIntegration(integrationType, parsed.value);
                                            setIntegrations((prev) => {
                                                const without = prev.filter((i) => i.integration_type !== created.integration_type);
                                                return [created, ...without];
                                            });
                                            showToast('Connected');
                                        } catch (err: any) {
                                            setError(err?.response?.data?.message || err.message || 'Failed to connect');
                                        }
                                    }}
                                >
                                    Connect / Update
                                </button>

                                <button
                                    type="button"
                                    className="ghost-button"
                                    onClick={async () => {
                                        if (!canUpdateIntegrations) {
                                            setError('Missing required permissions: integrations:update');
                                            return;
                                        }
                                        try {
                                            setError(null);
                                            await disconnectIntegration(integrationType);
                                            setIntegrations((prev) => prev.filter((i) => i.integration_type !== integrationType));
                                            showToast('Disconnected');
                                        } catch (err: any) {
                                            setError(err?.response?.data?.message || err.message || 'Failed to disconnect');
                                        }
                                    }}
                                >
                                    Disconnect
                                </button>

                                <button
                                    type="button"
                                    className="ghost-button"
                                    onClick={async () => {
                                        try {
                                            setError(null);
                                            setIntegrationsLoading(true);
                                            const list = await listIntegrations();
                                            setIntegrations(list);
                                            showToast('Refreshed');
                                        } catch (err: any) {
                                            setError(err?.response?.data?.message || err.message || 'Failed to refresh');
                                        } finally {
                                            setIntegrationsLoading(false);
                                        }
                                    }}
                                >
                                    Refresh
                                </button>
                            </div>

                            <div style={{ marginTop: 16 }}>
                                <div style={labelStyle}>Connected integrations</div>
                                {integrationsLoading ? (
                                    <div className="state-message">Loading…</div>
                                ) : integrations.length === 0 ? (
                                    <div className="state-message">No integrations connected.</div>
                                ) : (
                                    <div style={{ display: 'grid', gap: 8 }}>
                                        {integrations.map((i) => (
                                            <div key={i.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#fff' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                                    <div style={{ fontWeight: 800 }}>{i.integration_type}</div>
                                                    <span className="nav-badge" style={{ background: i.is_active ? '#dcfce7' : '#fee2e2', color: i.is_active ? '#166534' : '#991b1b' }}>
                                                        {i.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                <pre style={{ margin: '10px 0 0', fontSize: 12, color: '#374151', background: '#f9fafb', borderRadius: 12, padding: 10, overflowX: 'auto' }}>
                                                    {JSON.stringify(i.config ?? {}, null, 2)}
                                                </pre>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </SurfaceCard>
            )}
        </div>
    );
}

