import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../auth/entities/user.entity';
import { Client } from '../../modules/clients/entities/client.entity';
import { ClientPoc } from '../../modules/clients/entities/client-poc.entity';
import { Job } from '../../modules/jobs/entities/job.entity';

dotenv.config();

const DEMO_COMPANY_ID = 'aee933be-7729-434e-b078-17c2f9ae4119';

type DemoCandidateRow = {
    id: string;
    email: string;
};

type DemoJobRow = {
    id: string;
    job_code: string | null;
    title: string;
};

function daysAgo(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}

function isoDateOnly(d: Date) {
    return d.toISOString().slice(0, 10);
}

function pick<T>(arr: T[], idx: number) {
    return arr[idx % arr.length];
}

async function getDemoCompany(dataSource: DataSource): Promise<Company> {
    const repo = dataSource.getRepository(Company);
    const c = await repo.findOne({ where: { id: DEMO_COMPANY_ID } as any });
    if (!c) throw new Error(`Demo company not found (${DEMO_COMPANY_ID}). Run seed:demo first.`);
    return c;
}

async function getDemoUsers(dataSource: DataSource, companyId: string): Promise<{
    admin: User;
    recruiter: User;
}> {
    const repo = dataSource.getRepository(User);
    const admin = await repo.findOne({ where: { company_id: companyId, email: 'demo.admin@dummy.com' } as any });
    const recruiter = await repo.findOne({
        where: { company_id: companyId, email: 'demo.recruiter@dummy.com' } as any,
    });
    if (!admin) throw new Error('Missing demo admin user (demo.admin@dummy.com). Run seed:demo first.');
    if (!recruiter) throw new Error('Missing demo recruiter user (demo.recruiter@dummy.com). Run seed:demo first.');
    return { admin, recruiter };
}

async function seedClientsAndPocs(dataSource: DataSource, companyId: string, createdByUserId: string) {
    const clientRepo = dataSource.getRepository(Client);
    const pocRepo = dataSource.getRepository(ClientPoc);

    const industries = ['FinTech', 'Healthcare', 'Retail', 'SaaS', 'Logistics', 'Manufacturing', 'EdTech'];
    const statuses = ['Active', 'Inactive', 'On Hold'];
    const cities = ['New York', 'Austin', 'Seattle', 'San Francisco', 'Chicago', 'Boston', 'Denver'];
    const states = ['NY', 'TX', 'WA', 'CA', 'IL', 'MA', 'CO'];

    const clients: Client[] = [];

    for (let i = 1; i <= 25; i++) {
        const code = `DEMO-CL-${String(i).padStart(3, '0')}`;
        const name = pick(
            [
                'Northstar Systems',
                'Pinnacle Health Group',
                'Silverline Retail Co.',
                'Apex Logistics Partners',
                'Bluewood Manufacturing',
                'BrightPath Education',
                'Orbit Fintech Labs',
                'Harborview Analytics',
                'CedarWorks Consulting',
                'Summit Software Studio',
            ],
            i - 1,
        );

        const city = pick(cities, i - 1);
        const state = pick(states, i - 1);
        const status = pick(statuses, i - 1);

        const existing = await clientRepo.findOne({ where: { company_id: companyId, code } as any });
        const entity = clientRepo.create({
            ...(existing || {}),
            company_id: companyId,
            code,
            name: `${name} (${i})`,
            contact_person: `Primary Contact ${i}`,
            email: `client${String(i).padStart(3, '0')}@example.com`,
            phone: `+1 (555) 01${String(i).padStart(2, '0')}-${String(10 + i).padStart(4, '0')}`,
            address: `${100 + i} Market Street`,
            city,
            state,
            country: 'USA',
            postal_code: `9${String(1000 + i).slice(1)}`,
            website: `https://client-${String(i).padStart(3, '0')}.example.com`,
            industry: pick(industries, i - 1),
            status,
            payment_terms: pick(['Net 15', 'Net 30', 'Net 45'], i - 1),
            tax_id: i % 6 === 0 ? null : `TAX-${String(10000 + i)}`,
            notes:
                i % 7 === 0
                    ? 'Edge case: client has incomplete billing info; verify UI validation.'
                    : 'Strategic account used for demo workflows.',
            is_active: status === 'Active',
            created_by: existing?.created_by || createdByUserId,
            updated_by: createdByUserId,
        } as any);

        const saved = ((await clientRepo.save(entity)) as unknown) as Client;
        clients.push(saved);

        // Seed 1-2 POCs per client
        const pocCount = i % 5 === 0 ? 2 : 1;
        for (let p = 1; p <= pocCount; p++) {
            const pocEmail = `poc${String(i).padStart(3, '0')}.${p}@example.com`;
            const existingPoc = await pocRepo.findOne({
                where: { company_id: companyId, client_id: saved.id, email: pocEmail } as any,
            });
            const poc = pocRepo.create({
                ...(existingPoc || {}),
                company_id: companyId,
                client_id: saved.id,
                name: `POC ${i}.${p}`,
                designation: pick(['HR Manager', 'Talent Partner', 'Hiring Manager', 'Procurement'], i + p),
                email: pocEmail,
                phone: `+1 (555) 02${String(i).padStart(2, '0')}-${String(20 + p).padStart(4, '0')}`,
                linkedin: `https://linkedin.com/in/poc-${i}-${p}`,
                notes: p === 2 ? 'Secondary POC (edge case for UI selection).' : null,
                status: p === 2 && i % 10 === 0 ? 'Inactive' : 'Active',
            } as any);
            await pocRepo.save(poc);
        }
    }

    return clients;
}

