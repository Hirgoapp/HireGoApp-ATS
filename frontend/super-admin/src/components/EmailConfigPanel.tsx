import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader, Mail, Send } from 'lucide-react';
import {
    getEmailConfig,
    updateEmailConfig,
    testEmailConfig,
    getIntegrationStatuses,
    getAvailableProviders,
    EmailConfig,
    IntegrationStatus,
    EmailProvider,
} from '../services/email-config.api';

interface TestEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTest: (email: string) => Promise<void>;
    isLoading: boolean;
    testResult: { success: boolean; message: string } | null;
}

function TestEmailModal({ isOpen, onClose, onTest, isLoading, testResult }: TestEmailModalProps) {
    const [email, setEmail] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full">
                <h3 className="text-xl font-bold text-white mb-4">Test Email Configuration</h3>

                {!testResult && (
                    <>
                        <div className="mb-4">
                            <label className="block text-white text-sm font-medium mb-2">Recipient Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="test@example.com"
                                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => onTest(email)}
                                disabled={!email || isLoading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 rounded transition"
                            >
                                {isLoading ? 'Sending...' : 'Send Test Email'}
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 rounded transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                )}

                {testResult && (
                    <>
                        <div
                            className={`p-4 rounded mb-4 flex items-center gap-2 ${testResult.success
                                ? 'bg-green-900/30 border border-green-600'
                                : 'bg-red-900/30 border border-red-600'
                                }`}
                        >
                            {testResult.success ? (
                                <>
                                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                    <span className="text-green-300">{testResult.message}</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    <span className="text-red-300">{testResult.message}</span>
                                </>
                            )}
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition"
                        >
                            Close
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

interface ProviderTabProps {
    provider: EmailProvider;
    isActive: boolean;
    isConnected: boolean;
    config: any;
    onConfigChange: (field: string, value: any) => void;
    onSave: () => Promise<void>;
    onTest: () => void;
    isSaving: boolean;
}

function ProviderTab({ provider, isActive, config, onConfigChange, onSave, onTest, isSaving }: ProviderTabProps) {
    if (!isActive) return null;

    return (
        <div className="space-y-4">
            {provider.id === 'graph' && (
                <>
                    <div>
                        <label className="block text-white text-sm font-medium mb-2">Tenant ID</label>
                        <input
                            type="text"
                            value={config.graph?.tenantId || ''}
                            onChange={(e) =>
                                onConfigChange('graph', { ...config.graph, tenantId: e.target.value })
                            }
                            placeholder="Tenant ID from Azure AD"
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-white text-sm font-medium mb-2">Client ID</label>
                        <input
                            type="text"
                            value={config.graph?.clientId || ''}
                            onChange={(e) =>
                                onConfigChange('graph', { ...config.graph, clientId: e.target.value })
                            }
                            placeholder="Client ID from Azure AD"
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-white text-sm font-medium mb-2">Client Secret</label>
                        <input
                            type="password"
                            value={config.graph?.clientSecret || ''}
                            onChange={(e) =>
                                onConfigChange('graph', { ...config.graph, clientSecret: e.target.value })
                            }
                            placeholder="Client secret from Azure AD"
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </>
            )}

            {provider.id === 'smtp' && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-white text-sm font-medium mb-2">SMTP Host</label>
                            <input
                                type="text"
                                value={config.smtp?.host || ''}
                                onChange={(e) => onConfigChange('smtp', { ...config.smtp, host: e.target.value })}
                                placeholder="smtp.gmail.com"
                                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-white text-sm font-medium mb-2">Port</label>
                            <input
                                type="number"
                                value={config.smtp?.port || 587}
                                onChange={(e) =>
                                    onConfigChange('smtp', { ...config.smtp, port: parseInt(e.target.value) })
                                }
                                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-white text-sm font-medium mb-2">SMTP Username</label>
                        <input
                            type="text"
                            value={config.smtp?.user || ''}
                            onChange={(e) => onConfigChange('smtp', { ...config.smtp, user: e.target.value })}
                            placeholder="your-email@gmail.com"
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-white text-sm font-medium mb-2">SMTP Password</label>
                        <input
                            type="password"
                            value={config.smtp?.pass || ''}
                            onChange={(e) => onConfigChange('smtp', { ...config.smtp, pass: e.target.value })}
                            placeholder="your-app-password"
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <label className="flex items-center gap-2 p-2 bg-gray-700 rounded cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.smtp?.secure || false}
                            onChange={(e) => onConfigChange('smtp', { ...config.smtp, secure: e.target.checked })}
                            className="w-4 h-4"
                        />
                        <span className="text-white text-sm">Use TLS/SSL (secure connection)</span>
                    </label>
                </>
            )}

            {provider.id === 'sendgrid' && (
                <>
                    <div>
                        <label className="block text-white text-sm font-medium mb-2">SendGrid API Key</label>
                        <input
                            type="password"
                            value={config.sendgrid?.apiKey || ''}
                            onChange={(e) =>
                                onConfigChange('sendgrid', { ...config.sendgrid, apiKey: e.target.value })
                            }
                            placeholder="SG.xxxxxxxxxxxxxxxxx"
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-gray-400 text-sm mt-2">
                            Get your API key from{' '}
                            <a
                                href="https://app.sendgrid.com/settings/api_keys"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                            >
                                SendGrid Settings
                            </a>
                        </p>
                    </div>
                </>
            )}

            <div className="flex gap-2 pt-4">
                <button
                    onClick={onTest}
                    className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded transition"
                >
                    <Send className="w-4 h-4" />
                    Test Configuration
                </button>
                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition"
                >
                    {isSaving ? (
                        <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Configuration'
                    )}
                </button>
            </div>
        </div>
    );
}

export default function EmailConfigPanel() {
    const [config, setConfig] = useState<EmailConfig | null>(null);
    const [providers, setProviders] = useState<EmailProvider[]>([]);
    const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
    const [activeProvider, setActiveProvider] = useState<'graph' | 'smtp' | 'sendgrid'>('graph');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [testLoading, setTestLoading] = useState(false);
    const [showTestModal, setShowTestModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [configData, providersData, integrationsData] = await Promise.all([
                getEmailConfig(),
                getAvailableProviders(),
                getIntegrationStatuses(),
            ]);

            setConfig(configData);
            setProviders(providersData);
            setIntegrations(integrationsData);
            setActiveProvider(configData.provider);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load email configuration');
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveConfig() {
        if (!config) return;

        try {
            setSaving(true);
            setError(null);

            const updated = await updateEmailConfig({
                provider: activeProvider,
                fromEmail: config.fromEmail,
                fromName: config.fromName,
                [activeProvider]: config[activeProvider as keyof EmailConfig],
            });

            setConfig(updated);
            setSuccess('Email configuration saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save configuration');
        } finally {
            setSaving(false);
        }
    }

    async function handleTestConfig(email: string) {
        try {
            setTestLoading(true);
            setError(null);

            const result = await testEmailConfig(email, {
                provider: activeProvider,
                [activeProvider]: config?.[activeProvider as keyof EmailConfig],
            });

            setTestResult(result);
        } catch (err: any) {
            setTestResult({
                success: false,
                message: err.response?.data?.message || 'Test failed',
            });
        } finally {
            setTestLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!config) {
        return (
            <div className="bg-red-900/30 border border-red-600 text-red-300 px-4 py-3 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                Failed to load email configuration
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Error Message */}
            {error && (
                <div className="bg-red-900/30 border border-red-600 text-red-300 px-4 py-3 rounded-lg flex gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    {error}
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="bg-green-900/30 border border-green-600 text-green-300 px-4 py-3 rounded-lg flex gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    {success}
                </div>
            )}

            {/* Sender Configuration */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Sender Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-white text-sm font-medium mb-2">From Email Address</label>
                        <input
                            type="email"
                            value={config.fromEmail}
                            onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-gray-400 text-sm mt-1">Email address shown as sender</p>
                    </div>

                    <div>
                        <label className="block text-white text-sm font-medium mb-2">From Name</label>
                        <input
                            type="text"
                            value={config.fromName}
                            onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-gray-400 text-sm mt-1">Display name for sender</p>
                    </div>
                </div>
            </div>

            {/* Integration Status */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Integration Status</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {integrations.map((integration) => (
                        <div
                            key={integration.type}
                            className={`p-4 rounded-lg border ${integration.isConnected
                                ? 'bg-green-900/20 border-green-600'
                                : 'bg-gray-700 border-gray-600'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="text-white font-medium">{integration.label}</h4>
                                {integration.isConnected ? (
                                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full border border-gray-500" />
                                )}
                            </div>
                            <p className={`text-sm ${integration.isConnected ? 'text-green-300' : 'text-gray-400'}`}>
                                {integration.isConnected ? 'Connected' : 'Not configured'}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Provider Configuration */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Configure Email Provider</h3>

                {/* Provider Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-700">
                    {providers.map((provider) => (
                        <button
                            key={provider.id}
                            onClick={() => setActiveProvider(provider.id as any)}
                            className={`py-2 px-4 font-medium transition ${activeProvider === provider.id
                                ? 'text-blue-400 border-b-2 border-blue-400'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <span className="mr-2">{provider.icon}</span>
                            {provider.name}
                        </button>
                    ))}
                </div>

                {/* Provider Configuration Forms */}
                {providers.map((provider) => (
                    <ProviderTab
                        key={provider.id}
                        provider={provider}
                        isActive={activeProvider === provider.id}
                        isConnected={integrations.find((i) => i.type === provider.id)?.isConnected || false}
                        config={config}
                        onConfigChange={(field, value) => setConfig({ ...config, [field]: value })}
                        onSave={handleSaveConfig}
                        onTest={() => setShowTestModal(true)}
                        isSaving={saving}
                    />
                ))}
            </div>

            {/* Test Email Modal */}
            <TestEmailModal
                isOpen={showTestModal}
                onClose={() => {
                    setShowTestModal(false);
                    setTestResult(null);
                }}
                onTest={handleTestConfig}
                isLoading={testLoading}
                testResult={testResult}
            />
        </div>
    );
}
