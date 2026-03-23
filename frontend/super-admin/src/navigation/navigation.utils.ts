import { NAV_ITEMS, type NavItem } from './navigation.config';

export function hasPermission(userPermissions: string[] = [], requiredPermissions?: string[]): boolean {
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
    const match = NAV_ITEMS.find((item) => item.path === pathname);
    if (match) {
        return match.label;
    }

    if (pathname.startsWith('/app/companies/')) {
        return 'Company Details';
    }

    if (pathname.startsWith('/app/users/')) {
        return 'User Details';
    }

    return 'Super Admin';
}