async function seedJobs(
    dataSource: DataSource,
    companyId: string,
    createdById: string,
    hiringManagerId: string,
    clients: Client[],
) {
    const jobRepo = dataSource.getRepository(Job);
    const pocRepo = dataSource.getRepository(ClientPoc);

    const departments = ['Engineering', 'Product', 'Sales', 'Customer Success', 'Data', 'Security'];
    const locations = ['New York, NY', 'Austin, TX', 'Remote (US)', 'Seattle, WA', 'San Francisco, CA'];
    const employment = ['Full-time', 'Contract', 'Part-time'];
    const statuses = ['open', 'on-hold', 'closed', 'cancelled'];

    const jobs: Job[] = [];
    for (let i = 1; i <= 40; i++) {
        const job_code = `DEMO-JOB-${String(i).padStart(3, '0')}`;
        const title = pick(
            [
                'Senior Full-Stack Engineer',
                'Backend Engineer (Node.js)',
                'Frontend Engineer (React)',
                'Data Analyst',
                'DevOps Engineer',
                'Security Engineer',
                'Product Manager',
                'Sales Development Rep',
                'Customer Success Manager',
                'QA Automation Engineer',
            ],
            i - 1,
        );

        const status = pick(statuses, i - 1);
        const client = pick(clients, i - 1);
        const anyPoc = await pocRepo.findOne({ where: { company_id: companyId, client_id: client.id } as any });

        const existing = await jobRepo.findOne({ where: { company_id: companyId, job_code } as any });
        const published_at = status === 'open' || status === 'on-hold' ? daysAgo(20 - (i % 12)) : daysAgo(90 - i);
        const closed_at = status === 'closed' ? daysAgo(i % 20) : null;

        const entity = jobRepo.create({
            ...(existing || {}),
            company_id: companyId,
            title: `${title} (${i})`,
            description:
                'Realistic JD: role responsibilities, collaboration expectations, and impact. Used in demos for job view/search.',
            requirements:
                i % 4 === 0
                    ? 'Edge case: minimal requirements (test UI rendering).'
                    : '3+ years experience, strong communication, and ownership mindset.',
            job_code,
            department: pick(departments, i - 1),
            location: pick(locations, i - 1),
            salary_min: 90000 + i * 1500,
            salary_max: 130000 + i * 2000,
            salary_currency: 'USD',
            employment_type: pick(employment, i - 1),
            status,
            created_by_id: createdById,
            updated_by_id: createdById,
            hiring_manager_id: hiringManagerId,
            published_at,
            closed_at: closed_at as any,
            is_remote: /Remote/.test(pick(locations, i - 1)),
            is_hybrid: i % 9 === 0,
            priority: i % 10 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
            openings: i % 8 === 0 ? 3 : 1,
            required_skills: pick(
                [
                    ['TypeScript', 'PostgreSQL', 'REST'],
                    ['React', 'Redux', 'CSS'],
                    ['Node.js', 'NestJS', 'TypeORM'],
                    ['Python', 'SQL', 'Dashboards'],
                    ['AWS', 'Docker', 'CI/CD'],
                ],
                i - 1,
            ),
            preferred_skills: pick(
                [
                    ['GraphQL', 'Redis'],
                    ['Kubernetes', 'Terraform'],
                    ['Playwright', 'Cypress'],
                    ['Snowflake', 'dbt'],
                    ['Sentry', 'OpenTelemetry'],
                ],
                i - 1,
            ),
            tags: pick(
                [['hot'], ['backfill'], ['new-role'], ['campus'], ['urgent', 'client-priority']],
                i - 1,
            ),
            source: pick(['manual', 'imported', 'referral'], i - 1),
            client_id: client.id,
            poc_id: anyPoc?.id ?? null,
            client_req_id: i % 6 === 0 ? `ECMS-${500000 + i}` : null,
            work_mode: i % 3 === 0 ? 'Hybrid' : i % 2 === 0 ? 'WFO' : 'WFH',
            vendor_rate_currency: 'USD',
            vendor_rate_unit: i % 2 === 0 ? 'hourly' : 'daily',
            vendor_rate_value: i % 2 === 0 ? 85 + i : 700 + i * 4,
            vendor_rate_text: i % 2 === 0 ? `Up to USD ${85 + i}/hr` : `Up to USD ${700 + i * 4}/day`,
            submission_email: `submissions+${job_code.toLowerCase()}@example.com`,
        } as any);

        const saved = ((await jobRepo.save(entity)) as unknown) as Job;
        jobs.push(saved);
    }

    return jobs;
}

