import api from '../../../services/api';

export interface PermissionDef {
    id: string;
    key: string;
    resource: string;
    action: string;
    description?: string | null;
    is_active: boolean;
    level: number;
    is_sensitive: boolean;
}

export interface RoleDef {
    id: string;
    company_id: string | null;
    name: string;
    slug: string;
    description?: string | null;
    is_system: boolean;
    is_default: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export async function fetchRoles(): Promise<RoleDef[]> {
    const res = await api.get('/rbac/roles');
    return (res.data as any).data.roles as RoleDef[];
}

export async function fetchPermissions(): Promise<PermissionDef[]> {
    const res = await api.get('/rbac/permissions');
    return (res.data as any).data.permissions as PermissionDef[];
}

export async function fetchRolePermissionKeys(roleId: string): Promise<string[]> {
    const res = await api.get(`/rbac/roles/${encodeURIComponent(roleId)}/permissions`);
    return (res.data as any).data.keys as string[];
}

export async function setRolePermissionKeys(roleId: string, keys: string[]): Promise<void> {
    await api.put(`/rbac/roles/${encodeURIComponent(roleId)}/permissions`, { keys });
}

