import { Settings, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import EmailConfigPanel from '../components/EmailConfigPanel';

interface SystemConfig {
    maintenanceMode: boolean;
    maxUsersPerCompany: number;
    sessionTimeout: number;
    emailNotifications: boolean;
    apiRateLimit: number;
}

const DEFAULT_CONFIG: SystemConfig = {
    maintenanceMode: false,
    maxUsersPerCompany: 1000,
    sessionTimeout: 3600,
    emailNotifications: true,
    apiRateLimit: 1000,
};

export default function SystemSettings() {
    const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        // Simulate loading config from backend
        setTimeout(() => {
            setConfig({
                ...DEFAULT_CONFIG,
                ...JSON.parse(localStorage.getItem('systemConfig') || '{}'),
            });
            setLoading(false);
        }, 500);
    }, []);

    const handleConfigChange = (key: keyof SystemConfig, value: any) => {
        setConfig((prev) => ({ ...prev, [key]: value }));
    };

    const handleSaveConfig = async () => {
        setSaving(true);
        setError(null);

        try {
            // Simulate API call
            localStorage.setItem('systemConfig', JSON.stringify(config));
            setSuccessMessage('System settings saved successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleResetConfig = () => {
        if (!window.confirm('Are you sure you want to reset all settings to defaults?')) return;
        setConfig(DEFAULT_CONFIG);
        localStorage.removeItem('systemConfig');
        setSuccessMessage('Settings reset to defaults!');
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader className="w-8 h-8 text-brand-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">System Settings</h1>
                <p className="text-gray-400 mt-2">Configure platform-wide settings and features</p>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-900/30 border border-red-600 text-red-300 px-4 py-3 rounded-lg flex gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                </div>
            )}
            {successMessage && (
                <div className="bg-green-900/30 border border-green-600 text-green-300 px-4 py-3 rounded-lg flex gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    {successMessage}
                </div>
            )}

            {/* General Settings */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    General Settings
                </h2>

                <div className="space-y-6">
                    {/* Maintenance Mode */}
                    <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div>
                            <h3 className="text-white font-medium">Maintenance Mode</h3>
                            <p className="text-gray-400 text-sm">Temporarily disable access to the platform</p>
                        </div>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.maintenanceMode}
                                onChange={(e) => handleConfigChange('maintenanceMode', e.target.checked)}
                                className="w-5 h-5 cursor-pointer"
                            />
                        </label>
                    </div>

                    {/* Max Users Per Company */}
                    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <label className="block text-white font-medium mb-3">Max Users Per Company</label>
                        <input
                            type="number"
                            value={config.maxUsersPerCompany}
                            onChange={(e) => handleConfigChange('maxUsersPerCompany', parseInt(e.target.value))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none"
                            min="1"
                        />
                        <p className="text-gray-400 text-sm mt-2">
                            Default maximum number of users allowed per company subscription
                        </p>
                    </div>

                    {/* Session Timeout */}
                    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <label className="block text-white font-medium mb-3">Session Timeout (seconds)</label>
                        <input
                            type="number"
                            value={config.sessionTimeout}
                            onChange={(e) => handleConfigChange('sessionTimeout', parseInt(e.target.value))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none"
                            min="300"
                            step="300"
                        />
                        <p className="text-gray-400 text-sm mt-2">
                            How long sessions stay active before auto-logout (in seconds)
                        </p>
                    </div>

                    {/* API Rate Limit */}
                    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <label className="block text-white font-medium mb-3">API Rate Limit (requests/hour)</label>
                        <input
                            type="number"
                            value={config.apiRateLimit}
                            onChange={(e) => handleConfigChange('apiRateLimit', parseInt(e.target.value))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none"
                            min="100"
                            step="100"
                        />
                        <p className="text-gray-400 text-sm mt-2">
                            Maximum API requests allowed per hour per client
                        </p>
                    </div>

                    {/* Email Notifications */}
                    <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div>
                            <h3 className="text-white font-medium">Email Notifications</h3>
                            <p className="text-gray-400 text-sm">Send email alerts for important events</p>
                        </div>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.emailNotifications}
                                onChange={(e) => handleConfigChange('emailNotifications', e.target.checked)}
                                className="w-5 h-5 cursor-pointer"
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Feature Flags */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h2 className="text-xl font-bold text-white mb-4">Feature Flags</h2>
                <p className="text-gray-400 text-sm mb-6">
                    Coming Soon: Enable/disable features for the entire platform
                </p>
                <div className="bg-gray-900/50 rounded-lg p-8 text-center text-gray-400">
                    Feature flag management interface coming in next release
                </div>
            </div>

            {/* License Status */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h2 className="text-xl font-bold text-white mb-4">License Information</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                        <p className="text-gray-400 text-sm">Edition</p>
                        <p className="text-white font-bold text-lg">Enterprise</p>
                    </div>
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                        <p className="text-gray-400 text-sm">Status</p>
                        <p className="text-green-400 font-bold text-lg">Active</p>
                    </div>
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                        <p className="text-gray-400 text-sm">Expires</p>
                        <p className="text-white font-bold">2025-12-31</p>
                    </div>
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                        <p className="text-gray-400 text-sm">Support</p>
                        <p className="text-blue-400 font-bold">Premium</p>
                    </div>
                </div>
            </div>

            {/* Email Configuration */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Email Configuration</h2>
                <EmailConfigPanel />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                <button
                    onClick={handleResetConfig}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                    Reset to Defaults
                </button>
                <button
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition disabled:opacity-50 font-medium"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