async function seedCandidatesRaw(
    dataSource: DataSource,
    companyId: string,
    createdById: string,
    recruiterUserId: string,
) {
    const firstNames = ['Aisha', 'Ben', 'Carla', 'Dinesh', 'Elena', 'Farah', 'Gabe', 'Hana', 'Ivan', 'Julia'];
    const lastNames = ['Singh', 'Martinez', 'Chen', 'Patel', 'Johnson', 'Nguyen', 'Kim', 'Garcia', 'Brown', 'Lopez'];
    const statuses = ['prospect', 'active', 'archived', 'rejected'];
    const sources = ['LinkedIn', 'Referral', 'Inbound', 'Agency', 'Career Site'];
    const locations = ['New York, NY', 'Austin, TX', 'Seattle, WA', 'Remote', 'Chicago, IL'];

    const created: DemoCandidateRow[] = [];

    // Insert 60 candidates; idempotent by email lookup
    for (let i = 1; i <= 60; i++) {
        const first_name = pick(firstNames, i - 1);
        const last_name = pick(lastNames, i - 1);
        const email = `candidate${String(i).padStart(3, '0')}@demo.dummy.com`;
        const status = pick(statuses, i - 1);
        const tags = JSON.stringify(
            pick([['java'], ['typescript'], ['react'], ['node'], ['aws'], ['data']], i - 1).concat(i % 10 === 0 ? ['vip'] : []),
        );
        const custom_fields = JSON.stringify({
            is_demo: true,
            demo_bucket: i % 5 === 0 ? 'edge' : 'standard',
        });

        const existing = await dataSource.query(
            `select id, email from candidates where company_id = $1 and email = $2 limit 1`,
            [companyId, email],
        );
        if (existing?.[0]?.id) {
            created.push({ id: existing[0].id, email: existing[0].email });
            continue;
        }

        const inserted = await dataSource.query(
            `
            insert into candidates
              (company_id, first_name, last_name, email, phone, location, current_company, current_job_title,
               experience_years, summary, linkedin_url, portfolio_url, source, sourced_by_id, status, tags,
               overall_rating, notes, custom_fields, city, country, timezone, availability_date, notice_period,
               created_by_id, updated_by_id, resume_url, candidate_name, candidate_status, skill_set)
            values
              ($1,$2,$3,$4,$5,$6,$7,$8,
               $9,$10,$11,$12,$13,$14,$15,$16,
               $17,$18,$19,$20,$21,$22,$23,$24,
               $25,$26,$27,$28,$29,$30)
            returning id, email
            `,
            [
                companyId,
                first_name,
                last_name,
                email,
                i % 7 === 0 ? null : `+1 (555) 03${String(i).padStart(2, '0')}-${String(1000 + i).slice(1)}`,
                pick(locations, i - 1),
                pick(['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Stark Industries'], i - 1),
                pick(['Software Engineer', 'Data Analyst', 'DevOps Engineer', 'QA Engineer'], i - 1),
                i % 12 === 0 ? null : (2 + (i % 10)),
                i % 9 === 0 ? null : 'Strong communicator; consistent delivery; good team fit.',
                `https://linkedin.com/in/${first_name.toLowerCase()}-${last_name.toLowerCase()}-${i}`,
                i % 4 === 0 ? `https://portfolio.example.com/${first_name.toLowerCase()}${i}` : null,
                pick(sources, i - 1),
                recruiterUserId,
                status,
                tags,
                i % 11 === 0 ? 4.5 : null,
                i % 13 === 0 ? 'Edge case: candidate missing phone; verify UI handles gracefully.' : null,
                custom_fields,
                pick(['New York', 'Austin', 'Seattle', 'Chicago'], i - 1),
                'USA',
                pick(['America/New_York', 'America/Chicago', 'America/Los_Angeles'], i - 1),
                i % 8 === 0 ? isoDateOnly(daysAgo(3)) : null,
                i % 6 === 0 ? '2 weeks' : i % 5 === 0 ? 'Immediate' : '30 days',
                createdById,
                createdById,
                i % 10 === 0 ? null : `https://files.example.com/resume/${email}.pdf`,
                `${first_name} ${last_name}`,
                status,
                pick(['TypeScript, Node.js, PostgreSQL', 'React, CSS, UX', 'AWS, Docker, CI/CD', 'SQL, BI, Analytics'], i - 1),
            ],
        );

        created.push({ id: inserted[0].id, email: inserted[0].email });
    }

    return created;
}

