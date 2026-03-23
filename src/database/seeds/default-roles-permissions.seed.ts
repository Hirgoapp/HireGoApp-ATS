import { Permission } from '../../auth/entities/permission.entity';
import { Role } from '../../auth/entities/role.entity';
import { RolePermission } from '../../auth/entities/role-permission.entity';

/**
 * Default permissions for the ATS system
 * These are global and shared across all tenants
 */
export const DEFAULT_PERMISSIONS: Partial<Permission>[] = [
    // Candidates
    {
        name: 'candidates:read',
        description: 'View candidate information',
        resource: 'candidates',
        action: 'read',
        level: 0,
        is_sensitive: false,
    },
    {
        name: 'candidates:create',
        description: 'Create new candidates',
        resource: 'candidates',
        action: 'create',
        level: 0,
        is_sensitive: false,
    },
    {
        name: 'candidates:update',
        description: 'Update candidate information',
        resource: 'candidates',
        action: 'update',
        level: 0,
        is_sensitive: false,
    },
    {
        name: 'candidates:delete',
        description: 'Delete candidates',
        resource: 'candidates',
        action: 'delete',
        level: 2,
        is_sensitive: true,
    },
    {
        name: 'candidates:*',
        description: 'All candidate operations',
        resource: 'candidates',
        action: '*',
        level: 2,
        is_sensitive: false,
    },

    // Clients
    {
        name: 'clients:read',
        description: 'View clients',
        resource: 'clients',
        action: 'read',
        level: 0,
        is_sensitive: false,
    },
    {
        name: 'clients:create',
        description: 'Create new clients',
        resource: 'clients',
        action: 'create',
        level: 0,
        is_sensitive: false,
    },
    {
        name: 'clients:update',
        description: 'Update client information',
        resource: 'clients',
        action: 'update',
        level: 0,
        is_sensitive: false,
    },
    {
        name: 'clients:delete',
        description: 'Delete clients',
        resource: 'clients',
        action: 'delete',
        level: 2,
        is_sensitive: true,
    },
    {
        name: 'clients:*',
        description: 'All client operations',
        resource: 'clients',
        action: '*',
        level: 2,
        is_sensitive: false,
    },

    // Jobs
    {
        name: 'jobs:view',
        description: 'View job postings',
        resource: 'jobs',
        action: 'view',
        level: 0,
        is_sensitive: false,
    },
    {
        name: 'jobs:create',
        description: 'Create job postings',
        resource: 'jobs',
        action: 'create',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'jobs:publish',
        description: 'Publish job postings',
        resource: 'jobs',
        action: 'publish',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'jobs:update',
        description: 'Update job postings',
        resource: 'jobs',
        action: 'update',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'jobs:delete',
        description: 'Delete job postings',
        resource: 'jobs',
        action: 'delete',
        level: 2,
        is_sensitive: true,
    },
    {
        name: 'jobs:*',
        description: 'All job operations',
        resource: 'jobs',
        action: '*',
        level: 2,
        is_sensitive: false,
    },

    // Applications
    {
        name: 'applications:read',
        description: 'View job applications',
        resource: 'applications',
        action: 'read',
        level: 0,
        is_sensitive: false,
    },
    {
        name: 'applications:create',
        description: 'Create job applications',
        resource: 'applications',
        action: 'create',
        level: 0,
        is_sensitive: false,
    },
    {
        name: 'applications:update',
        description: 'Update applications (move to stages, etc)',
        resource: 'applications',
        action: 'update',
        level: 0,
        is_sensitive: false,
    },
    {
        name: 'applications:delete',
        description: 'Delete applications',
        resource: 'applications',
        action: 'delete',
        level: 2,
        is_sensitive: true,
    },
    {
        name: 'applications:*',
        description: 'All application operations',
        resource: 'applications',
        action: '*',
        level: 1,
        is_sensitive: false,
    },

    // Users
    {
        name: 'users:read',
        description: 'View user information',
        resource: 'users',
        action: 'read',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'users:create',
        description: 'Create new users',
        resource: 'users',
        action: 'create',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'users:update',
        description: 'Update users, assign roles, manage permissions',
        resource: 'users',
        action: 'update',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'users:invite',
        description: 'Invite users to company',
        resource: 'users',
        action: 'invite',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'users:delete',
        description: 'Delete users',
        resource: 'users',
        action: 'delete',
        level: 2,
        is_sensitive: true,
    },

    // Reports
    {
        name: 'reports:view',
        description: 'View reports',
        resource: 'reports',
        action: 'view',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'reports:export',
        description: 'Export reports',
        resource: 'reports',
        action: 'export',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'reports:*',
        description: 'All report operations',
        resource: 'reports',
        action: '*',
        level: 1,
        is_sensitive: false,
    },

    // Skill Categories
    {
        name: 'skill-categories:read',
        description: 'View skill categories',
        resource: 'skill-categories',
        action: 'read',
        level: 0,
        is_sensitive: false,
    },
    {
        name: 'skill-categories:create',
        description: 'Create skill categories',
        resource: 'skill-categories',
        action: 'create',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'skill-categories:update',
        description: 'Update skill categories',
        resource: 'skill-categories',
        action: 'update',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'skill-categories:delete',
        description: 'Delete skill categories',
        resource: 'skill-categories',
        action: 'delete',
        level: 2,
        is_sensitive: true,
    },
    {
        name: 'skill-categories:*',
        description: 'All skill category operations',
        resource: 'skill-categories',
        action: '*',
        level: 2,
        is_sensitive: false,
    },

    // Skills
    {
        name: 'skills:read',
        description: 'View skills',
        resource: 'skills',
        action: 'read',
        level: 0,
        is_sensitive: false,
    },
    {
        name: 'skills:create',
        description: 'Create skills',
        resource: 'skills',
        action: 'create',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'skills:update',
        description: 'Update skills',
        resource: 'skills',
        action: 'update',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'skills:delete',
        description: 'Delete skills',
        resource: 'skills',
        action: 'delete',
        level: 2,
        is_sensitive: true,
    },
    {
        name: 'skills:*',
        description: 'All skill operations',
        resource: 'skills',
        action: '*',
        level: 2,
        is_sensitive: false,
    },

    // Education Levels
    {
        name: 'education-levels:read',
        description: 'View education levels',
        resource: 'education-levels',
        action: 'read',
        level: 0,
        is_sensitive: false,
    },
    {
        name: 'education-levels:create',
        description: 'Create education levels',
        resource: 'education-levels',
        action: 'create',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'education-levels:update',
        description: 'Update education levels',
        resource: 'education-levels',
        action: 'update',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'education-levels:delete',
        description: 'Delete education levels',
        resource: 'education-levels',
        action: 'delete',
        level: 2,
        is_sensitive: true,
    },
    {
        name: 'education-levels:*',
        description: 'All education level operations',
        resource: 'education-levels',
        action: '*',
        level: 2,
        is_sensitive: false,
    },

    // Experience Types
    {
        name: 'experience-types:read',
        description: 'View experience types',
        resource: 'experience-types',
        action: 'read',
        level: 0,
        is_sensitive: false,
    },
    {
        name: 'experience-types:create',
        description: 'Create experience types',
        resource: 'experience-types',
        action: 'create',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'experience-types:update',
        description: 'Update experience types',
        resource: 'experience-types',
        action: 'update',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'experience-types:delete',
        description: 'Delete experience types',
        resource: 'experience-types',
        action: 'delete',
        level: 2,
        is_sensitive: true,
    },
    {
        name: 'experience-types:*',
        description: 'All experience type operations',
        resource: 'experience-types',
        action: '*',
        level: 2,
        is_sensitive: false,
    },

    // Qualifications
    {
        name: 'qualifications:read',
        description: 'View qualifications',
        resource: 'qualifications',
        action: 'read',
        level: 0,
        is_sensitive: false,
    },
    {
        name: 'qualifications:create',
        description: 'Create qualifications',
        resource: 'qualifications',
        action: 'create',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'qualifications:update',
        description: 'Update qualifications',
        resource: 'qualifications',
        action: 'update',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'qualifications:delete',
        description: 'Delete qualifications',
        resource: 'qualifications',
        action: 'delete',
        level: 2,
        is_sensitive: true,
    },
    {
        name: 'qualifications:*',
        description: 'All qualification operations',
        resource: 'qualifications',
        action: '*',
        level: 2,
        is_sensitive: false,
    },

    // Documents
    {
        name: 'documents:read',
        description: 'View documents',
        resource: 'documents',
        action: 'read',
        level: 0,
        is_sensitive: false,
    },
    {
        name: 'documents:create',
        description: 'Upload documents',
        resource: 'documents',
        action: 'create',
        level: 0,
        is_sensitive: false,
    },
    {
        name: 'documents:update',
        description: 'Update documents',
        resource: 'documents',
        action: 'update',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'documents:delete',
        description: 'Delete documents',
        resource: 'documents',
        action: 'delete',
        level: 2,
        is_sensitive: true,
    },
    {
        name: 'documents:*',
        description: 'All document operations',
        resource: 'documents',
        action: '*',
        level: 2,
        is_sensitive: false,
    },

    // Pipelines
    {
        name: 'pipelines:read',
        description: 'View pipelines',
        resource: 'pipelines',
        action: 'read',
        level: 0,
        is_sensitive: false,
    },
    {
        name: 'pipelines:create',
        description: 'Create pipelines',
        resource: 'pipelines',
        action: 'create',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'pipelines:update',
        description: 'Update pipelines',
        resource: 'pipelines',
        action: 'update',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'pipelines:delete',
        description: 'Delete pipelines',
        resource: 'pipelines',
        action: 'delete',
        level: 2,
        is_sensitive: true,
    },
    {
        name: 'pipelines:*',
        description: 'All pipeline operations',
        resource: 'pipelines',
        action: '*',
        level: 2,
        is_sensitive: false,
    },

    // Settings
    {
        name: 'settings:manage',
        description: 'Manage company settings',
        resource: 'settings',
        action: 'manage',
        level: 2,
        is_sensitive: true,
    },
    {
        name: 'settings:view',
        description: 'View company settings',
        resource: 'settings',
        action: 'view',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'settings:update',
        description: 'Update company settings',
        resource: 'settings',
        action: 'update',
        level: 2,
        is_sensitive: true,
    },

    // Integrations
    {
        name: 'integrations:view',
        description: 'View company integrations',
        resource: 'integrations',
        action: 'view',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'integrations:update',
        description: 'Connect/disconnect and update integrations',
        resource: 'integrations',
        action: 'update',
        level: 2,
        is_sensitive: true,
    },

    // Roles & Permissions
    {
        name: 'roles:manage',
        description: 'Manage roles and permissions',
        resource: 'roles',
        action: 'manage',
        level: 2,
        is_sensitive: true,
    },

    // Audit
    {
        name: 'audit:view',
        description: 'View audit logs',
        resource: 'audit',
        action: 'view',
        level: 2,
        is_sensitive: true,
    },

    // Activity
    {
        name: 'activity:view',
        description: 'View activity timeline',
        resource: 'activity',
        action: 'view',
        level: 1,
        is_sensitive: false,
    },

    // API Keys
    {
        name: 'api-keys:read',
        description: 'View API keys',
        resource: 'api-keys',
        action: 'read',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'api-keys:create',
        description: 'Create API keys',
        resource: 'api-keys',
        action: 'create',
        level: 2,
        is_sensitive: true,
    },
    {
        name: 'api-keys:update',
        description: 'Update/rotate API keys',
        resource: 'api-keys',
        action: 'update',
        level: 2,
        is_sensitive: true,
    },
    {
        name: 'api-keys:delete',
        description: 'Revoke API keys',
        resource: 'api-keys',
        action: 'delete',
        level: 2,
        is_sensitive: true,
    },

    // Webhooks
    {
        name: 'webhooks:read',
        description: 'View webhook subscriptions and logs',
        resource: 'webhooks',
        action: 'read',
        level: 1,
        is_sensitive: false,
    },
    {
        name: 'webhooks:create',
        description: 'Create webhook subscriptions',
        resource: 'webhooks',
        action: 'create',
        level: 2,
        is_sensitive: true,
    },
    {
        name: 'webhooks:update',
        description: 'Update webhook subscriptions',
        resource: 'webhooks',
        action: 'update',
        level: 2,
        is_sensitive: true,
    },
    {
        name: 'webhooks:delete',
        description: 'Delete webhook subscriptions',
        resource: 'webhooks',
        action: 'delete',
        level: 2,
        is_sensitive: true,
    },
    {
        name: 'webhooks:test',
        description: 'Test webhook subscriptions',
        resource: 'webhooks',
        action: 'test',
        level: 1,
        is_sensitive: false,
    },

    // API (generic access)
    {
        name: 'api:access',
        description: 'Access API',
        resource: 'api',
        action: 'access',
        level: 1,
        is_sensitive: false,
    },
];

