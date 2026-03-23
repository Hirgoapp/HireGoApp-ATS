import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'ats_saas',
    synchronize: false,
});

const PERMISSIONS: string[] = [
    // Clients
    'clients:create',
    'clients:view',
    'clients:update',
    'clients:delete',
    // Jobs
    'jobs:create',
    'jobs:view',
    'jobs:update',
    'jobs:delete',
    // Candidates
    'candidates:create',
    'candidates:view',
    'candidates:update',
    'candidates:delete',
    // Submissions
    'submissions:create',
    'submissions:view',
    'submissions:update',
    'submissions:delete',
    // Interviews
    'interviews:create',
    'interviews:view',
    'interviews:update',
    'interviews:delete',
    // Offers
    'offers:create',
    'offers:view',
    'offers:update',
    'offers:delete',
    // Settings
    'settings:view',
    'settings:update',
    // Custom fields
    'custom_fields:view',
    'custom_fields:create',
    'custom_fields:update',
    'custom_fields:delete',
    // Audit
    'audit:view',
    // Activity
    'activity:view',
    // Files
    'files:view',
    'files:upload',
    'files:delete',
    // Notifications
    'notifications:view',
    'notifications:update',
    // Feature flags (per-company)
    'features:view',
    'features:update',
    // Integrations (external services)
    'integrations:view',
    'integrations:update',
    // Global search
    'search:view',
];

function parsePermissionKey(key: string): { resource: string; action: string } {
    const [resource, action] = key.split(':');
    return {
        resource,
        action: action || 'unknown',
    };
}

async function seedPermissions() {
    try {
        await dataSource.initialize();
        console.log('✅ Database connected');

        for (const key of PERMISSIONS) {
            const { resource, action } = parsePermissionKey(key);

            // Insert only if not exists (name column is canonical key)
            await dataSource.query(
                `
                INSERT INTO permissions (name, description, resource, action, level, is_sensitive, requires_mfa, is_active, created_at, updated_at)
                VALUES ($1, $2, $3, $4, 0, false, false, true, NOW(), NOW())
                ON CONFLICT (name) DO NOTHING
                `,
                [key, `${resource} ${action} permission`, resource, action],
            );
        }

        console.log('✅ Permissions seeded (if missing).');
        await dataSource.destroy();
    } catch (error) {
        console.error('❌ Error seeding permissions:', error);
        process.exit(1);
    }
}

seedPermissions();