async function seedSubmissionsRaw(
    dataSource: DataSource,
    companyId: string,
    createdById: string,
    jobs: DemoJobRow[],
    candidates: DemoCandidateRow[],
) {
    const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
    const outcomes = [null, null, null, 'hired', 'rejected', 'withdrawn'];

    const desiredTotal = 150;
    const minTotal = 40; // hard minimum for demos/filters

    const beforeRow = await dataSource.query(
        `select count(*)::int as n from submissions where company_id = $1 and deleted_at is null`,
        [companyId],
    );
    const beforeTotal = Number(beforeRow?.[0]?.n ?? 0);

    const targetTotal = Math.max(minTotal, desiredTotal);
    if (beforeTotal >= targetTotal) {
        return { inserted: 0, beforeTotal, afterTotal: beforeTotal, targetTotal };
    }

    // Load existing active pairs so we can reliably "top up" even if the first few pairs are already taken.
    const existingPairsRows: Array<{ candidate_id: string; job_id: string }> = await dataSource.query(
        `select candidate_id, job_id from submissions where company_id = $1 and deleted_at is null`,
        [companyId],
    );
    const existingPairs = new Set(existingPairsRows.map((r) => `${r.candidate_id}:${r.job_id}`));

    let inserted = 0;
    let cursor = 0;

    // Deterministic sweep through job×candidate space to find unused pairs.
    for (let j = 0; j < jobs.length && beforeTotal + inserted < targetTotal; j++) {
        for (let c = 0; c < candidates.length && beforeTotal + inserted < targetTotal; c++) {
            const job = jobs[(j + (cursor % 3)) % jobs.length];
            const candidate = candidates[(c * 7 + j) % candidates.length];
            const key = `${candidate.id}:${job.id}`;
            cursor++;
            if (existingPairs.has(key)) continue;

            const stage = pick(stages, cursor);
            const submitted_at = isoDateOnly(daysAgo(30 - (cursor % 25)));
            const moved_to_stage_at = isoDateOnly(daysAgo(20 - (cursor % 15)));
            const outcome = pick(outcomes, cursor);

            await dataSource.query(
                `
                insert into submissions
                  (company_id, candidate_id, job_id, current_stage, submitted_at, moved_to_stage_at,
                   outcome, outcome_date, internal_notes, source, score, tags, created_by_id, updated_by_id)
                values
                  ($1,$2,$3,$4,$5,$6,
                   $7,$8,$9,$10,$11,$12,$13,$14)
                `,
                [
                    companyId,
                    candidate.id,
                    job.id,
                    stage,
                    submitted_at,
                    moved_to_stage_at,
                    outcome,
                    outcome ? isoDateOnly(daysAgo(5 + (cursor % 10))) : null,
                    stage === 'Rejected' ? 'Rejected after screening; skills mismatch.' : 'Demo submission record.',
                    pick(['manual', 'imported', 'referral'], cursor),
                    stage === 'Interview' ? 3.5 : stage === 'Offer' ? 4.2 : null,
                    JSON.stringify(stage === 'Offer' ? ['fast-track'] : ['demo']),
                    createdById,
                    createdById,
                ],
            );

            existingPairs.add(key);
            inserted++;
        }
    }

    const afterRow = await dataSource.query(
        `select count(*)::int as n from submissions where company_id = $1 and deleted_at is null`,
        [companyId],
    );
    const afterTotal = Number(afterRow?.[0]?.n ?? beforeTotal + inserted);

    return { inserted, beforeTotal, afterTotal, targetTotal };
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

    const demoCompany = await getDemoCompany(dataSource);
    const { admin, recruiter } = await getDemoUsers(dataSource, demoCompany.id);

    const clients = await seedClientsAndPocs(dataSource, demoCompany.id, admin.id);
    console.log(`✅ Clients seeded: ${clients.length} (with POCs)`);

    const jobs = await seedJobs(dataSource, demoCompany.id, admin.id, recruiter.id, clients);
    console.log(`✅ Jobs seeded: ${jobs.length}`);

    const candidates = await seedCandidatesRaw(dataSource, demoCompany.id, admin.id, recruiter.id);
    console.log(`✅ Candidates seeded (raw): ${candidates.length}`);

    const submissionInsertCount = await seedSubmissionsRaw(
        dataSource,
        demoCompany.id,
        admin.id,
        jobs.map((j) => ({ id: j.id, job_code: j.job_code ?? null, title: j.title })),
        candidates,
    );
    console.log(
        `✅ Submissions seeded: +${submissionInsertCount.inserted} (before=${submissionInsertCount.beforeTotal}, after=${submissionInsertCount.afterTotal}, target=${submissionInsertCount.targetTotal})`,
    );

    await dataSource.destroy();
    console.log('✅ Demo workflows seed complete');
}

main().catch((err) => {
    console.error('❌ Demo workflows seed error:', err);
    process.exit(1);
});

