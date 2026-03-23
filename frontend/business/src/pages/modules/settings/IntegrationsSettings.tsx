import React, { useMemo, useState, useEffect } from 'react';
import {
    addGoogleSenderAccount,
    disableGoogleSenderAccount,
    getGoogleAuthorizeUrl,
    listGoogleSenderAccounts,
    listIntegrations,
    connectIntegration,
    disconnectIntegration,
    type IntegrationAccountRecord,
} from '../../../modules/admin/services/integrations.api';
import { fetchAllSettings, putSetting, type SettingRecord } from '../../../modules/admin/services/settings.api';
import { useAuthStore } from '../../../stores/authStore';
import PageHeader from '../../../components/ui/PageHeader';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import StatePanel from '../../../components/ui/StatePanel';
import { API_BASE_URL } from '../../../services/api';

interface Integration {
    id: string;
    integration_type: string;
    config: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

const INTEGRATION_TYPES = [
    { id: 'google_drive', label: 'Google Drive', icon: '📄', description: 'Cloud storage integration' },
    { id: 'onedrive', label: 'OneDrive', icon: '☁️', description: 'Microsoft cloud storage' },
    { id: 'slack', label: 'Slack', icon: '💬', description: 'Team messaging integration' },
    { id: 'aws_s3', label: 'AWS S3', icon: '📦', description: 'Amazon S3 storage' },
    { id: 'smtp', label: 'SMTP', icon: '✉️', description: 'Email server configuration' },
];

export default function IntegrationsSettings() {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [googleAccounts, setGoogleAccounts] = useState<IntegrationAccountRecord[]>([]);
    const [settings, setSettings] = useState<SettingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [configJson, setConfigJson] = useState<string>('{}');
    const [connecting, setConnecting] = useState(false);
    const [googleModalOpen, setGoogleModalOpen] = useState(false);
    const [googleEmail, setGoogleEmail] = useState('');
    const [googleBusy, setGoogleBusy] = useState(false);
    const [routingBusy, setRoutingBusy] = useState(false);

    const [routingRules, setRoutingRules] = useState<{
        alerts_sender: string | null;
        notifications_sender: string | null;
        invites_sender: string | null;
        recruiter_to_candidate_mode: 'user' | 'shared';
        recruiter_fallback_sender: string | null;
    }>({
        alerts_sender: null,
        notifications_sender: null,
        invites_sender: null,
        recruiter_to_candidate_mode: 'user',
        recruiter_fallback_sender: null,
    });

    const permissions = useAuthStore((s: any) => s.user?.permissions || []);
    const canView = permissions.includes('integrations:view');
    const canUpdate = permissions.includes('integrations:update');

    useEffect(() => {
        if (canView) {
            loadIntegrations();
        }
    }, [canView]);

    useEffect(() => {
        if (canView) {
            loadGoogleAccounts();
        }
    }, [canView]);

    useEffect(() => {
        if (canView) {
            loadSettings();
        }
    }, [canView]);

    async function loadIntegrations() {
        try {
            setLoading(true);
            const data = await listIntegrations();
            setIntegrations(data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load integrations');
        } finally {
            setLoading(false);
        }
    }

    async function loadGoogleAccounts() {
        try {
            const rows = await listGoogleSenderAccounts();
            setGoogleAccounts(rows);
        } catch (err: any) {
            // keep integrations page usable even if accounts API fails
            setError(err.response?.data?.message || 'Failed to load Google sender accounts');
        }
    }

    async function loadSettings() {
        try {
            const rows = await fetchAllSettings();
            setSettings(rows);
            const routing = rows.find((s) => s.setting_key === 'email_routing_rules')?.setting_value;
            if (routing && typeof routing === 'object') {
                setRoutingRules((prev) => ({
                    ...prev,
                    ...routing,
                }));
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load settings');
        }
    }

    const googleVerified = useMemo(
        () => googleAccounts.filter((a) => a.is_active && a.is_verified),
        [googleAccounts],
    );

    const googleVerifiedEmails = useMemo(() => googleVerified.map((a) => a.email), [googleVerified]);

    async function handleConnect() {
        if (!selectedType || !canUpdate) return;
        try {
            setConnecting(true);
            setError(null);

            // OAuth-based integrations (company-owned Google/Microsoft)
            if (selectedType === 'google_drive') {
                // If no verified sender mailbox yet, connect one first.
                // Otherwise, open the sender manager so admin can add/verify more.
                if (googleVerified.length === 0) {
                    setGoogleModalOpen(true);
                    return;
                }
                setGoogleModalOpen(true);
                return;
            }
            if (selectedType === 'onedrive') {
                window.location.href = `${API_BASE_URL}/integrations/oauth/microsoft/authorize`;
                return;
            }

            const config = configJson.trim() ? JSON.parse(configJson) : {};
            await connectIntegration(selectedType, config);
            setSelectedType(null);
            setConfigJson('{}');
            await loadIntegrations();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to connect integration');
        } finally {
            setConnecting(false);
        }
    }

    async function handleGoogleAdd() {
        if (!googleEmail.trim()) return;
        try {
            setGoogleBusy(true);
            setError(null);
            const created = await addGoogleSenderAccount(googleEmail.trim());
            setGoogleAccounts((prev) => {
                const without = prev.filter((p) => p.email !== created.email);
                return [...without, created].sort((a, b) => a.email.localeCompare(b.email));
            });
            setGoogleEmail('');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to add sender email');
        } finally {
            setGoogleBusy(false);
        }
    }

    async function handleGoogleVerify(email: string) {
        // Fetch the authorize URL with JWT, then redirect the browser.
        const url = await getGoogleAuthorizeUrl(email);
        window.location.href = url;
    }

    async function handleGoogleDisable(email: string) {
        try {
            setGoogleBusy(true);
            setError(null);
            const updated = await disableGoogleSenderAccount(email);
            if (updated) {
                setGoogleAccounts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to disable sender email');
        } finally {
            setGoogleBusy(false);
        }
    }

    async function saveRoutingRules(next: typeof routingRules) {
        try {
            setRoutingBusy(true);
            setError(null);
            const saved = await putSetting('email_routing_rules', next);
            setSettings((prev) => {
                const without = prev.filter((s) => s.setting_key !== 'email_routing_rules');
                return [...without, saved];
            });
            setRoutingRules(next);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to save routing rules');
        } finally {
            setRoutingBusy(false);
        }
    }

    async function handleDisconnect(integrationType: string) {
        if (!canUpdate) return;
        try {
            setError(null);
            await disconnectIntegration(integrationType);
            await loadIntegrations();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to disconnect integration');
        }
    }

    if (!canView) {
        return <StatePanel title="Access Denied" message="You don't have permission to view integrations." />;
    }

    const connectedTypes = new Set(integrations.filter((i) => i.is_active).map((i) => i.integration_type));

    return (
        <div>
            <PageHeader
                title="Integrations"
                subtitle="Connect external services to enhance your ATS workflow"
                actions={[]}
            />

            {error && (
                <SurfaceCard>
                    <div style={{ color: '#b91c1c' }}>{error}</div>
                </SurfaceCard>
            )}

            <SurfaceCard>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                    {INTEGRATION_TYPES.map((type) => {
                        const isConnected = connectedTypes.has(type.id);
                        const integration = integrations.find((i) => i.integration_type === type.id && i.is_active);

                        return (
                            <div
                                key={type.id}
                                style={{
                                    padding: '1.5rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                    display: 'grid',
                                    gridTemplateRows: '1fr auto',
                                    gap: '1rem',
                                    opacity: isConnected ? 1 : 0.9,
                                    borderLeft: isConnected ? '4px solid #22c55e' : '4px solid #e5e7eb',
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{type.icon}</div>
                                    <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                        {type.label}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{type.description}</div>

                                    {integration && (
                                        <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#10b981' }}>
                                            ✅ Connected {new Date(integration.created_at).toLocaleDateString()}
                                        </div>
                                    )}
                                    {type.id === 'google_drive' && googleVerified.length > 0 && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#374151' }}>
                                            Verified senders: {googleVerified.length}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: isConnected ? '1fr auto' : '1fr', gap: '0.5rem' }}>
                                    {!isConnected ? (
                                        <button
                                            onClick={() => {
                                                // OAuth integrations should not show the JSON config modal
                                                if (type.id === 'google_drive') {
                                                    setGoogleModalOpen(true);
                                                    return;
                                                }
                                                if (type.id === 'onedrive') {
                                                    window.location.href = `${API_BASE_URL}/integrations/oauth/microsoft/authorize`;
                                                    return;
                                                }

                                                setSelectedType(type.id);
                                                setConfigJson('{}');
                                            }}
                                            disabled={!canUpdate || selectedType === type.id}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: canUpdate ? '#3b82f6' : '#d1d5db',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0.375rem',
                                                cursor: canUpdate ? 'pointer' : 'not-allowed',
                                                fontSize: '0.875rem',
                                                fontWeight: '500',
                                            }}
                                        >
                                            {selectedType === type.id ? 'Configuring...' : 'Connect'}
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                disabled={!canUpdate}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: '#f3f4f6',
                                                    color: '#6b7280',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '0.375rem',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDisconnect(type.id)}
                                                disabled={!canUpdate}
                                                style={{
                                                    padding: '0.5rem 0.75rem',
                                                    background: '#fef2f2',
                                                    color: '#991b1b',
                                                    border: '1px solid #fecaca',
                                                    borderRadius: '0.375rem',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                }}
                                            >
                                                Disconnect
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </SurfaceCard>

            <SurfaceCard>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>Email routing rules (Google)</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Choose which verified company mailbox sends each type of system email. Recruiter emails can be sent from the logged-in
                        recruiter (recommended).
                    </div>

                    {googleVerifiedEmails.length === 0 ? (
                        <div style={{ padding: '0.75rem', border: '1px dashed #d1d5db', borderRadius: 10, color: '#6b7280' }}>
                            No verified Google senders yet. Verify at least one sender email to configure routing.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: 6 }}>Alerts sender</div>
                                <select
                                    value={routingRules.alerts_sender ?? ''}
                                    onChange={(e) =>
                                        saveRoutingRules({
                                            ...routingRules,
                                            alerts_sender: e.target.value ? e.target.value : null,
                                        })
                                    }
                                    disabled={routingBusy}
                                    style={{ width: '100%', padding: '0.65rem', borderRadius: 10, border: '1px solid #d1d5db' }}
                                >
                                    <option value="">(not set)</option>
                                    {googleVerifiedEmails.map((email) => (
                                        <option key={email} value={email}>
                                            {email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: 6 }}>Notifications sender</div>
                                <select
                                    value={routingRules.notifications_sender ?? ''}
                                    onChange={(e) =>
                                        saveRoutingRules({
                                            ...routingRules,
                                            notifications_sender: e.target.value ? e.target.value : null,
                                        })
                                    }
                                    disabled={routingBusy}
                                    style={{ width: '100%', padding: '0.65rem', borderRadius: 10, border: '1px solid #d1d5db' }}
                                >
                                    <option value="">(not set)</option>
                                    {googleVerifiedEmails.map((email) => (
                                        <option key={email} value={email}>
                                            {email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: 6 }}>Invites sender</div>
                                <select
                                    value={routingRules.invites_sender ?? ''}
                                    onChange={(e) =>
                                        saveRoutingRules({
                                            ...routingRules,
                                            invites_sender: e.target.value ? e.target.value : null,
                                        })
                                    }
                                    disabled={routingBusy}
                                    style={{ width: '100%', padding: '0.65rem', borderRadius: 10, border: '1px solid #d1d5db' }}
                                >
                                    <option value="">(not set)</option>
                                    {googleVerifiedEmails.map((email) => (
                                        <option key={email} value={email}>
                                            {email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: 6 }}>Recruiter → candidate emails</div>
                                <select
                                    value={routingRules.recruiter_to_candidate_mode}
                                    onChange={(e) =>
                                        saveRoutingRules({
                                            ...routingRules,
                                            recruiter_to_candidate_mode: (e.target.value as any) || 'user',
                                        })
                                    }
                                    disabled={routingBusy}
                                    style={{ width: '100%', padding: '0.65rem', borderRadius: 10, border: '1px solid #d1d5db' }}
                                >
                                    <option value="user">Send from logged-in recruiter</option>
                                    <option value="shared">Send from shared mailbox</option>
                                </select>
                                {routingRules.recruiter_to_candidate_mode === 'shared' && (
                                    <div style={{ marginTop: 8 }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: 6 }}>
                                            Shared sender for recruiter emails
                                        </div>
                                        <select
                                            value={routingRules.recruiter_fallback_sender ?? ''}
                                            onChange={(e) =>
                                                saveRoutingRules({
                                                    ...routingRules,
                                                    recruiter_fallback_sender: e.target.value ? e.target.value : null,
                                                })
                                            }
                                            disabled={routingBusy}
                                            style={{ width: '100%', padding: '0.65rem', borderRadius: 10, border: '1px solid #d1d5db' }}
                                        >
                                            <option value="">(not set)</option>
                                            {googleVerifiedEmails.map((email) => (
                                                <option key={email} value={email}>
                                                    {email}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {routingBusy && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Saving…</div>}
                </div>
            </SurfaceCard>

            {/* Google Sender Accounts Modal */}
            {googleModalOpen && canUpdate && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'grid',
                        placeItems: 'center',
                        zIndex: 1100,
                    }}
                    onClick={() => setGoogleModalOpen(false)}
                >
                    <div
                        style={{
                            background: 'white',
                            padding: '1.5rem',
                            maxWidth: '720px',
                            width: '92%',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            borderRadius: '0.75rem',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>Google Workspace senders</div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                    Add company emails and verify by signing in with that mailbox.
                                </div>
                            </div>
                            <button
                                onClick={() => setGoogleModalOpen(false)}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    background: '#f3f4f6',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                }}
                            >
                                Close
                            </button>
                        </div>

                        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem' }}>
                            <input
                                value={googleEmail}
                                onChange={(e) => setGoogleEmail(e.target.value)}
                                placeholder="alerts@company.com"
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: 10,
                                    border: '1px solid #d1d5db',
                                }}
                            />
                            <button
                                onClick={handleGoogleAdd}
                                disabled={googleBusy || !googleEmail.trim()}
                                style={{
                                    padding: '0.75rem 1rem',
                                    background: googleBusy ? '#9ca3af' : '#111827',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 10,
                                    cursor: googleBusy ? 'not-allowed' : 'pointer',
                                    fontWeight: 600,
                                }}
                            >
                                Add
                            </button>
                        </div>

                        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.5rem' }}>
                            {googleAccounts.length === 0 ? (
                                <div style={{ padding: '0.75rem', border: '1px dashed #d1d5db', borderRadius: 10, color: '#6b7280' }}>
                                    No sender emails added yet.
                                </div>
                            ) : (
                                googleAccounts.map((a) => (
                                    <div
                                        key={a.id}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr auto',
                                            gap: '0.75rem',
                                            padding: '0.75rem',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: 10,
                                            alignItems: 'center',
                                            opacity: a.is_active ? 1 : 0.6,
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{a.email}</div>
                                            <div style={{ fontSize: '0.75rem', color: a.is_verified ? '#059669' : '#b45309' }}>
                                                {a.is_verified ? 'Verified' : 'Not verified'}
                                                {!a.is_active ? ' (disabled)' : ''}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            {!a.is_verified && a.is_active && (
                                                <button
                                                    onClick={() => handleGoogleVerify(a.email)}
                                                    style={{
                                                        padding: '0.5rem 0.75rem',
                                                        background: '#3b82f6',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: 8,
                                                        cursor: 'pointer',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Verify (OAuth)
                                                </button>
                                            )}
                                            {a.is_active && (
                                                <button
                                                    onClick={() => handleGoogleDisable(a.email)}
                                                    disabled={googleBusy}
                                                    style={{
                                                        padding: '0.5rem 0.75rem',
                                                        background: '#fef2f2',
                                                        color: '#991b1b',
                                                        border: '1px solid #fecaca',
                                                        borderRadius: 8,
                                                        cursor: 'pointer',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Disable
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Configuration Modal */}
            {selectedType && canUpdate && selectedType !== 'google_drive' && selectedType !== 'onedrive' && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'grid',
                        placeItems: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setSelectedType(null)}
                >
                    <div
                        style={{
                            background: 'white',
                            padding: '2rem',
                            maxWidth: '500px',
                            width: '90%',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            borderRadius: '0.5rem',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                        }}
                        onClick={(e: any) => e.stopPropagation()}
                    >
                        <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                            Connect {INTEGRATION_TYPES.find((t) => t.id === selectedType)?.label}
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                Configuration (JSON)
                            </label>
                            <textarea
                                value={configJson}
                                onChange={(e) => setConfigJson(e.target.value)}
                                placeholder={'{\n  "key": "value"\n}'}
                                style={{
                                    width: '100%',
                                    height: '150px',
                                    padding: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                    color: '#111827',
                                }}
                            />
                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                                Leave empty for no configuration, or paste a JSON object
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button
                                onClick={() => setSelectedType(null)}
                                style={{
                                    padding: '0.75rem',
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConnect}
                                disabled={connecting}
                                style={{
                                    padding: '0.75rem',
                                    background: connecting ? '#9ca3af' : '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    cursor: connecting ? 'not-allowed' : 'pointer',
                                    fontWeight: '500',
                                }}
                            >
                                {connecting ? 'Connecting...' : 'Connect'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading && !integrations.length && (
                <StatePanel title="Loading" message="Fetching integrations..." />
            )}

            {!loading && integrations.length === 0 && connectedTypes.size === 0 && (
                <StatePanel
                    title="No Integrations Connected"
                    message="Start by connecting one of the available integrations above"
                />
            )}
        </div>
    );
}
