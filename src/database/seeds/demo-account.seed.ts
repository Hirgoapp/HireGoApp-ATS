import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../auth/entities/user.entity';
import { Role } from '../../auth/entities/role.entity';
import { UserRole } from '../../auth/entities/user-role.entity';

dotenv.config();

const DEMO_COMPANY_ID = 'aee933be-7729-434e-b078-17c2f9ae4119';
const DEMO_COMPANY_NAME = 'Demo Account';
const DEMO_COMPANY_SLUG = 'demo-account';
const DEMO_COMPANY_EMAIL = 'demo@dummy.com';

const DEMO_DEFAULT_PASSWORD = 'DemoPass@123';
const BCRYPT_ROUNDS = 10;

type DemoUserSeed = {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string | null;
    department?: string | null;
    is_active: boolean;
    email_verified: boolean;
    role_slug: 'company_admin' | 'recruiter' | 'viewer';
    last_login_at?: Date | null;
};

function daysAgo(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}

async function ensureDemoCompany(dataSource: DataSource): Promise<Company> {
    const companyRepo = dataSource.getRepository(Company);

    const existing =
        (await companyRepo.findOne({ where: { id: DEMO_COMPANY_ID } as any })) ||
        (await companyRepo.findOne({ where: { slug: DEMO_COMPANY_SLUG } as any })) ||
        (await companyRepo.findOne({ where: { email: DEMO_COMPANY_EMAIL } as any }));

    const demoSettings = {
        ...(existing?.settings || {}),
        is_demo: true,
        demo_seed_version: 1,
        demo_notes: 'Seeded demo tenant for full workflow demonstrations',
    };

    const company = (companyRepo.create({
        ...(existing || {}),
        id: DEMO_COMPANY_ID,
        name: DEMO_COMPANY_NAME,
        slug: DEMO_COMPANY_SLUG,
        email: DEMO_COMPANY_EMAIL,
        is_active: true,
        deleted_at: null,
        settings: demoSettings,
        feature_flags: {
            ...(existing?.feature_flags || {}),
            demo_mode: true,
        },
    } as any) as unknown) as Company;

    return ((await companyRepo.save(company)) as unknown) as Company;
}

async function ensureCompanyRoles(dataSource: DataSource, companyId: string): Promise<Map<string, Role>> {
    const roleRepo = dataSource.getRepository(Role);

    const wanted: Array<Pick<Role, 'company_id' | 'name' | 'slug' | 'description' | 'is_system' | 'is_default' | 'display_order'>> =
        [
            {
                company_id: companyId,
                name: 'Company Admin',
                slug: 'company_admin',
                description: 'Full access within the tenant',
                is_system: false,
                is_default: true,
                display_order: 1,
            },
            {
                company_id: companyId,
                name: 'Recruiter',
                slug: 'recruiter',
                description: 'Day-to-day recruiting operations',
                is_system: false,
                is_default: false,
                display_order: 2,
            },
            {
                company_id: companyId,
                name: 'Viewer',
                slug: 'viewer',
                description: 'Read-only access',
                is_system: false,
                is_default: false,
                display_order: 3,
            },
        ];

    const map = new Map<string, Role>();
    for (const w of wanted) {
        const existing = await roleRepo.findOne({ where: { company_id: companyId, slug: w.slug } as any });
        const saved = ((await roleRepo.save(roleRepo.create({ ...(existing || {}), ...w } as any))) as unknown) as Role;
        map.set(w.slug, saved);
    }

    return map;
}

