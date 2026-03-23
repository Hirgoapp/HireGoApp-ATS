import { Users, Plus, Trash2, Edit2, Lock, AlertCircle, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import userService, { SuperAdminUser, CreateSuperAdminDto } from '../services/userService';
import { z } from 'zod';

const userValidation = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().optional(),
});

export default function UsersPage() {
    const [users, setUsers] = useState<SuperAdminUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<Partial<SuperAdminUser & { password: string }>>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await userService.getSuperAdminUsers();
            setUsers(result.data.users);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClick = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            phone: '',
        });
        setFormErrors({});
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});
        setSubmitting(true);

        try {
            const validated = userValidation.parse(formData);
            await userService.createSuperAdminUser(validated as CreateSuperAdminDto);
            setSuccessMessage('Super admin user created successfully!');
            setShowForm(false);
            loadUsers();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                const errors: Record<string, string> = {};
                err.errors.forEach((error) => {
                    const path = error.path[0]?.toString() || 'general';
                    errors[path] = error.message;
                });
                setFormErrors(errors);
            } else {
                setError(err.response?.data?.message || 'Failed to create user');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await userService.deleteSuperAdminUser(id);
            setSuccessMessage('User deleted successfully!');
            loadUsers();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete user');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Super Admin Users</h1>
                    <p className="text-gray-400 mt-2">Manage platform administrators</p>
                </div>
                <button
                    onClick={handleCreateClick}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition"
                >
                    <Plus className="w-5 h-5" />
                    Add User
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-900/30 border border-red-600 text-red-300 px-4 py-3 rounded-lg flex gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                </div>
            )}
            {successMessage && (
                <div className="bg-green-900/30 border border-green-600 text-green-300 px-4 py-3 rounded-lg">
                    {successMessage}
                </div>
            )}

            {/* Users Table */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader className="w-8 h-8 text-brand-400 animate-spin" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No super admin users yet</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-900 border-b border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Phone</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Last Login</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-900/50 transition">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">{user.email}</td>
                                    <td className="px-6 py-4 text-gray-400">{user.phone || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.isActive
                                            ? 'bg-green-900/30 text-green-300'
                                            : 'bg-red-900/30 text-red-300'
                                            }`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">
                                        {user.lastLoginAt
                                            ? new Date(user.lastLoginAt).toLocaleDateString()
                                            : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                disabled
                                                className="p-2 hover:bg-gray-700 rounded-lg transition opacity-50 cursor-not-allowed"
                                                title="Edit (Coming Soon)"
                                            >
                                                <Edit2 className="w-4 h-4 text-blue-400" />
                                            </button>
                                            <button
                                                disabled
                                                className="p-2 hover:bg-gray-700 rounded-lg transition opacity-50 cursor-not-allowed"
                                                title="Reset Password (Coming Soon)"
                                            >
                                                <Lock className="w-4 h-4 text-yellow-400" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 hover:bg-gray-700 rounded-lg transition"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create User Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">Create Super Admin User</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* First Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                                <input
                                    type="text"
                                    value={formData.firstName || ''}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none ${formErrors.firstName ? 'border-red-500' : 'border-gray-600'
                                        }`}
                                    placeholder="John"
                                />
                                {formErrors.firstName && <p className="text-red-400 text-sm mt-1">{formErrors.firstName}</p>}
                            </div>

                            {/* Last Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    value={formData.lastName || ''}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none ${formErrors.lastName ? 'border-red-500' : 'border-gray-600'
                                        }`}
                                    placeholder="Doe"
                                />
                                {formErrors.lastName && <p className="text-red-400 text-sm mt-1">{formErrors.lastName}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none ${formErrors.email ? 'border-red-500' : 'border-gray-600'
                                        }`}
                                    placeholder="user@example.com"
                                />
                                {formErrors.email && <p className="text-red-400 text-sm mt-1">{formErrors.email}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={formData.password || ''}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none ${formErrors.password ? 'border-red-500' : 'border-gray-600'
                                        }`}
                                    placeholder="At least 8 characters"
                                />
                                {formErrors.password && <p className="text-red-400 text-sm mt-1">{formErrors.password}</p>}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Phone (Optional)</label>
                                <input
                                    type="tel"
                                    value={formData.phone || ''}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition disabled:opacity-50"
                                >
                                    {submitting ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
