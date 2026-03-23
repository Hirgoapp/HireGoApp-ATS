import {
    BarChart3,
    Briefcase,
    Building2,
    ClipboardList,
    FileCheck2,
    FileText,
    FolderKanban,
    History,
    LayoutDashboard,
    Shield,
    Settings,
    UserSquare2,
    KeyRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavStatus = 'active' | 'coming-soon';

export interface NavItem {
    id: string;
    label: string;
    icon: LucideIcon;
    path?: string;
    section: 'overview' | 'hiring' | 'pipeline' | 'admin';
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
        id: 'clients',
        label: 'Clients',
        icon: Building2,
        path: '/app/clients',
        section: 'hiring',
        requiredPermissions: ['clients:read', 'clients:view'],
        status: 'active',
    },
    {
        id: 'candidates',
        label: 'Candidates',
        icon: UserSquare2,
        path: '/app/candidates',
        section: 'hiring',
        requiredPermissions: ['candidates:read'],
        status: 'active',
    },
    {
        id: 'jobs',
        label: 'Jobs',
        icon: Briefcase,
        path: '/app/jobs',
        section: 'hiring',
        requiredPermissions: ['jobs:view'],
        status: 'active',
    },
    {
        id: 'submissions',
        label: 'Submissions',
        icon: ClipboardList,
        path: '/app/submissions',
        section: 'pipeline',
        requiredPermissions: ['submissions:read'],
        status: 'active',
    },
    {
        id: 'interviews',
        label: 'Interviews',
        icon: FileCheck2,
        path: '/app/interviews',
        section: 'pipeline',
        requiredPermissions: ['interviews:read'],
        status: 'active',
    },
    {
        id: 'offers',
        label: 'Offers',
        icon: BarChart3,
        path: '/app/offers',
        section: 'pipeline',
        requiredPermissions: ['offers:read'],
        status: 'active',
    },
    {
        id: 'documents',
        label: 'Documents',
        icon: FolderKanban,
        path: '/app/documents',
        section: 'pipeline',
        requiredPermissions: ['documents:read'],
        status: 'active',
    },
    {
        id: 'reports',
        label: 'Reports',
        icon: FileText,
        path: '/app/reports',
        section: 'overview',
        requiredPermissions: ['reports:read', 'reports:export'],
        status: 'active',
    },
    {
        id: 'activity',
        label: 'Activity',
        icon: History,
        path: '/app/activity',
        section: 'overview',
        requiredPermissions: ['activity:view'],
        status: 'active',
    },
    {
        id: 'company-settings',
        label: 'Settings',
        icon: Settings,
        path: '/app/admin/settings/company',
        section: 'admin',
        requiredPermissions: ['settings:view', 'roles:manage'],
        status: 'active',
    },
];

export const SECTION_LABELS: Record<NavItem['section'], string> = {
    overview: 'Overview',
    hiring: 'Hiring',
    pipeline: 'Pipeline',
    admin: 'Administration',
};

export const ACCENT_PRESETS = ['#0C5CCC', '#0F766E', '#B45309', '#BE123C', '#4338CA'];

export const APP_INFO = {
    appName: 'HireGoApp Business Portal',
    shortName: 'HireGoApp',
    version: 'v1.0.0',
    company: 'HireGoApp',
    supportEmail: 'support@hiregoapp.local',
    envLabel: import.meta.env.MODE === 'production' ? 'Production' : 'Development',
    envClass: import.meta.env.MODE === 'production' ? 'env-production' : 'env-development',
};