async function ensureUsersAndAssignments(
    dataSource: DataSource,
    companyId: string,
    rolesBySlug: Map<string, Role>,
) {
    const userRepo = dataSource.getRepository(User);
    const userRoleRepo = dataSource.getRepository(UserRole);

    const passwordHash = await bcrypt.hash(DEMO_DEFAULT_PASSWORD, BCRYPT_ROUNDS);

    const users: DemoUserSeed[] = [
        // Known demo logins (sales-friendly)
        {
            email: 'demo.admin@dummy.com',
            first_name: 'Avery',
            last_name: 'Admin',
            phone: '+1 (415) 555-0123',
            department: 'Operations',
            is_active: true,
            email_verified: true,
            role_slug: 'company_admin',
            last_login_at: daysAgo(1),
        },
        {
            email: 'demo.recruiter@dummy.com',
            first_name: 'Riley',
            last_name: 'Recruiter',
            phone: '+1 (212) 555-0199',
            department: 'Talent Acquisition',
            is_active: true,
            email_verified: true,
            role_slug: 'recruiter',
            last_login_at: daysAgo(2),
        },
        {
            email: 'demo.manager@dummy.com',
            first_name: 'Morgan',
            last_name: 'Manager',
            phone: null,
            department: 'Engineering',
            is_active: true,
            email_verified: true,
            role_slug: 'viewer',
            last_login_at: daysAgo(7),
        },
        // Additional realistic mix (filters/statuses/edge cases)
        {
            email: 'noah.singh@dummy.com',
            first_name: 'Noah',
            last_name: 'Singh',
            phone: '+1 (646) 555-0144',
            department: 'Talent Acquisition',
            is_active: true,
            email_verified: true,
            role_slug: 'recruiter',
            last_login_at: daysAgo(3),
        },
        {
            email: 'sophia.chen@dummy.com',
            first_name: 'Sophia',
            last_name: 'Chen',
            phone: '+1 (206) 555-0107',
            department: 'People Ops',
            is_active: true,
            email_verified: false,
            role_slug: 'viewer',
            last_login_at: null,
        },
        {
            email: 'liam.williams@dummy.com',
            first_name: 'Liam',
            last_name: 'Williams',
            phone: '+1 (303) 555-0160',
            department: 'Sales',
            is_active: true,
            email_verified: true,
            role_slug: 'viewer',
            last_login_at: daysAgo(12),
        },
        {
            email: 'emma.patel@dummy.com',
            first_name: 'Emma',
            last_name: 'Patel',
            phone: '+1 (512) 555-0111',
            department: 'Talent Acquisition',
            is_active: true,
            email_verified: true,
            role_slug: 'recruiter',
            last_login_at: daysAgo(5),
        },
        {
            email: 'oliver.garcia@dummy.com',
            first_name: 'Oliver',
            last_name: 'Garcia',
            phone: null,
            department: 'Engineering',
            is_active: true,
            email_verified: true,
            role_slug: 'viewer',
            last_login_at: daysAgo(20),
        },
        {
            email: 'isabella.nguyen@dummy.com',
            first_name: 'Isabella',
            last_name: 'Nguyen',
            phone: '+1 (718) 555-0177',
            department: 'Finance',
            is_active: true,
            email_verified: true,
            role_slug: 'viewer',
            last_login_at: daysAgo(30),
        },
        {
            email: 'ethan.brown@dummy.com',
            first_name: 'Ethan',
            last_name: 'Brown',
            phone: '+1 (408) 555-0133',
            department: 'Operations',
            is_active: true,
            email_verified: true,
            role_slug: 'company_admin',
            last_login_at: daysAgo(4),
        },
        {
            email: 'mia.lopez@dummy.com',
            first_name: 'Mia',
            last_name: 'Lopez',
            phone: '+1 (917) 555-0101',
            department: 'Talent Acquisition',
            is_active: true,
            email_verified: true,
            role_slug: 'recruiter',
            last_login_at: daysAgo(9),
        },
        {
            email: 'lucas.kim@dummy.com',
            first_name: 'Lucas',
            last_name: 'Kim',
            phone: '+1 (650) 555-0188',
            department: 'Engineering',
            is_active: false, // inactive user edge case
            email_verified: true,
            role_slug: 'viewer',
            last_login_at: daysAgo(90),
        },
        {
            email: 'amelia.johnson@dummy.com',
            first_name: 'Amelia',
            last_name: 'Johnson',
            phone: null,
            department: 'Marketing',
            is_active: true,
            email_verified: false,
            role_slug: 'viewer',
            last_login_at: null,
        },
        {
            email: 'jackson.miller@dummy.com',
            first_name: 'Jackson',
            last_name: 'Miller',
            phone: '+1 (702) 555-0120',
            department: 'Customer Success',
            is_active: true,
            email_verified: true,
            role_slug: 'viewer',
            last_login_at: daysAgo(15),
        },
        {
            email: 'charlotte.davis@dummy.com',
            first_name: 'Charlotte',
            last_name: 'Davis',
            phone: '+1 (858) 555-0155',
            department: 'Talent Acquisition',
            is_active: true,
            email_verified: true,
            role_slug: 'recruiter',
            last_login_at: daysAgo(6),
        },
        {
            email: 'henry.wilson@dummy.com',
            first_name: 'Henry',
            last_name: 'Wilson',
            phone: '+1 (617) 555-0109',
            department: 'IT',
            is_active: true,
            email_verified: true,
            role_slug: 'viewer',
            last_login_at: daysAgo(40),
        },
        {
            email: 'ava.anderson@dummy.com',
            first_name: 'Ava',
            last_name: 'Anderson',
            phone: '+1 (312) 555-0138',
            department: 'People Ops',
            is_active: true,
            email_verified: true,
            role_slug: 'viewer',
            last_login_at: daysAgo(8),
        },
        {
            email: 'william.thomas@dummy.com',
            first_name: 'William',
            last_name: 'Thomas',
            phone: null,
            department: 'Legal',
            is_active: true,
            email_verified: true,
            role_slug: 'viewer',
            last_login_at: daysAgo(60),
        },
        {
            email: 'evelyn.moore@dummy.com',
            first_name: 'Evelyn',
            last_name: 'Moore',
            phone: '+1 (919) 555-0103',
            department: 'Operations',
            is_active: true,
            email_verified: true,
            role_slug: 'company_admin',
            last_login_at: daysAgo(10),
        },
        {
            email: 'james.taylor@dummy.com',
            first_name: 'James',
            last_name: 'Taylor',
            phone: '+1 (404) 555-0122',
            department: 'Talent Acquisition',
            is_active: true,
            email_verified: true,
            role_slug: 'recruiter',
            last_login_at: daysAgo(11),
        },
    ];

    let createdOrUpdated = 0;
    for (const u of users) {
        const existing = await userRepo.findOne({ where: { company_id: companyId, email: u.email } as any });
        const user = userRepo.create({
            ...(existing || {}),
            company_id: companyId,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            phone: u.phone ?? null,
            department: u.department ?? null,
            is_active: u.is_active,
            email_verified: u.email_verified,
            password_hash: existing?.password_hash || passwordHash,
            role: u.role_slug,
            last_login_at: u.last_login_at ?? null,
            preferences: existing?.preferences || {},
            permissions: existing?.permissions || {},
        } as any);

        const saved = ((await userRepo.save(user)) as unknown) as User;
        createdOrUpdated++;

        const role = rolesBySlug.get(u.role_slug);
        if (!role) continue;

        const existingLink = await userRoleRepo.findOne({
            where: { user_id: saved.id, company_id: companyId, role_id: role.id } as any,
        });
        if (!existingLink) {
            await userRoleRepo.save(
                userRoleRepo.create({ user_id: saved.id, company_id: companyId, role_id: role.id } as any),
            );
        }
    }

    return { total: users.length, upserted: createdOrUpdated };
}

async function main() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'ats_saas',
        entities: ['src/**/*.entity{.ts,.js}'],
        synchronize: false,
    });

    await dataSource.initialize();
    console.log('✅ Database connected');

    const company = await ensureDemoCompany(dataSource);
    console.log(`✅ Demo company ready: ${company.name} (${company.id})`);

    const rolesBySlug = await ensureCompanyRoles(dataSource, company.id);
    console.log(`✅ Demo roles ready: ${Array.from(rolesBySlug.keys()).join(', ')}`);

    const { total } = await ensureUsersAndAssignments(dataSource, company.id, rolesBySlug);
    console.log(`✅ Demo users upserted: ${total} (password: ${DEMO_DEFAULT_PASSWORD})`);

    await dataSource.destroy();
    console.log('✅ Demo seed complete');
}

main().catch((err) => {
    console.error('❌ Demo seed error:', err);
    process.exit(1);
});

