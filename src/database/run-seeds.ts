import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Permission } from '../auth/entities/permission.entity';
import { Role } from '../auth/entities/role.entity';
import { RolePermission } from '../auth/entities/role-permission.entity';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'ats_saas',
    entities: ['src/**/entities/*.entity.ts'],
    synchronize: false,
});

type SeedPermission = Pick<Permission, 'key' | 'resource' | 'action' | 'description' | 'level' | 'is_sensitive'>;

const REQUIRED_PERMISSIONS: SeedPermission[] = [
    {
        key: 'settings:view',
        resource: 'settings',
        action: 'view',
        description: 'View company settings',
        level: 1,
        is_sensitive: false,
    },
    {
        key: 'settings:update',
        resource: 'settings',
        action: 'update',
        description: 'Update company settings',
        level: 2,
        is_sensitive: true,
    },
    {
        key: 'integrations:view',
        resource: 'integrations',
        action: 'view',
        description: 'View company integrations',
        level: 1,
        is_sensitive: false,
    },
    {
        key: 'integrations:update',
        resource: 'integrations',
        action: 'update',
        description: 'Connect/disconnect and update integrations',
        level: 2,
        is_sensitive: true,
    },
];

function walkFiles(root: string, predicate: (filePath: string) => boolean, out: string[] = []) {
    const entries = fs.readdirSync(root, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(root, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === 'dist') continue;
            walkFiles(full, predicate, out);
        } else if (entry.isFile()) {
            if (predicate(full)) out.push(full);
        }
    }
    return out;
}

function extractPermissionKeysFromSource(sourceText: string): string[] {
    const keys = new Set<string>();

    // @RequirePermissions('a:b', 'c:d')
    const requirePermRe = /@RequirePermissions\s*\(([\s\S]*?)\)/g;
    for (const match of sourceText.matchAll(requirePermRe)) {
        const inside = match[1] || '';
        for (const str of inside.matchAll(/['"]([^'"]+)['"]/g)) {
            const k = String(str[1] || '').trim();
            if (k.includes(':')) keys.add(k);
        }
    }

    // @Require('a-b:c')
    const requireRe = /@Require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    for (const match of sourceText.matchAll(requireRe)) {
        const k = String(match[1] || '').trim();
        if (k.includes(':')) keys.add(k);
    }

    return Array.from(keys.values());
}

function permissionFromKey(key: string): SeedPermission | null {
    const idx = key.indexOf(':');
    if (idx <= 0) return null;
    const resource = key.slice(0, idx);
    const action = key.slice(idx + 1);
    if (!resource || !action) return null;
    return {
        key,
        resource,
        action,
        description: null,
        level: action === 'delete' || action === 'manage' ? 2 : 1,
        is_sensitive: action === 'delete' || action === 'manage',
    };
}

function discoverPermissionsFromCode(): SeedPermission[] {
    const srcRoot = path.join(process.cwd(), 'src');
    const files = walkFiles(
        srcRoot,
        (p) => p.endsWith('.ts') && (p.endsWith('.controller.ts') || p.includes(`${path.sep}controllers${path.sep}`)),
    );

    const keys = new Set<string>();
    for (const file of files) {
        const text = fs.readFileSync(file, 'utf8');
        extractPermissionKeysFromSource(text).forEach((k) => keys.add(k));
    }

    const perms: SeedPermission[] = [];
    for (const k of keys) {
        const p = permissionFromKey(k);
        if (p) perms.push(p);
    }
    return perms;
}

async function ensurePermissions() {
    const permissionRepo = dataSource.getRepository(Permission);
    const existing = await permissionRepo.find();
    const existingKeys = new Set(existing.map((p) => p.key));

    const discovered = discoverPermissionsFromCode();
    const combined = [...REQUIRED_PERMISSIONS, ...discovered];
    const unique: SeedPermission[] = [];
    const seen = new Set<string>();
    for (const p of combined) {
        if (seen.has(p.key)) continue;
        seen.add(p.key);
        unique.push(p);
    }

    const toCreate = unique.filter((p) => !existingKeys.has(p.key));
    if (toCreate.length === 0) {
        console.log('✅ Permissions already synced (no new permissions to create).');
        return;
    }

    await permissionRepo.save(
        toCreate.map((p) => ({
            key: p.key,
            resource: p.resource,
            action: p.action,
            description: p.description,
            level: p.level,
            is_sensitive: p.is_sensitive,
            is_active: true,
        })) as any,
    );

    console.log(`✅ Created ${toCreate.length} permissions (from code + required list).`);
}

async function ensureRoleHas(role: Role, permIds: string[]) {
    if (permIds.length === 0) return;
    const rpRepo = dataSource.getRepository(RolePermission);
    const existing = await rpRepo.find({ where: { role_id: role.id } as any });
    const existingSet = new Set(existing.map((rp) => rp.permission_id));
    const missing = permIds.filter((id) => !existingSet.has(id));
    if (missing.length === 0) return;

    await rpRepo.save(
        missing.map((permission_id) => ({ role_id: role.id, permission_id })) as any,
        { chunk: 100 },
    );
}

async function ensureRolePermissions() {
    const rolesRepo = dataSource.getRepository(Role);
    const permissionRepo = dataSource.getRepository(Permission);

    const allActive = await permissionRepo.find({ where: { is_active: true } as any });
    const allActiveIds = allActive.map((p) => p.id);

    // Apply to common admin roles (company_admin is used by tenant-aware RBAC; admin may exist in older setups)
    const roles = await rolesRepo.find();
    const target = roles.filter((r) => ['company_admin', 'admin'].includes(String((r as any).slug)));

    if (target.length === 0) {
        console.log('ℹ️ No admin roles found to attach permissions (company_admin/admin).');
        return;
    }

    for (const role of target) {
        await ensureRoleHas(role, allActiveIds);
        console.log(`✅ Ensured FULL permissions for role ${role.slug} (${role.id})`);
    }
}

async function main() {
    await dataSource.initialize();
    console.log('✅ Database connected');

    await ensurePermissions();
    await ensureRolePermissions();

    await dataSource.destroy();
    console.log('✅ Seed updates complete');
}

main().catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
});

