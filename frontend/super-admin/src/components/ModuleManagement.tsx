import { X, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';

type ModuleItem = {
    module: string;
    enabled: boolean;
};

interface ModuleManagementProps {
    companyId: string;
    companyName: string;
    onClose: () => void;
}

export default function ModuleManagement({ companyId, companyName, onClose }: ModuleManagementProps) {
    const [modules, setModules] = useState<ModuleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null); // module name being updated
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const fetchModules = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get(`/super-admin/modules/${companyId}`);
            if (res.data?.success) {
                const data = res.data.data;
                // Expecting an array of { module: string, enabled: boolean }
                if (Array.isArray(data)) {
                    setModules(data as ModuleItem[]);
                } else {
                    setError('Unexpected modules response format');
                }
            } else {
                setError(res.data?.message || 'Failed to fetch modules');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to fetch modules');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModules();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId]);

    const toggleModule = async (item: ModuleItem) => {
        setUpdating(item.module);
        setSuccessMsg(null);
        try {
            const path = item.enabled ? 'disable' : 'enable';
            const res = await apiClient.post(`/super-admin/modules/${companyId}/${path}`, {
                module: item.module,
            });
            if (res.data?.success) {
                setSuccessMsg(`Module ${item.module} ${item.enabled ? 'disabled' : 'enabled'} successfully`);
                await fetchModules();
            } else {
                setError(res.data?.message || 'Failed to update module');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update module');
        } finally {
            setUpdating(null);
            setTimeout(() => setSuccessMsg(null), 1500);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Manage Modules</h2>
                        <p className="text-gray-400 mt-1">{companyName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex flex-col items-center gap-3">
                                <Loader className="w-8 h-8 text-brand-400 animate-spin" />
                                <p className="text-gray-400">Loading modules...</p>
                            </div>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="flex items-center gap-3 p-4 bg-red-600/20 border border-red-600/50 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <span className="text-red-400">{error}</span>
                        </div>
                    )}

                    {!loading && successMsg && (
                        <div className="flex items-center gap-3 p-4 bg-green-600/20 border border-green-600/50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-green-400">{successMsg}</span>
                        </div>
                    )}

                    {!loading && !error && modules.length === 0 && (
                        <div className="text-center text-gray-400 py-8">No modules found for this company.</div>
                    )}

                    {!loading && !error && modules.length > 0 && (
                        <ul className="divide-y divide-gray-700 rounded-md border border-gray-700 overflow-hidden">
                            {modules.map((m) => (
                                <li key={m.module} className="flex items-center justify-between px-4 py-3 bg-gray-800">
                                    <div>
                                        <p className="text-white font-medium">{m.module}</p>
                                        <p className="text-xs text-gray-400">{m.enabled ? 'Enabled' : 'Disabled'}</p>
                                    </div>
                                    <button
                                        onClick={() => toggleModule(m)}
                                        disabled={updating === m.module}
                                        className={`min-w-[120px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${m.enabled
                                                ? 'bg-green-600/20 text-green-400 border-green-600/50 hover:bg-green-600/30'
                                                : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                                            } ${updating === m.module ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {updating === m.module && <Loader className="w-4 h-4 animate-spin" />}
                                        {m.enabled ? 'Disable' : 'Enable'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 border-t border-gray-700">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
