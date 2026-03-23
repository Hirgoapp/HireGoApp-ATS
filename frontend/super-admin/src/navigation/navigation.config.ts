import {
    BarChart3,
    Building2,
    LayoutDashboard,
    Mail,
    Package,
    Settings,
    Users,
    Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavStatus = 'active' | 'coming-soon';

export interface NavItem {
    id: string;
    label: string;
    icon: LucideIcon;
    path?: string;
    section: 'overview' | 'management' | 'settings';
    requiredPermissions?: string[];
    status: NavStatus;
}

export const NAV_ITEMS: NavItem[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/app/dashboard',
        section: 'overview',
        status: 'active',
    },
    {
        id: 'companies',
        label: 'Companies',
        icon: Building2,
        path: '/app/companies',
        section: 'management',
        status: 'active',
    },
    {
        id: 'users',
        label: 'Users',
        icon: Users,
        path: '/app/users',
        section: 'management',
        status: 'active',
    },
    {
        id: 'invites',
        label: 'Invites',
        icon: Mail,
        path: '/app/invites',
        section: 'management',
        status: 'active',
    },
    {
        id: 'modules',
        label: 'Modules',
        icon: Package,
        path: '/app/modules',
        section: 'management',
        status: 'active',
    },
    {
        id: 'licensing',
        label: 'Licensing',
        icon: Zap,
        path: '/app/licensing',
        section: 'management',
        status: 'active',
    },
    {
        id: 'roadmap',
        label: 'Roadmap',
        icon: BarChart3,
        path: '/app/roadmap',
        section: 'overview',
        status: 'active',
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        path: '/app/settings',
        section: 'settings',
        status: 'active',
    },
];

export const SECTION_LABELS: Record<NavItem['section'], string> = {
    overview: 'Overview',
    management: 'Management',
    settings: 'Settings',
};

export const ACCENT_PRESETS = ['#0C5CCC', '#0F766E', '#B45309', '#BE123C', '#4338CA'];

export const APP_INFO = {
    appName: 'HireGoApp Super Admin',
    shortName: 'HireGoApp SA',
    version: 'v1.0.0',
    company: 'HireGoApp',
    supportEmail: 'support@hiregoapp.local',
    envLabel: import.meta.env.MODE === 'production' ? 'Production' : 'Development',
    envClass: import.meta.env.MODE === 'production' ? 'env-production' : 'env-development',
};
