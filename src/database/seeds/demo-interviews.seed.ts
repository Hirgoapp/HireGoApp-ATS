import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const DEMO_COMPANY_ID = 'aee933be-7729-434e-b078-17c2f9ae4119';

function daysAgo(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}

function isoDateOnly(d: Date) {
    return d.toISOString().slice(0, 10);
}

function isoTimeOnly(d: Date) {
    return d.toISOString().slice(11, 19);
}

function pick<T>(arr: readonly T[], idx: number) {
    return arr[idx % arr.length];
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

    const demoCompany = await dataSource.query(`select id from companies where id=$1`, [DEMO_COMPANY_ID]);
    if (!demoCompany?.[0]?.id) throw new Error('Demo company missing. Run seed:demo first.');

    const admin = await dataSource.query(
        `select id from users where company_id=$1 and email=$2 limit 1`,
        [DEMO_COMPANY_ID, 'demo.admin@dummy.com'],
    );
    const recruiter = await dataSource.query(
        `select id from users where company_id=$1 and email=$2 limit 1`,
        [DEMO_COMPANY_ID, 'demo.recruiter@dummy.com'],
    );
    if (!admin?.[0]?.id || !recruiter?.[0]?.id) throw new Error('Demo users missing. Run seed:demo first.');

    const before = await dataSource.query(
        `select count(*)::int as n from interviews where company_id=$1 and deleted_at is null`,
        [DEMO_COMPANY_ID],
    );
    const beforeTotal = Number(before?.[0]?.n ?? 0);

    const targetTotal = 60;
    if (beforeTotal >= targetTotal) {
        console.log(`✅ Interviews already >= target (${beforeTotal}/${targetTotal}), skipping.`);
        await dataSource.destroy();
        return;
    }

    // Choose submissions that are in later stages for realism.
    const subs: Array<{ id: string; current_stage: string }> = await dataSource.query(
        `
        select id, current_stage
        from submissions
        where company_id=$1 and deleted_at is null
          and current_stage in ('Screening','Interview','Offer','Hired')
        order by created_at desc
        `,
        [DEMO_COMPANY_ID],
    );
    if (subs.length === 0) throw new Error('No demo submissions found. Run seed:demo:workflows first.');

    const rounds = ['screening', 'first', 'technical', 'final', 'hr'] as const;
    const modes = ['online', 'offline', 'phone'] as const;
    const statuses = ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'] as const;
    const feedbackRecommendation = ['hire', 'no_hire', 'neutral'] as const;

    let inserted = 0;
    let cursor = 0;
    const desired = targetTotal - beforeTotal;

    // Deterministic top-up: one interview per chosen submission (skip if already exists).
    for (const s of subs) {
        if (inserted >= desired) break;

        const already = await dataSource.query(
            `select id from interviews where company_id=$1 and submission_id=$2 and deleted_at is null limit 1`,
            [DEMO_COMPANY_ID, s.id],
        );
        if (already?.[0]?.id) continue;

        const baseDate = daysAgo(15 - (cursor % 12));
        baseDate.setHours(10 + (cursor % 6), 0, 0, 0);
        const end = new Date(baseDate.getTime() + 45 * 60 * 1000);

        const status = pick(statuses, cursor);
        const round = pick(rounds, cursor);
        const mode = pick(modes, cursor);

        const meeting_link = mode === 'online' ? `https://meet.example.com/demo-${s.id.slice(0, 8)}` : null;
        const location = mode === 'offline' ? pick(['NYC Office', 'Austin Office', 'Client Site'], cursor) : null;

        const ins = await dataSource.query(
            `
            insert into interviews
              (company_id, submission_id, round, scheduled_date, scheduled_time, interviewer_id, mode, status,
               feedback, score, remarks, location, meeting_link, created_by_id, updated_by_id,
               scheduled_at, completed_at, duration_minutes, notes, metadata, scheduled_start, scheduled_end)
            values
              ($1,$2,$3,$4,$5,$6,$7,$8,
               $9,$10,$11,$12,$13,$14,$15,
               $16,$17,$18,$19,$20,$21,$22)
            returning id
            `,
            [
                DEMO_COMPANY_ID,
                s.id,
                round,
                isoDateOnly(baseDate),
                isoTimeOnly(baseDate),
                recruiter[0].id, // interviewer
                mode,
                status,
                status === 'completed' ? 'Strong fundamentals; good communication.' : null,
                status === 'completed' ? 4.1 : null,
                status === 'cancelled' ? 'Cancelled due to reschedule request.' : null,
                location,
                meeting_link,
                admin[0].id,
                admin[0].id,
                baseDate.toISOString(),
                status === 'completed' ? end.toISOString() : null,
                45,
                status === 'no_show' ? 'Candidate did not join; follow-up pending.' : null,
                JSON.stringify({ is_demo: true, source_stage: s.current_stage }),
                baseDate.toISOString(),
                end.toISOString(),
            ],
        );

        const interviewId = ins[0].id as string;

        // Interviewers (add recruiter + optionally admin as hiring_manager)
        await dataSource.query(
            `insert into interview_interviewers (company_id, interview_id, interviewer_id, role)
             values ($1,$2,$3,$4)
             on conflict do nothing`,
            [DEMO_COMPANY_ID, interviewId, recruiter[0].id, 'interviewer'],
        );
        if (cursor % 3 === 0) {
            await dataSource.query(
                `insert into interview_interviewers (company_id, interview_id, interviewer_id, role)
                 values ($1,$2,$3,$4)
                 on conflict do nothing`,
                [DEMO_COMPANY_ID, interviewId, admin[0].id, 'hiring_manager'],
            );
        }

        // Feedback (only for completed)
        if (status === 'completed' && cursor % 2 === 0) {
            await dataSource.query(
                `insert into interview_feedback (company_id, interview_id, reviewer_id, rating, recommendation, comments)
                 values ($1,$2,$3,$4,$5,$6)`,
                [
                    DEMO_COMPANY_ID,
                    interviewId,
                    recruiter[0].id,
                    4.0,
                    pick(feedbackRecommendation, cursor),
                    'Structured feedback to support UI scorecards and filters.',
                ],
            );
        }

        // Status history (simple 2-step when completed)
        await dataSource.query(
            `insert into interview_status_history (company_id, interview_id, status, reason, changed_by_user_id)
             values ($1,$2,$3,$4,$5)`,
            [DEMO_COMPANY_ID, interviewId, 'scheduled', 'Seeded demo interview', admin[0].id],
        );
        if (status === 'completed') {
            await dataSource.query(
                `insert into interview_status_history (company_id, interview_id, status, reason, changed_by_user_id)
                 values ($1,$2,$3,$4,$5)`,
                [DEMO_COMPANY_ID, interviewId, 'completed', 'Interview completed', recruiter[0].id],
            );
        }

        inserted++;
        cursor++;
    }

    const after = await dataSource.query(
        `select count(*)::int as n from interviews where company_id=$1 and deleted_at is null`,
        [DEMO_COMPANY_ID],
    );

    console.log(`✅ Interviews seeded: +${inserted} (before=${beforeTotal}, after=${after[0].n}, target=${targetTotal})`);
    await dataSource.destroy();
    console.log('✅ Demo interviews seed complete');
}

main().catch((err) => {
    console.error('❌ Demo interviews seed error:', err);
    process.exit(1);
});

