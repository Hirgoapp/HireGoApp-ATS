import { Package, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import companyService, { Company } from '../services/companyService';

interface ModuleToggle {
    key: string;
    name: string;
    description: string;
    enabled: boolean;
}

export default function Modules() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [modules, setModules] = useState<ModuleToggle[]>([]);
    const [modulesLoading, setModulesLoading] = useState(false);
    const [savingModule, setSavingModule] = useState<string | null>(null);

    const MODULE_META: Record<string, { name: string; description: string }> = {
        jobs: { name: 'Jobs', description: 'Create and manage job postings' },
        candidates: { name: 'Candidates', description: 'Manage job candidates and applications' },
        interviews: { name: 'Interviews', description: 'Schedule and track interviews' },
        offers: { name: 'Offers', description: 'Generate and track job offers' },
        submissions: { name: 'Submissions', description: 'Track candidate submissions and pipeline activity' },
        reports: { name: 'Reports', description: 'Access reporting and exports' },
        analytics: { name: 'Analytics', description: 'View recruitment analytics and dashboards' },
        custom_fields: { name: 'Custom Fields', description: 'Configure custom form fields' },
        bulk_import: { name: 'Bulk Import', description: 'Import data in bulk (candidates/jobs)' },
        api: { name: 'API', description: 'Enable API access for integrations' },
        webhooks: { name: 'Webhooks', description: 'Enable outbound event webhooks' },
        sso: { name: 'SSO', description: 'Enable SSO authentication options' },
        // keep legacy key if it exists in some envs
        integrations: { name: 'Integrations', description: 'Connect with external systems' },
    };

    const buildModuleList = (flags: Record<string, any>): Array<Omit<ModuleToggle, 'enabled'> & { enabled: boolean }> => {
        const keys = Object.keys(flags || {}).sort();
        return keys.map((key) => ({
            key,
            name: MODULE_META[key]?.name || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            description: MODULE_META[key]?.description || 'Feature flag',
            enabled: !!flags[key],
        }));
    };

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        setLoading(true);
        try {
            const result = await companyService.getCompanies(1, 100);
            setCompanies(result.companies);
            if (result.companies.length > 0) {
                setSelectedCompanyId(result.companies[0].id);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load companies');
            console.error('Error loading companies:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCompanyId) {
            loadModules(selectedCompanyId);
        }
    }, [selectedCompanyId]);

    const loadModules = async (companyId: string) => {
        setModulesLoading(true);
        try {
            const flags = await companyService.getModules(companyId);
            setModules(buildModuleList(flags));
        } catch (err: any) {
            console.error('Error loading modules:', err);
            setModules([]);
        } finally {
            setModulesLoading(false);
        }
    };

    const toggleModule = async (moduleKey: string, enable: boolean) => {
        if (!selectedCompanyId) return;

        setSavingModule(moduleKey);
        try {
            if (enable) {
                await companyService.enableModule(selectedCompanyId, moduleKey);
            } else {
                await companyService.disableModule(selectedCompanyId, moduleKey);
            }
            // Update local state
            setModules(modules.map(m =>
                m.key === moduleKey ? { ...m, enabled: enable } : m
            ));
        } catch (err: any) {
            console.error(`Error toggling module ${moduleKey}:`, err);
            alert(`Failed to ${enable ? 'enable' : 'disable'} module: ${err.response?.data?.message || 'Unknown error'}`);
        } finally {
            setSavingModule(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Package className="w-8 h-8 text-brand-600" />
                    <h1 className="text-3xl font-bold text-white">Module Management</h1>
                </div>
                <p className="text-gray-400">Enable or disable modules for each company</p>
            </div>

            {error && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {/* Company Selector */}
            {companies.length > 0 && (
                <div className="mb-8 bg-gray-800 rounded-lg border border-gray-700 p-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3">Select Company</label>
                    <select
                        value={selectedCompanyId || ''}
                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-600"
                    >
                        {companies.map(company => (
                            <option key={company.id} value={company.id}>
                                {company.name} ({company.licenseType})
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Modules Grid */}
            {modulesLoading ? (
                <div className="text-center text-gray-400">Loading modules...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modules.map(module => (
                        <div
                            key={module.key}
                            className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white">{module.name}</h3>
                                    <p className="text-sm text-gray-400 mt-1">{module.description}</p>
                                </div>
                                <button
                                    onClick={() => toggleModule(module.key, !module.enabled)}
                                    disabled={savingModule === module.key}
                                    className={`ml-4 flex-shrink-0 relative inline-flex h-8 w-14 rounded-full transition-colors ${module.enabled
                                        ? 'bg-brand-600'
                                        : 'bg-gray-600'
                                        } ${savingModule === module.key ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                        }`}
                                >
                                    <span
                                        className={`inline-flex h-8 w-8 transform rounded-full bg-white transition-transform ${module.enabled ? 'translate-x-6' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                {module.enabled ? (
                                    <>
                                        <Check className="w-4 h-4 text-green-400" />
                                        <span className="text-sm text-green-400">Enabled</span>
                                    </>
                                ) : (
                                    <>
                                        <X className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm text-gray-500">Disabled</span>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
