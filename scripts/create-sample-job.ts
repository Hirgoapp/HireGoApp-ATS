import 'dotenv/config';
import { DataSource } from 'typeorm';

async function main() {
    const ds = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'ats_saas',
        entities: [],
        synchronize: false,
        logging: false,
        ssl: false,
    });

    await ds.initialize();

    const tableCheck = await ds.query(
        "select table_name from information_schema.tables where table_schema='public' and table_name in ('job_requirements','jobs')"
    );

    const tableName = tableCheck.find((r: any) => r.table_name === 'job_requirements')
        ? 'job_requirements'
        : tableCheck.find((r: any) => r.table_name === 'jobs')
            ? 'jobs'
            : null;

    if (!tableName) {
        throw new Error('No jobs table found (looked for job_requirements or jobs)');
    }

    if (tableName === 'job_requirements') {
        const ecmsReqId = `AUTO-${Date.now()}`;
        const jobTitle = 'Senior PEGA developer - India';
        const jd = SAMPLE_JD;

        const insertSql = `
      INSERT INTO job_requirements (
        ecms_req_id,
        client_id,
        job_title,
        job_description,
        mandatory_skills,
        desired_skills,
        work_location,
        wfo_wfh_hybrid,
        vendor_rate,
        currency,
        country,
        number_of_openings,
        active_flag,
        priority,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
      ) RETURNING id, ecms_req_id, job_title, client_id, created_at;
    `;

        const params = [
            ecmsReqId,
            1,
            jobTitle,
            jd,
            'Senior PEGA developer',
            'Senior PEGA developer with 7 yrs of exp',
            'Pune/Hyderabad/Bangalore',
            'Hybrid',
            15000,
            'INR',
            'India',
            1,
            true,
            'High',
        ];

        const result = await ds.query(insertSql, params);
        console.log('✅ Inserted job into job_requirements:', result[0]);
    } else {
        const companyRow = await ds.query('select id from companies limit 1');
        const userRow = await ds.query('select id from users limit 1');
        if (!companyRow.length || !userRow.length) {
            throw new Error('Need at least one company and one user to insert into jobs table');
        }
        const companyId = companyRow[0].id;
        const userId = userRow[0].id;

        const jobTitle = deriveTitle(SAMPLE_JD) || 'Senior PEGA developer - India';

        const insertSql = `
      INSERT INTO jobs (
        company_id,
        title,
        description,
        requirements,
        employment_type,
        status,
        created_by_id,
        salary_currency,
        use_dynamic_jd,
        jd_content,
        jd_format,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
      ) RETURNING id, title, company_id, created_by_id, created_at;
    `;

        const params = [
            companyId,
            jobTitle,
            SAMPLE_JD,
            null,
            'Full-time',
            'open',
            userId,
            'INR',
            true,
            SAMPLE_JD,
            'plain',
        ];

        const result = await ds.query(insertSql, params);
        console.log('✅ Inserted job into jobs:', result[0]);
    }

    await ds.destroy();
}

function deriveTitle(text: string): string {
    const firstLine = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find((l) => l.length > 0);
    if (!firstLine) return '';
    return firstLine.length > 80 ? firstLine.slice(0, 80) : firstLine;
}

const SAMPLE_JD = `From: Lakshya Sajnani <lakshya.sajnani@infosys.com>
Sent: 11 November 2025 18:50
Cc: Navnit Kumar <Navnit_Kumar@infosys.com>; Akshatha S <akshatha.2172788@infosys.com>
Subject: 545390 - Senior PEGA developer - India - EAIS

Dear Vendor Partners,
***Please do not change the subject line ***
New interview guidelines and process change mentioned below.

Candidate Tracker fields:
- Vendor email ID
- Title
- Candidate Name
- Phone No
- Email
- Notice Period
- Current Location
- Location applying for
- Total Experience
- Relevant Experience
- Skills
- Vendor Quoted Rate
- Interview screenshot
- Visa Type
- Agreed for Full time/Subcon
- If ex-Infy (provide the Employee ID)

JD format:
Date Of Requisition: 11-Nov-2025
ECMS REQ ID: 545390
PU: EAISHIL
Project Manager: Muthulingam
Delivery SPOC: Bhushan
Number of Openings: 1
Country: India
Roles and Responsibilities:
  - Liaison with client Product Owner/SMEs to gather functional requirements
  - Design functional solution approach with Solution Architect and Lead System Architect(s)
  - Participate in workflow analysis and business process analysis
  - Focus on value-driven delivery; resolve dependencies and create roadmap
  - Participate in Design Sprints; validate functional design; help prioritize backlogs
  - Ensure best design practices; work with developers to achieve design
Total Experience: 7+yrs
Relevant Experience: Senior PEGA developer with 7 yrs of exp
Mandatory skills: 7+yrs of hands-on exp Senior PEGA developer
Desired skills: Senior PEGA developer with 7 yrs of exp
Domain: Banking
Work Location: Pune/Hyderabad/Bangalore PAN India
Background check: Before onboarding
Mode of Interview: Client Interview/F2F
WFO / WFH / Hybrid: Hybrid
Vendor Rate in currency of Work Location: Up to INR 15000/Day
Regards,
Lakshya Sajnani
Lead- Talent Acquisition
M: 9619580685
www.infosys.com`;

main().catch((err) => {
    console.error('❌ Failed to insert sample job:', err);
    process.exit(1);
});