/**
 * Default system roles (cannot be deleted)
 * These are created per company during onboarding
 */
export const DEFAULT_SYSTEM_ROLES = [
    {
        name: 'Admin',
        slug: 'admin',
        description: 'Full system access',
        is_system: true,
        is_default: false,
        display_order: 1,
        permissions: [
            'candidates:*',
            'clients:*',
            'jobs:*',
            'applications:*',
            'skill-categories:*',
            'skills:*',
            'education-levels:*',
            'experience-types:*',
            'qualifications:*',
            'documents:*',
            'pipelines:*',
            'users:read',
            'users:create',
            'users:update',
            'users:invite',
            'users:delete',
            'reports:*',
            'settings:manage',
            'settings:view',
            'settings:update',
            'integrations:view',
            'integrations:update',
            'roles:manage',
            'audit:view',
            'activity:view',
            'api-keys:*',
            'webhooks:*',
            'api:access',
        ],
    },
    {
        name: 'Recruiter',
        slug: 'recruiter',
        description: 'Day-to-day recruiting operations',
        is_system: true,
        is_default: true,
        display_order: 2,
        permissions: [
            'candidates:read',
            'candidates:create',
            'candidates:update',
            'clients:read',
            'clients:create',
            'clients:update',
            'jobs:view',
            'jobs:create',
            'jobs:publish',
            'applications:read',
            'applications:create',
            'applications:update',
            'skill-categories:read',
            'skills:read',
            'education-levels:read',
            'experience-types:read',
            'qualifications:read',
            'documents:read',
            'documents:create',
            'pipelines:read',
            'reports:view',
            'api:access',
        ],
    },
    {
        name: 'Hiring Manager',
        slug: 'hiring_manager',
        description: 'Decision maker for hiring',
        is_system: true,
        is_default: false,
        display_order: 3,
        permissions: [
            'candidates:read',
            'clients:read',
            'jobs:view',
            'applications:read',
            'skill-categories:read',
            'skills:read',
            'education-levels:read',
            'experience-types:read',
            'qualifications:read',
            'documents:read',
            'pipelines:read',
            'applications:update',
            'reports:view',
            'reports:export',
        ],
    },
    {
        name: 'Viewer',
        slug: 'viewer',
        description: 'Read-only access',
        is_system: true,
        is_default: false,
        display_order: 4,
        permissions: [
            'candidates:read',
            'clients:read',
            'jobs:view',
            'applications:read',
            'skill-categories:read',
            'skills:read',
            'education-levels:read',
            'experience-types:read',
            'qualifications:read',
            'documents:read',
            'pipelines:read',
            'reports:view',
        ],
    },
];

