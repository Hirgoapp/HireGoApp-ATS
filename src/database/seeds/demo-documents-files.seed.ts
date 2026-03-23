import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const DEMO_COMPANY_ID = 'aee933be-7729-434e-b078-17c2f9ae4119';

function pick<T>(arr: readonly T[], idx: number) {
    return arr[idx % arr.length];
}

function daysAgo(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}

async function main() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'ats_saas',
        synchronize: false,
    });

    await dataSource.initialize();
    console.log('✅ Database connected');

    const admin = await dataSource.query(
        `select id from users where company_id=$1 and email=$2 limit 1`,
        [DEMO_COMPANY_ID, 'demo.admin@dummy.com'],
    );
    if (!admin?.[0]?.id) throw new Error('Demo admin missing. Run seed:demo first.');
    const adminId = admin[0].id as string;

    const candidates: Array<{ id: string; email: string; first_name: string; last_name: string }> = await dataSource.query(
        `select id, email, first_name, last_name from candidates where company_id=$1 and deleted_at is null order by created_at desc`,
        [DEMO_COMPANY_ID],
    );
    const jobs: Array<{ id: string; title: string }> = await dataSource.query(
        `select id, title from jobs where company_id=$1 and deleted_at is null order by created_at desc`,
        [DEMO_COMPANY_ID],
    );
    const clients: Array<{ id: string; name: string }> = await dataSource.query(
        `select id, name from clients where company_id=$1 and deleted_at is null order by created_at desc`,
        [DEMO_COMPANY_ID],
    );
    const submissions: Array<{ id: string; job_id: string }> = await dataSource.query(
        `select id, job_id from submissions where company_id=$1 and deleted_at is null order by created_at desc`,
        [DEMO_COMPANY_ID],
    );

    if (candidates.length === 0) throw new Error('No demo candidates found. Run seed:demo:workflows first.');

    // -------------------------
    // documents table (DB schema)
    // -------------------------
    const beforeDocs = await dataSource.query(
        `select count(*)::int as n from documents where company_id=$1 and deleted_at is null`,
        [DEMO_COMPANY_ID],
    );
    const beforeDocsTotal = Number(beforeDocs?.[0]?.n ?? 0);
    const docsTarget = 80;

    const docTypes = ['resume', 'cover_letter', 'portfolio', 'id_proof'] as const;
    const processing = ['pending', 'processed', 'failed'] as const;

    let insertedDocs = 0;
    for (let i = 0; i < candidates.length && beforeDocsTotal + insertedDocs < docsTarget; i++) {
        const c = candidates[i];
        const type = i % 6 === 0 ? 'portfolio' : i % 5 === 0 ? 'cover_letter' : 'resume';
        const file_name =
            type === 'resume'
                ? `${c.first_name}_${c.last_name}_Resume.pdf`
                : type === 'cover_letter'
                  ? `${c.first_name}_${c.last_name}_CoverLetter.pdf`
                  : `${c.first_name}_${c.last_name}_${type}.pdf`;

        const exists = await dataSource.query(
            `select id from documents where company_id=$1 and candidate_id=$2 and document_type=$3 and file_name=$4 and deleted_at is null limit 1`,
            [DEMO_COMPANY_ID, c.id, type, file_name],
        );
        if (exists?.[0]?.id) continue;

        const status = pick(processing, i);
        const extracted_text =
            status === 'processed' && type === 'resume'
                ? `Summary: ${c.first_name} ${c.last_name} is a demo candidate. Skills: TypeScript, Node.js, SQL.`
                : null;

        await dataSource.query(
            `
            insert into documents
              (company_id, candidate_id, uploaded_by_id, file_name, file_type, file_size, mime_type, s3_key,
               document_type, extracted_text, extracted_metadata, processing_status, created_at, updated_at)
            values
              ($1,$2,$3,$4,$5,$6,$7,$8,
               $9,$10,$11,$12,$13,$14)
            `,
            [
                DEMO_COMPANY_ID,
                c.id,
                adminId,
                file_name,
                'pdf',
                120_000 + i * 1100,
                'application/pdf',
                `demo/${DEMO_COMPANY_ID}/candidates/${c.id}/${file_name}`,
                type,
                extracted_text,
                JSON.stringify({ is_demo: true, candidateEmail: c.email }),
                status,
                daysAgo(40 - (i % 30)).toISOString(),
                daysAgo(20 - (i % 15)).toISOString(),
            ],
        );

        insertedDocs++;
    }

    const afterDocs = await dataSource.query(
        `select count(*)::int as n from documents where company_id=$1 and deleted_at is null`,
        [DEMO_COMPANY_ID],
    );
    console.log(`✅ Documents seeded: +${insertedDocs} (before=${beforeDocsTotal}, after=${afterDocs[0].n}, target=${docsTarget})`);

    // -------------------------
    // files table (generic attachments across entities)
    // -------------------------
    const beforeFiles = await dataSource.query(
        `select count(*)::int as n from files where company_id=$1`,
        [DEMO_COMPANY_ID],
    );
    const beforeFilesTotal = Number(beforeFiles?.[0]?.n ?? 0);
    const filesTarget = 120;

    const mime = [
        { mime_type: 'application/pdf', ext: 'pdf' },
        { mime_type: 'image/png', ext: 'png' },
        { mime_type: 'text/plain', ext: 'txt' },
    ] as const;

    const entities: Array<{ entity_type: string; ids: string[] }> = [
        { entity_type: 'Candidate', ids: candidates.map((x) => x.id) },
        { entity_type: 'Job', ids: jobs.map((x) => x.id) },
        { entity_type: 'Client', ids: clients.map((x) => x.id) },
        { entity_type: 'Submission', ids: submissions.map((x) => x.id) },
    ].filter((e) => e.ids.length > 0);

    let insertedFiles = 0;
    let cursor = 0;
    while (beforeFilesTotal + insertedFiles < filesTarget && cursor < entities.length * 500) {
        const e = pick(entities, cursor);
        const entity_id = pick(e.ids, cursor);
        const f = pick(mime, cursor);
        const file_name = `${e.entity_type.toLowerCase()}_${entity_id.slice(0, 8)}_${String(cursor).padStart(3, '0')}.${f.ext}`;

        const exists = await dataSource.query(
            `select id from files where company_id=$1 and entity_type=$2 and entity_id=$3 and file_name=$4 limit 1`,
            [DEMO_COMPANY_ID, e.entity_type, entity_id, file_name],
        );
        if (exists?.[0]?.id) {
            cursor++;
            continue;
        }

        await dataSource.query(
            `
            insert into files
              (company_id, entity_type, entity_id, file_name, file_url, file_size, mime_type, storage_provider, uploaded_by, created_at)
            values
              ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            `,
            [
                DEMO_COMPANY_ID,
                e.entity_type,
                entity_id,
                file_name,
                `https://files.example.com/demo/${DEMO_COMPANY_ID}/${e.entity_type.toLowerCase()}/${entity_id}/${file_name}`,
                50_000 + (cursor % 20_000),
                f.mime_type,
                'local',
                adminId,
                daysAgo(30 - (cursor % 25)).toISOString(),
            ],
        );

        insertedFiles++;
        cursor++;
    }

    const afterFiles = await dataSource.query(
        `select count(*)::int as n from files where company_id=$1`,
        [DEMO_COMPANY_ID],
    );
    console.log(`✅ Files seeded: +${insertedFiles} (before=${beforeFilesTotal}, after=${afterFiles[0].n}, target=${filesTarget})`);

    await dataSource.destroy();
    console.log('✅ Demo documents/files seed complete');
}

main().catch((err) => {
    console.error('❌ Demo documents/files seed error:', err);
    process.exit(1);
});

