import { Building2, Users, Activity, HeartPulse, BarChart3, PieChart, PlusCircle, Settings, AlertTriangle, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { paths } from '../constants/routes';

// --- Types ---
interface Stats {
    totalCompanies: number;
    superAdminUsers: number;
    activeLicenses: number;
    pendingInvites: number;
    systemHealthOk: boolean;
}

interface ActivityLog {
    id: string;
    action: string;
    description: string;
    timestamp: string;
    user?: string;
}

// --- Main Dashboard ---
export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats>({
        totalCompanies: 0,
        superAdminUsers: 0,
        activeLicenses: 0,
        pendingInvites: 0,
        systemHealthOk: true,
    });
    const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            // Simulate API calls for demo; replace with real endpoints
            const [companiesRes, usersRes, licensesRes, invitesRes] = await Promise.all([
                apiClient.get('/super-admin/companies?page=1&limit=1'),
                apiClient.get('/super-admin/users?page=1&limit=1'),
                apiClient.get('/super-admin/licenses/active-count'),
                apiClient.get('/super-admin/invites/pending-count'),
            ]);
            const lic = licensesRes.data?.data;
            const licenseCount =
                typeof lic?.count === 'number'
                    ? lic.count
                    : typeof lic?.activeLicenseCount === 'number'
                      ? lic.activeLicenseCount
                      : 0;
            setStats({
                totalCompanies: companiesRes.data?.data?.pagination?.total ?? 0,
                superAdminUsers: usersRes.data?.data?.pagination?.total ?? 0,
                activeLicenses: licenseCount,
                pendingInvites: invitesRes.data?.data?.count ?? 0,
                systemHealthOk: true, // TODO: Add real health check
            });
            // Simulate activity
            setRecentActivity([
                { id: '1', action: 'Login', description: 'Super admin logged in', timestamp: '2 min ago', user: 'super@admin.com' },
                { id: '2', action: 'Company Created', description: 'Acme Corp added', timestamp: '10 min ago', user: 'super@admin.com' },
                { id: '3', action: 'User Invited', description: 'Invited john@acme.com', timestamp: '1 hr ago', user: 'super@admin.com' },
            ]);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
            setStats((prev) => ({ ...prev, systemHealthOk: false }));
        } finally {
            setLoading(false);
        }
    };

    // --- Metric Cards ---
    const statCards: Array<{
        name: string;
        value: string;
        icon: LucideIcon;
        color: string;
        onClick?: () => void;
    }> = [
        { name: 'Total Companies', value: stats.totalCompanies.toLocaleString(), icon: Building2, color: 'bg-blue-700' },
        { name: 'Super Admin Users', value: stats.superAdminUsers.toLocaleString(), icon: Users, color: 'bg-purple-700' },
        { name: 'Active Licenses', value: stats.activeLicenses.toLocaleString(), icon: HeartPulse, color: 'bg-green-700' },
        {
            name: 'Pending Invites',
            value: stats.pendingInvites.toLocaleString(),
            icon: AlertTriangle,
            color: 'bg-yellow-700',
            onClick: () => navigate(paths.invites),
        },
    ];

    // --- Render ---
    return (
        <div className="space-y-10">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Welcome to HireGoApp Super Admin</h1>
                    <p className="text-gray-400 mt-2">Advanced system overview, analytics, and quick actions</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={() => navigate(paths.companies)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition"
                    >
                        <PlusCircle className="w-5 h-5" /> Add Company
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(paths.invites)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition"
                    >
                        <Users className="w-5 h-5" /> Invite User
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(paths.settings)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-600 transition"
                    >
                        <Settings className="w-5 h-5" /> Settings
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-900/30 border border-red-600 text-red-300 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Metrics Grid */}
            <div
                className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 ${loading ? 'opacity-60 pointer-events-none' : ''}`}
            >
                {statCards.map((stat) => (
                    <div
                        key={stat.name}
                        role={stat.onClick ? 'button' : undefined}
                        tabIndex={stat.onClick ? 0 : undefined}
                        onClick={stat.onClick}
                        onKeyDown={
                            stat.onClick
                                ? (e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                          e.preventDefault();
                                          stat.onClick?.();
                                      }
                                  }
                                : undefined
                        }
                        className={`rounded-xl p-6 border border-gray-700 flex items-center gap-4 ${stat.color} bg-opacity-80 shadow-lg ${stat.onClick ? 'cursor-pointer hover:ring-2 hover:ring-white/20' : ''}`}
                    >
                        <div className="p-3 rounded-lg bg-black/20">
                            <stat.icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-200">{stat.name}</p>
                            <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Analytics Section (Placeholder) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-6 h-6 text-brand-400" />
                        <h2 className="text-lg font-semibold text-white">Company/User Growth</h2>
                    </div>
                    <div className="h-40 flex items-center justify-center text-gray-500">[Growth Chart Here]</div>
                </div>
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <PieChart className="w-6 h-6 text-brand-400" />
                        <h2 className="text-lg font-semibold text-white">Module Usage</h2>
                    </div>
                    <div className="h-40 flex items-center justify-center text-gray-500">[Module Usage Chart Here]</div>
                </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-gray-800 rounded-xl border border-gray-700">
                <div className="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-brand-400" />
                    <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                </div>
                <div className="p-6">
                    {recentActivity.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">No recent activity</div>
                    ) : (
                        <div className="space-y-4">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                                    <div>
                                        <p className="text-white font-medium">{activity.action}</p>
                                        <p className="text-sm text-gray-400">{activity.description}</p>
                                    </div>
                                    <span className="text-sm text-gray-400">{activity.timestamp}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
