import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Building2,
    Users,
    Package,
    Zap,
    ClipboardList,
    Settings,
    LogOut
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const location = useLocation();
    const { user, logout } = useAuthStore();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Companies', href: '/companies', icon: Building2 },
        { name: 'Users', href: '/users', icon: Users },
        { name: 'Modules', href: '/modules', icon: Package },
        { name: 'Licensing', href: '/licensing', icon: Zap },
        { name: 'Roadmap', href: '/roadmap', icon: ClipboardList },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 w-64 bg-gray-800 border-r border-gray-700">
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center h-16 px-6 border-b border-gray-700">
                        <h1 className="text-xl font-bold text-white">HireGoApp Super Admin</h1>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-brand-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User info */}
                    <div className="p-4 border-t border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                        {user?.firstName.charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
                                    <p className="text-xs text-gray-400">{user?.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-gray-400 hover:text-white transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="pl-64">
                <main className="min-h-screen p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
