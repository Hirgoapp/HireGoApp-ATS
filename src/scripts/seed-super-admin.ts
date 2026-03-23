import { NestFactory } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import { SuperAdminUser } from './super-admin/entities/super-admin-user.entity';
import { Company } from './companies/entities/company.entity';
import { User } from './auth/entities/user.entity';

const DEMO_CONFIG = {
    superAdmin: {
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@ats.com',
        password: 'ChangeMe@123',
        role: 'super_admin',
    },
    demoCompany: {
        name: 'Demo Company',
        slug: 'demo-company',
        email: 'contact@demo-company.com',
        licenseTier: 'premium',
        settings: {
            timezone: 'America/New_York',
            dateFormat: 'MM/DD/YYYY',
        },
    },
    demoAdmin: {
        firstName: 'Demo',
        lastName: 'Administrator',
        email: 'admin@demo-company.com',
        password: 'DemoAdmin@123',
        role: 'admin',
    },
};

async function seedSuperAdmin() {
    console.log('🌱 Starting Super Admin seed...\n');

    const app = await NestFactory.createApplicationContext(AppModule);

    const superAdminRepository = app.get(Repository<SuperAdminUser>);
    const companiesRepository = app.get(Repository<Company>);
    const usersRepository = app.get(Repository<User>);

    try {
        // Check if super admin already exists
        let superAdmin = await superAdminRepository.findOne({
            where: { email: DEMO_CONFIG.superAdmin.email },
        });

        if (!superAdmin) {
            console.log('📝 Creating Super Admin user...');

            const passwordHash = await bcrypt.hash(DEMO_CONFIG.superAdmin.password, 10);

            superAdmin = superAdminRepository.create({
                first_name: DEMO_CONFIG.superAdmin.firstName,
                last_name: DEMO_CONFIG.superAdmin.lastName,
                email: DEMO_CONFIG.superAdmin.email,
                password_hash: passwordHash,
                role: DEMO_CONFIG.superAdmin.role,
                is_active: true,
                email_verified: true,
                permissions: { permissions: ['*'] },
                preferences: {},
            });

            await superAdminRepository.save(superAdmin);
            console.log('✅ Super Admin created successfully\n');
        } else {
            console.log('⚠️  Super Admin already exists, skipping...\n');
        }

        // Check if demo company already exists
        let demoCompany = await companiesRepository.findOne({
            where: { slug: DEMO_CONFIG.demoCompany.slug },
        });

        if (!demoCompany) {
            console.log('📝 Creating Demo Company...');

            const defaultFeatureFlags = {
                jobs: true,
                candidates: true,
                interviews: true,
                offers: true,
                submissions: true,
                reports: true,
                api: true,
                webhooks: true,
                sso: true,
                analytics: true,
                custom_fields: true,
                bulk_import: true,
            };

            demoCompany = companiesRepository.create({
                name: DEMO_CONFIG.demoCompany.name,
                slug: DEMO_CONFIG.demoCompany.slug,
                email: DEMO_CONFIG.demoCompany.email,
                license_tier: DEMO_CONFIG.demoCompany.licenseTier,
                feature_flags: defaultFeatureFlags,
                settings: DEMO_CONFIG.demoCompany.settings,
                is_active: true,
            });

            await companiesRepository.save(demoCompany);
            console.log('✅ Demo Company created successfully\n');
        } else {
            console.log('⚠️  Demo Company already exists, skipping...\n');
            demoCompany = await companiesRepository.findOne({
                where: { slug: DEMO_CONFIG.demoCompany.slug },
            });
        }

        // Check if demo admin already exists
        let demoAdmin = await usersRepository.findOne({
            where: {
                company_id: demoCompany.id,
                email: DEMO_CONFIG.demoAdmin.email,
            },
        });

        if (!demoAdmin) {
            console.log('📝 Creating Demo Company Admin user...');

            const passwordHash = await bcrypt.hash(DEMO_CONFIG.demoAdmin.password, 10);

            demoAdmin = usersRepository.create({
                company_id: demoCompany.id,
                first_name: DEMO_CONFIG.demoAdmin.firstName,
                last_name: DEMO_CONFIG.demoAdmin.lastName,
                email: DEMO_CONFIG.demoAdmin.email,
                password_hash: passwordHash,
                role: DEMO_CONFIG.demoAdmin.role,
                is_active: true,
                email_verified: true,
                permissions: {},
                preferences: {},
            });

            await usersRepository.save(demoAdmin);
            console.log('✅ Demo Admin created successfully\n');
        } else {
            console.log('⚠️  Demo Admin already exists, skipping...\n');
        }

        console.log('\n📊 SEEDING COMPLETE\n');
        console.log('📍 Super Admin Credentials:');
        console.log(`   Email: ${DEMO_CONFIG.superAdmin.email}`);
        console.log(`   Password: ${DEMO_CONFIG.superAdmin.password}`);
        console.log('   ⚠️  Change this password in production!\n');

        console.log('📍 Demo Company:');
        console.log(`   Name: ${DEMO_CONFIG.demoCompany.name}`);
        console.log(`   Slug: ${DEMO_CONFIG.demoCompany.slug}\n`);

        console.log('📍 Demo Company Admin Credentials:');
        console.log(`   Email: ${DEMO_CONFIG.demoAdmin.email}`);
        console.log(`   Password: ${DEMO_CONFIG.demoAdmin.password}`);
        console.log('   ⚠️  Have admin change this password on first login!\n');

        console.log('🚀 NEXT STEPS:');
        console.log('1. Login to Super Admin: POST /api/super-admin/auth/login');
        console.log('2. Login to Company: POST /api/auth/login');
        console.log('3. Start managing your ATS!\n');

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        throw error;
    } finally {
        await app.close();
    }
}

// Run if this file is executed directly
seedSuperAdmin().catch((error) => {
    console.error(error);
    process.exit(1);
});
