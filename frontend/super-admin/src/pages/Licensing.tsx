import { Zap, Plus, Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';

interface LicenseTier {
    id: string;
    name: string;
    slug: 'basic' | 'premium' | 'enterprise';
    price: number;
    modules: string[];
    userLimit: number;
    features: string[];
    createdAt: string;
}

const DEFAULT_TIERS: LicenseTier[] = [
    {
        id: '1',
        name: 'Basic',
        slug: 'basic',
        price: 99,
        userLimit: 5,
        modules: ['candidates', 'jobs'],
        features: ['Basic candidate management', 'Job postings', 'Email notifications'],
        createdAt: '2026-01-01T00:00:00Z',
    },
    {
        id: '2',
        name: 'Premium',
        slug: 'premium',
        price: 299,
        userLimit: 25,
        modules: ['candidates', 'jobs', 'interviews', 'custom_fields'],
        features: ['Advanced candidate management', 'Interview scheduling', 'Custom fields', 'Analytics', 'Email integrations'],
        createdAt: '2026-01-01T00:00:00Z',
    },
    {
        id: '3',
        name: 'Enterprise',
        slug: 'enterprise',
        price: 999,
        userLimit: 1000,
        modules: ['candidates', 'jobs', 'interviews', 'offers', 'custom_fields', 'analytics', 'integrations'],
        features: ['Full feature access', 'Advanced analytics', 'All integrations', 'Custom workflows', 'Dedicated support'],
        createdAt: '2026-01-01T00:00:00Z',
    },
];

const ALL_AVAILABLE_MODULES = [
    'candidates',
    'jobs',
    'interviews',
    'offers',
    'custom_fields',
    'analytics',
    'integrations',
];

const MODULE_NAMES: Record<string, string> = {
    candidates: 'Candidates',
    jobs: 'Jobs',
    interviews: 'Interviews',
    offers: 'Offers',
    custom_fields: 'Custom Fields',
    analytics: 'Analytics',
    integrations: 'Integrations',
};

export default function Licensing() {
    const [tiers, setTiers] = useState<LicenseTier[]>(DEFAULT_TIERS);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<Partial<LicenseTier>>({
        name: '',
        slug: 'basic',
        price: 99,
        userLimit: 5,
        modules: [],
        features: [],
    });

    const handleAddTier = () => {
        setFormData({
            name: '',
            slug: 'basic',
            price: 99,
            userLimit: 5,
            modules: [],
            features: [],
        });
        setEditingId(null);
        setShowForm(true);
    };

    const handleEditTier = (tier: LicenseTier) => {
        setFormData(tier);
        setEditingId(tier.id);
        setShowForm(true);
    };

    const handleSaveTier = () => {
        if (!formData.name || !formData.slug) {
            alert('Name and slug are required');
            return;
        }

        if (editingId) {
            setTiers(tiers.map(t => t.id === editingId ? { ...formData, id: editingId, createdAt: t.createdAt } as LicenseTier : t));
        } else {
            setTiers([
                ...tiers,
                {
                    id: Math.random().toString(),
                    name: formData.name || '',
                    slug: formData.slug as any || 'basic',
                    price: formData.price || 99,
                    userLimit: formData.userLimit || 5,
                    modules: formData.modules || [],
                    features: formData.features || [],
                    createdAt: new Date().toISOString(),
                },
            ]);
        }
        setShowForm(false);
    };

    const handleDeleteTier = (id: string) => {
        if (confirm('Are you sure you want to delete this tier?')) {
            setTiers(tiers.filter(t => t.id !== id));
        }
    };

    const toggleModule = (module: string) => {
        setFormData(prev => ({
            ...prev,
            modules: prev.modules?.includes(module)
                ? prev.modules.filter(m => m !== module)
                : [...(prev.modules || []), module],
        }));
    };

    return (
        <div className="max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <Zap className="w-8 h-8 text-brand-600" />
                        <h1 className="text-3xl font-bold text-white">License Tiers & Features</h1>
                    </div>
                    <button
                        onClick={handleAddTier}
                        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add Tier
                    </button>
                </div>
                <p className="text-gray-400">Define and manage license tiers with module access and features</p>
            </div>

            {/* Form */}
            {showForm && (
                <div className="mb-8 bg-gray-800 rounded-lg border border-gray-700 p-6">
                    <h2 className="text-xl font-semibold text-white mb-6">
                        {editingId ? 'Edit License Tier' : 'New License Tier'}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Tier Name</label>
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none"
                                placeholder="e.g., Premium"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Slug</label>
                            <select
                                value={formData.slug || 'basic'}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value as any })}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none"
                            >
                                <option value="basic">Basic</option>
                                <option value="premium">Premium</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Monthly Price ($)</label>
                            <input
                                type="number"
                                value={formData.price || 99}
                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">User Limit</label>
                            <input
                                type="number"
                                value={formData.userLimit || 5}
                                onChange={(e) => setFormData({ ...formData, userLimit: Number(e.target.value) })}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Module Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-3">Included Modules</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {ALL_AVAILABLE_MODULES.map(module => (
                                <label key={module} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.modules?.includes(module) || false}
                                        onChange={() => toggleModule(module)}
                                        className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                                    />
                                    <span className="text-gray-300">{MODULE_NAMES[module]}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Features */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Features (comma-separated)</label>
                        <textarea
                            value={formData.features?.join(', ') || ''}
                            onChange={(e) => setFormData({ ...formData, features: e.target.value.split(',').map(f => f.trim()) })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none"
                            placeholder="Feature 1, Feature 2, Feature 3"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSaveTier}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Save Tier
                        </button>
                        <button
                            onClick={() => setShowForm(false)}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Tiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tiers.map(tier => (
                    <div key={tier.id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors">
                        {/* Header */}
                        <div className="bg-gray-700 px-6 py-4 border-b border-gray-700">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                                    <p className="text-sm text-gray-400">Slug: {tier.slug}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditTier(tier)}
                                        className="p-2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTier(tier.id)}
                                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-4">
                            {/* Price */}
                            <div className="mb-4">
                                <p className="text-3xl font-bold text-white">
                                    ${tier.price}
                                    <span className="text-lg text-gray-400">/month</span>
                                </p>
                                <p className="text-sm text-gray-400 mt-1">Up to {tier.userLimit} users</p>
                            </div>

                            {/* Modules */}
                            <div className="mb-4">
                                <p className="text-sm font-semibold text-gray-300 mb-2">Modules</p>
                                <div className="space-y-1">
                                    {tier.modules.length > 0 ? (
                                        tier.modules.map(module => (
                                            <div key={module} className="text-sm text-gray-400 flex items-center gap-2">
                                                <span className="text-brand-500">✓</span>
                                                {MODULE_NAMES[module]}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No modules</p>
                                    )}
                                </div>
                            </div>

                            {/* Features */}
                            <div>
                                <p className="text-sm font-semibold text-gray-300 mb-2">Features</p>
                                <ul className="text-sm text-gray-400 space-y-1">
                                    {tier.features.length > 0 ? (
                                        tier.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-brand-500 mt-0.5">•</span>
                                                {feature}
                                            </li>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic">No features defined</p>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
