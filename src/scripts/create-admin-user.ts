/**
 * Admin User Creation Script
 * 
 * Usage:
 *   npx ts-node src/scripts/create-admin-user.ts
 * 
 * This script automates the entire process of:
 * 1. Connecting to PostgreSQL
 * 2. Getting available companies
 * 3. Creating/verifying Admin role
 * 4. Generating bcrypt password hash
 * 5. Inserting admin user
 */

import * as readline from 'readline';
import * as bcrypt from 'bcrypt';
import { createConnection } from 'typeorm';
import { ConfigService } from '@nestjs/config';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer);
        });
    });
};

async function main() {
    try {
        console.log('\n╔════════════════════════════════════════════╗');
        console.log('║    ATS Admin User Creation Script          ║');
        console.log('╚════════════════════════════════════════════╝\n');

        // Step 1: Connect to database
        console.log('📡 Connecting to PostgreSQL...\n');

        const connection = await createConnection({
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'password',
            database: process.env.DB_NAME || 'ats_saas',
            entities: ['src/**/*.entity.ts'],
            synchronize: false,
            logging: false,
        });

        console.log('✅ Connected to database\n');

        // Step 2: Get available companies
        console.log('📋 Available Companies:\n');

        const companies = await connection.query(
            'SELECT id, name FROM companies ORDER BY created_at DESC LIMIT 10'
        );

        if (companies.length === 0) {
            console.error(
                '❌ No companies found. Please create a company first.\n'
            );
            await connection.close();
            rl.close();
            return;
        }

        companies.forEach((company: any, index: number) => {
            console.log(`  ${index + 1}. ${company.name}`);
            console.log(`     ID: ${company.id}\n`);
        });

        // Step 3: User selects company
        const companyIndex = parseInt(
            await question('Select company number (1-' + companies.length + '): ')
        );

        if (companyIndex < 1 || companyIndex > companies.length) {
            console.error('❌ Invalid selection\n');
            await connection.close();
            rl.close();
            return;
        }

        const selectedCompany = companies[companyIndex - 1];
        console.log(
            `\n✅ Selected: ${selectedCompany.name} (${selectedCompany.id})\n`
        );

        // Step 4: Get or create Admin role
        console.log('🔍 Looking for Admin role...\n');

        let adminRole = await connection.query(
            `SELECT id FROM roles 
             WHERE company_id = $1 AND slug = 'admin'`,
            [selectedCompany.id]
        );

        let adminRoleId: string;

        if (adminRole.length === 0) {
            console.log('⚠️  Admin role not found. Creating...\n');

            adminRoleId = (await connection.query(
                `INSERT INTO roles (
                    id, company_id, name, slug, description, 
                    is_system, is_default, display_order, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(),
                    $1,
                    'Admin',
                    'admin',
                    'Full system access',
                    true,
                    false,
                    1,
                    NOW(),
                    NOW()
                ) RETURNING id`,
                [selectedCompany.id]
            ))[0].id;

            console.log(`✅ Created Admin role\n`);
        } else {
            adminRoleId = adminRole[0].id;
            console.log(`✅ Found Admin role: ${adminRoleId}\n`);
        }

        // Step 5: Get admin user details
        const firstName = await question('First name [Admin]: ');
        const lastName = await question('Last name [User]: ');
        const email = await question('Email [admin@example.com]: ');
        const password = await question('Password [Admin123!]: ');

        const adminFirstName = firstName || 'Admin';
        const adminLastName = lastName || 'User';
        const adminEmail = email || 'admin@example.com';
        const adminPassword = password || 'Admin123!';

        console.log('\n🔐 Generating bcrypt hash...\n');

        const passwordHash = await bcrypt.hash(adminPassword, 10);

        console.log(`✅ Hash generated\n`);

        // Step 6: Check if user already exists
        const existingUser = await connection.query(
            `SELECT id FROM users WHERE company_id = $1 AND email = $2`,
            [selectedCompany.id, adminEmail]
        );

        if (existingUser.length > 0) {
            const overwrite = await question(
                `⚠️  User with email "${adminEmail}" already exists. Overwrite? (y/n) [n]: `
            );

            if (overwrite.toLowerCase() !== 'y') {
                console.log('\n❌ Aborted\n');
                await connection.close();
                rl.close();
                return;
            }

            // Delete existing user
            await connection.query('DELETE FROM users WHERE id = $1', [
                existingUser[0].id,
            ]);
            console.log('Deleted existing user\n');
        }

        // Step 7: Insert admin user
        console.log('📝 Inserting admin user...\n');

        const result = await connection.query(
            `INSERT INTO users (
                id, company_id, first_name, last_name, email,
                password_hash, auth_provider,
                role_id, is_active, email_verified,
                created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                $1,
                $2,
                $3,
                $4,
                $5,
                'email',
                $6,
                TRUE,
                TRUE,
                NOW(),
                NOW()
            ) RETURNING id`,
            [
                selectedCompany.id,
                adminFirstName,
                adminLastName,
                adminEmail,
                passwordHash,
                adminRoleId,
            ]
        );

        const newUserId = result[0].id;

        console.log('✅ Admin user created successfully!\n');
        console.log('╔════════════════════════════════════════════╗');
        console.log('║          User Created                      ║');
        console.log('╚════════════════════════════════════════════╝\n');
        console.log(`User ID:        ${newUserId}`);
        console.log(`Company:        ${selectedCompany.name}`);
        console.log(`Email:          ${adminEmail}`);
        console.log(`Name:           ${adminFirstName} ${adminLastName}`);
        console.log(`Role:           Admin`);
        console.log(`Status:         Active ✅`);
        console.log('\n🎉 You can now login with these credentials!\n');
        console.log('Login URL:      http://localhost:5173/login');
        console.log(`Email:          ${adminEmail}`);
        console.log(`Password:       ${adminPassword}\n`);
        console.log('⚠️  IMPORTANT: Change this password after first login!\n');

        await connection.close();
        rl.close();
    } catch (error) {
        console.error('\n❌ Error:', error.message, '\n');
        rl.close();
        process.exit(1);
    }
}

main();
