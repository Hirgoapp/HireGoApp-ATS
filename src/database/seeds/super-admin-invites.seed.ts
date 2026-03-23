import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import { SuperAdminInvite, SuperAdminInviteStatus } from '../../super-admin/entities/super-admin-invite.entity';
import { SuperAdminUser } from '../../super-admin/entities/super-admin-user.entity';
import { Company } from '../../companies/entities/company.entity';

dotenv.config();

const PREFERRED_DEMO_COMPANY_ID = 'aee933be-7729-434e-b078-17c2f9ae4119';

function hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

function daysFromNow(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
}

function daysAgo(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
}

export async function seedSuperAdminInvites(dataSource: DataSource): Promise<void> {
    if (!dataSource.isInitialized) {
        await dataSource.initialize();
    }

    const check = await dataSource.query(
        "SELECT to_regclass('public.super_admin_invites') AS table_name;",
    );
    if (!check?.[0]?.table_name) {
        console.log('ℹ️ super_admin_invites table missing — run migrations first.');
        return;
    }

    const inviteRepo = dataSource.getRepository(SuperAdminInvite);
    const markerEmail = 'seed.pending.recruiter@hiregoapp.local';
    const existingMarker = await inviteRepo.findOne({ where: { email: markerEmail } });
    if (existingMarker) {
        console.log('Super admin invites already seeded (marker row exists).');
        return;
    }

    const superAdmin = await dataSource.getRepository(SuperAdminUser).findOne({
        where: {},
        order: { created_at: 'ASC' },
    });

    if (!superAdmin) {
        console.log('ℹ️ No super_admin_users row — skip invite seed (create a super admin first).');
        return;
    }

    const invitedById = superAdmin.id;

    const companyRepo = dataSource.getRepository(Company);
    let tenantId: string | null = null;
    let tenantName: string | null = null;
    const preferred = await companyRepo.findOne({ where: { id: PREFERRED_DEMO_COMPANY_ID } as any });
    if (preferred) {
        tenantId = preferred.id;
        tenantName = preferred.name;
    } else {
        const anyCo = await companyRepo.findOne({ where: {}, order: { created_at: 'DESC' } as any });
        if (anyCo) {
            tenantId = anyCo.id;
            tenantName = anyCo.name;
        }
    }

    const rows: Partial<SuperAdminInvite>[] = [];

    if (tenantId) {
        rows.push({
            email: markerEmail,
            company_id: tenantId,
            company_name: tenantName,
            role: 'recruiter',
            status: SuperAdminInviteStatus.PENDING,
            token_hash: hashToken('seed-token-recruiter-demo-please-rotate'),
            expires_at: daysFromNow(10),
            invited_by_id: invitedById,
            last_sent_at: new Date(),
            resent_count: 0,
            personal_message: 'Seeded pending invite for dashboard testing.',
            metadata: { seeded: true },
        });
    } else {
        rows.push({
            email: markerEmail,
            company_id: null,
            company_name: null,
            role: 'super_admin',
            status: SuperAdminInviteStatus.PENDING,
            token_hash: hashToken('seed-token-marker-super-demo'),
            expires_at: daysFromNow(10),
            invited_by_id: invitedById,
            last_sent_at: new Date(),
            resent_count: 0,
            personal_message: 'Seeded pending invite (no tenant companies in DB).',
            metadata: { seeded: true },
        });
    }

    rows.push({
        email: 'seed.pending.super@hiregoapp.local',
        company_id: null,
        company_name: null,
        role: 'super_admin',
        status: SuperAdminInviteStatus.PENDING,
        token_hash: hashToken('seed-token-super-admin-demo-please-rotate'),
        expires_at: daysFromNow(14),
        invited_by_id: invitedById,
        last_sent_at: daysAgo(1),
        resent_count: 1,
        personal_message: null,
        metadata: { seeded: true },
    });

    if (tenantId) {
        rows.push(
            {
                email: 'seed.revoked@hiregoapp.local',
                company_id: tenantId,
                company_name: tenantName,
                role: 'company_admin',
                status: SuperAdminInviteStatus.REVOKED,
                token_hash: hashToken('seed-token-revoked-demo'),
                expires_at: daysFromNow(30),
                invited_by_id: invitedById,
                last_sent_at: daysAgo(3),
                resent_count: 0,
                revoked_at: daysAgo(2),
                personal_message: null,
                metadata: { seeded: true },
            },
            {
                email: 'seed.expired@hiregoapp.local',
                company_id: tenantId,
                company_name: tenantName,
                role: 'viewer',
                status: SuperAdminInviteStatus.EXPIRED,
                token_hash: hashToken('seed-token-expired-demo'),
                expires_at: daysAgo(1),
                invited_by_id: invitedById,
                last_sent_at: daysAgo(10),
                resent_count: 0,
                personal_message: null,
                metadata: { seeded: true },
            },
            {
                email: 'seed.accepted@hiregoapp.local',
                company_id: tenantId,
                company_name: tenantName,
                role: 'recruiter',
                status: SuperAdminInviteStatus.ACCEPTED,
                token_hash: hashToken('seed-token-accepted-demo'),
                expires_at: daysFromNow(5),
                invited_by_id: invitedById,
                last_sent_at: daysAgo(14),
                resent_count: 0,
                accepted_at: daysAgo(7),
                personal_message: null,
                metadata: { seeded: true },
            },
        );
    } else {
        rows.push(
            {
                email: 'seed.revoked@hiregoapp.local',
                company_id: null,
                company_name: null,
                role: 'super_admin',
                status: SuperAdminInviteStatus.REVOKED,
                token_hash: hashToken('seed-token-revoked-super-demo'),
                expires_at: daysFromNow(30),
                invited_by_id: invitedById,
                last_sent_at: daysAgo(3),
                resent_count: 0,
                revoked_at: daysAgo(2),
                personal_message: null,
                metadata: { seeded: true },
            },
            {
                email: 'seed.expired@hiregoapp.local',
                company_id: null,
                company_name: null,
                role: 'super_admin',
                status: SuperAdminInviteStatus.EXPIRED,
                token_hash: hashToken('seed-token-expired-super-demo'),
                expires_at: daysAgo(1),
                invited_by_id: invitedById,
                last_sent_at: daysAgo(10),
                resent_count: 0,
                personal_message: null,
                metadata: { seeded: true },
            },
            {
                email: 'seed.accepted@hiregoapp.local',
                company_id: null,
                company_name: null,
                role: 'super_admin',
                status: SuperAdminInviteStatus.ACCEPTED,
                token_hash: hashToken('seed-token-accepted-super-demo'),
                expires_at: daysFromNow(5),
                invited_by_id: invitedById,
                last_sent_at: daysAgo(14),
                resent_count: 0,
                accepted_at: daysAgo(7),
                personal_message: null,
                metadata: { seeded: true },
            },
        );
    }

    await inviteRepo.save(rows.map((r) => inviteRepo.create(r)));
    console.log(
        `✅ Seeded ${rows.length} super admin invites (${tenantId ? 'with tenant samples' : 'super-admin-only samples'}).`,
    );
}

async function main() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'ats_saas',
        entities: ['src/**/*.entity.ts'],
        synchronize: false,
    });
    try {
        await seedSuperAdminInvites(dataSource);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

main().catch((err) => {
    console.error('❌ Super admin invites seed error:', err);
    process.exit(1);
});
