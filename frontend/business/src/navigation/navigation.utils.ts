import { NAV_ITEMS, type NavItem } from './navigation.config';

export function hasPermission(userPermissions: string[], requiredPermissions?: string[]): boolean {
    if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
    }

    if (userPermissions.includes('*')) {
        return true;
    }

    return requiredPermissions.some((permission) => userPermissions.includes(permission));
}

export function getVisibleNavItems(userPermissions: string[]): NavItem[] {
    return NAV_ITEMS.filter((item) => hasPermission(userPermissions, item.requiredPermissions));
}

export function getBreadcrumbFromPath(pathname: string): string {
    const navItem = NAV_ITEMS.find((item) => item.path === pathname);
    if (navItem) {
        return navItem.label;
    }

    if (pathname === '/app/activity') {
        return 'Activity Timeline';
    }

    if (pathname === '/app/submissions') {
        return 'Submissions';
    }

    if (pathname === '/app/interviews') {
        return 'Interviews';
    }

    if (pathname === '/app/offers') {
        return 'Offers';
    }

    if (pathname === '/app/admin') {
        return 'Administration';
    }

    if (pathname.startsWith('/app/candidates/')) {
        return 'Candidate Details';
    }

    if (pathname.startsWith('/app/jobs/')) {
        return 'Job Details';
    }

    if (pathname.startsWith('/app/submissions/')) {
        return 'Submission Details';
    }

    if (pathname.startsWith('/app/interviews/')) {
        return 'Interview Details';
    }

    if (pathname.startsWith('/app/offers/')) {
        return 'Offer Details';
    }

    return 'Workspace';
}