/**
 * Seed default permissions to database
 */
export async function seedDefaultPermissions(
    permissionRepository: any
): Promise<Permission[]> {
    // Check if permissions already exist
    const existing = await permissionRepository.findAll();
    if (existing.length > 0) {
        console.log('Permissions already seeded, skipping...');
        return existing;
    }

    console.log('Seeding default permissions...');
    const created = await permissionRepository.createMany(DEFAULT_PERMISSIONS);
    console.log(`Created ${created.length} permissions`);
    return created;
}

/**
 * Seed default roles for a company
 */
export async function seedDefaultRoles(
    companyId: string,
    roleRepository: any,
    rolePermissionRepository: any,
    permissionRepository: any
): Promise<Role[]> {
    console.log(`Seeding default roles for company ${companyId}...`);

    const permissions = await permissionRepository.findAll();
    const permissionMap = new Map(permissions.map((p: any) => [p.name, p.id]));

    const roles: Role[] = [];

    for (const roleData of DEFAULT_SYSTEM_ROLES) {
        const existing = await roleRepository.findBySlug(roleData.slug, companyId);
        if (existing) {
            console.log(`Role ${roleData.slug} already exists, skipping...`);
            roles.push(existing);
            continue;
        }

        const role = await roleRepository.create({
            company_id: companyId,
            name: roleData.name,
            slug: roleData.slug,
            description: roleData.description,
            is_system: roleData.is_system,
            is_default: roleData.is_default,
            display_order: roleData.display_order,
        });

        // Assign permissions to role
        const permissionIds = roleData.permissions
            .map((perm) => permissionMap.get(perm))
            .filter((id): id is string => !!id);

        if (permissionIds.length > 0) {
            await rolePermissionRepository.addPermissions(role.id, permissionIds);
        }

        roles.push(role);
        console.log(`Created role: ${roleData.name}`);
    }

    return roles;
}
