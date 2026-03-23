import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const DEMO_COMPANY_ID = 'aee933be-7729-434e-b078-17c2f9ae4119';

function daysAgo(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
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

    const users: Array<{ id: string; email: string }> = await dataSource.query(
        `select id, email from users where company_id=$1`,
        [DEMO_COMPANY_ID],
    );
    if (users.length === 0) throw new Error('No demo users. Run seed:demo first.');

    const jobs: Array<{ id: string; title: string }> = await dataSource.query(
        `select id, title from jobs where company_id=$1 and deleted_at is null order by created_at desc`,
        [DEMO_COMPANY_ID],
    );
    const candidates: Array<{ id: string; email: string; first_name: string; last_name: string }> = await dataSource.query(
        `select id, email, first_name, last_name from candidates where company_id=$1 and deleted_at is null order by created_at desc`,
        [DEMO_COMPANY_ID],
    );
    const submissions: Array<{ id: string; job_id: string; current_stage: string }> = await dataSource.query(
        `select id, job_id, current_stage from submissions where company_id=$1 and deleted_at is null order by created_at desc`,
        [DEMO_COMPANY_ID],
    );
    const interviews: Array<{ id: string; submission_id: string; status: string }> = await dataSource.query(
        `select id, submission_id, status from interviews where company_id=$1 and deleted_at is null order by created_at desc`,
        [DEMO_COMPANY_ID],
    );
    const offers: Array<{ id: string; submission_id: string; status: string }> = await dataSource.query(
        `select id, submission_id, status from offers where company_id=$1 and deleted_at is null order by created_at desc`,
        [DEMO_COMPANY_ID],
    );

    // -------------------------
    // Activities (timeline)
    // -------------------------
    const beforeActivities = await dataSource.query(
        `select count(*)::int as n from activities where company_id=$1`,
        [DEMO_COMPANY_ID],
    );
    const beforeActivitiesTotal = Number(beforeActivities?.[0]?.n ?? 0);
    const activitiesTarget = 220;

    const activityTypes = [
        'job_created',
        'job_published',
        'candidate_created',
        'candidate_updated',
        'candidate_submitted_to_job',
        'submission_status_updated',
        'interview_scheduled',
        'interview_completed',
        'offer_created',
        'offer_sent',
    ] as const;

    let insertedActivities = 0;
    let cursor = 0;
    while (beforeActivitiesTotal + insertedActivities < activitiesTarget && cursor < 5000) {
        const u = pick(users, cursor);
        const job = jobs.length ? pick(jobs, cursor) : null;
        const cand = candidates.length ? pick(candidates, cursor * 3) : null;
        const sub = submissions.length ? pick(submissions, cursor * 7) : null;
        const iv = interviews.length ? pick(interviews, cursor * 5) : null;
        const off = offers.length ? pick(offers, cursor * 11) : null;

        const activity_type = pick(activityTypes, cursor);
        const created_at = daysAgo(45 - (cursor % 40)).toISOString();

        let entity_type = 'Company';
        let entity_id = DEMO_COMPANY_ID;
        let message = 'Demo activity';
        let metadata: any = { is_demo: true };

        if (activity_type.startsWith('job') && job) {
            entity_type = 'Job';
            entity_id = job.id;
            message = activity_type === 'job_created' ? `Job created: ${job.title}` : `Job published: ${job.title}`;
            metadata = { ...metadata, jobId: job.id };
        } else if (activity_type.startsWith('candidate') && cand) {
            entity_type = 'Candidate';
            entity_id = cand.id;
            message =
                activity_type === 'candidate_created'
                    ? `Candidate created: ${cand.first_name} ${cand.last_name}`
                    : `Candidate updated: ${cand.first_name} ${cand.last_name}`;
            metadata = { ...metadata, candidateId: cand.id, email: cand.email };
        } else if (activity_type.startsWith('submission') && sub) {
            entity_type = 'Submission';
            entity_id = sub.id;
            message = `Submission status updated: ${sub.current_stage}`;
            metadata = { ...metadata, submissionId: sub.id, stage: sub.current_stage, jobId: sub.job_id };
        } else if (activity_type.startsWith('interview') && iv) {
            entity_type = 'Interview';
            entity_id = iv.id;
            message =
                activity_type === 'interview_scheduled'
                    ? 'Interview scheduled'
                    : `Interview completed (${iv.status})`;
            metadata = { ...metadata, interviewId: iv.id, submissionId: iv.submission_id };
        } else if (activity_type.startsWith('offer') && off) {
            entity_type = 'Offer';
            entity_id = off.id;
            message = activity_type === 'offer_created' ? 'Offer created' : `Offer sent (${off.status})`;
            metadata = { ...metadata, offerId: off.id, submissionId: off.submission_id };
        } else if (sub) {
            entity_type = 'Submission';
            entity_id = sub.id;
            message = `Candidate submitted to job`;
            metadata = { ...metadata, submissionId: sub.id, jobId: sub.job_id };
        }

        // Idempotency: avoid duplicate same activity type + entity + day (rough)
        const exists = await dataSource.query(
            `select id from activities where company_id=$1 and entity_type=$2 and entity_id=$3 and activity_type=$4 and created_at::date = $5::date limit 1`,
            [DEMO_COMPANY_ID, entity_type, entity_id, activity_type, created_at],
        );
        if (exists?.[0]?.id) {
            cursor++;
            continue;
        }

        await dataSource.query(
            `insert into activities (company_id, entity_type, entity_id, activity_type, message, metadata, created_by, created_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
                DEMO_COMPANY_ID,
                entity_type,
                entity_id,
                activity_type,
                message,
                JSON.stringify(metadata),
                u.id,
                created_at,
            ],
        );

        insertedActivities++;
        cursor++;
    }

    const afterActivities = await dataSource.query(
        `select count(*)::int as n from activities where company_id=$1`,
        [DEMO_COMPANY_ID],
    );
    console.log(
        `✅ Activities seeded: +${insertedActivities} (before=${beforeActivitiesTotal}, after=${afterActivities[0].n}, target=${activitiesTarget})`,
    );

    // -------------------------
    // Audit logs
    // -------------------------
    const beforeAudit = await dataSource.query(
        `select count(*)::int as n from audit_logs where company_id=$1`,
        [DEMO_COMPANY_ID],
    );
    const beforeAuditTotal = Number(beforeAudit?.[0]?.n ?? 0);
    const auditTarget = 180;

    const auditActions = ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN'] as const;

    let insertedAudit = 0;
    cursor = 0;
    while (beforeAuditTotal + insertedAudit < auditTarget && cursor < 5000) {
        const u = pick(users, cursor);
        const job = jobs.length ? pick(jobs, cursor) : null;
        const cand = candidates.length ? pick(candidates, cursor * 3) : null;
        const sub = submissions.length ? pick(submissions, cursor * 7) : null;

        const action = pick(auditActions, cursor);
        const created_at = daysAgo(50 - (cursor % 45)).toISOString().slice(0, 19).replace('T', ' ');

        let entityType = 'company';
        let entityId = DEMO_COMPANY_ID;
        let newValues: any = { is_demo: true };
        let oldValues: any = null;
        let requestPath: string | null = null;

        if (action === 'LOGIN') {
            entityType = 'auth';
            entityId = u.id;
            newValues = { event: 'login', email: u.email };
            requestPath = '/api/v1/auth/login';
        } else if (sub) {
            entityType = 'submission';
            entityId = sub.id;
            newValues = { status: sub.current_stage, jobId: sub.job_id };
            requestPath = '/api/v1/submissions';
        } else if (cand) {
            entityType = 'candidate';
            entityId = cand.id;
            newValues = { email: cand.email };
            requestPath = '/api/v1/candidates';
        } else if (job) {
            entityType = 'job';
            entityId = job.id;
            newValues = { title: job.title };
            requestPath = '/api/v1/jobs';
        }

        // Idempotency: avoid duplicates per user+entity+action+day
        const exists = await dataSource.query(
            `select id from audit_logs where company_id=$1 and user_id=$2 and entity_type=$3 and entity_id=$4 and action=$5 and created_at::date=$6::date limit 1`,
            [DEMO_COMPANY_ID, u.id, entityType, entityId, action, created_at],
        );
        if (exists?.[0]?.id) {
            cursor++;
            continue;
        }

        await dataSource.query(
            `insert into audit_logs (company_id, user_id, entity_type, entity_id, action, old_values, new_values, ip_address, user_agent, request_path, created_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [
                DEMO_COMPANY_ID,
                action === 'DELETE' ? null : u.id,
                entityType,
                entityId,
                action,
                oldValues ? JSON.stringify(oldValues) : null,
                newValues ? JSON.stringify(newValues) : null,
                '192.168.10.10',
                'DemoSeed/1.0 (local)',
                requestPath,
                created_at,
            ],
        );

        insertedAudit++;
        cursor++;
    }

    const afterAudit = await dataSource.query(
        `select count(*)::int as n from audit_logs where company_id=$1`,
        [DEMO_COMPANY_ID],
    );
    console.log(
        `✅ Audit logs seeded: +${insertedAudit} (before=${beforeAuditTotal}, after=${afterAudit[0].n}, target=${auditTarget})`,
    );

    // -------------------------
    // Notification preferences + notifications
    // -------------------------
    const notificationTypes = [
        'interview.scheduled',
        'interview.reminder',
        'job.published',
        'job.closed',
        'application.stage_changed',
        'candidate.assigned',
    ] as const;

    // Preferences: ensure each user has prefs for core types
    let prefsInserted = 0;
    for (const u of users) {
        for (const t of notificationTypes) {
            const exists = await dataSource.query(
                `select id from notification_preferences where user_id=$1 and notification_type=$2 limit 1`,
                [u.id, t],
            );
            if (exists?.[0]?.id) continue;
            await dataSource.query(
                `insert into notification_preferences (id, user_id, notification_type, in_app_enabled, email_enabled)
                 values (uuid_generate_v4(), $1, $2, $3, $4)`,
                [u.id, t, true, u.email.includes('viewer') ? false : true],
            );
            prefsInserted++;
        }
    }
    console.log(`✅ Notification preferences ensured: +${prefsInserted}`);

    const beforeNotifs = await dataSource.query(
        `select count(*)::int as n from notifications where company_id=$1 and deleted_at is null`,
        [DEMO_COMPANY_ID],
    );
    const beforeNotifsTotal = Number(beforeNotifs?.[0]?.n ?? 0);
    const notifsTarget = 140;

    let insertedNotifs = 0;
    cursor = 0;
    while (beforeNotifsTotal + insertedNotifs < notifsTarget && cursor < 5000) {
        const u = pick(users, cursor);
        const t = pick(notificationTypes, cursor);
        const is_read = cursor % 4 === 0;
        const created_at = daysAgo(25 - (cursor % 20)).toISOString().slice(0, 19).replace('T', ' ');

        let title = 'Demo notification';
        let message = 'Demo notification message';
        let related_entity_type: string | null = null;
        let related_entity_id: string | null = null;
        let link: string | null = null;

        if (t.startsWith('interview') && interviews.length) {
            const iv = pick(interviews, cursor);
            title = 'Interview update';
            message = t === 'interview.reminder' ? 'Reminder: Interview starting soon.' : 'Interview scheduled.';
            related_entity_type = 'interview';
            related_entity_id = iv.id;
            link = `/interviews/${iv.id}`;
        } else if (t.startsWith('job') && jobs.length) {
            const j = pick(jobs, cursor);
            title = t === 'job.closed' ? 'Job closed' : 'Job published';
            message = `${title}: ${j.title}`;
            related_entity_type = 'job';
            related_entity_id = j.id;
            link = `/jobs/${j.id}`;
        } else if (t.includes('candidate') && candidates.length) {
            const c = pick(candidates, cursor);
            title = 'Candidate assigned';
            message = `Candidate assigned: ${c.first_name} ${c.last_name}`;
            related_entity_type = 'candidate';
            related_entity_id = c.id;
            link = `/candidates/${c.id}`;
        }

        // Idempotency per user+type+day+entity
        const exists = await dataSource.query(
            `select id from notifications where company_id=$1 and user_id=$2 and notification_type=$3 and created_at::date=$4::date and coalesce(related_entity_id,'00000000-0000-0000-0000-000000000000'::uuid)=coalesce($5,'00000000-0000-0000-0000-000000000000'::uuid) limit 1`,
            [DEMO_COMPANY_ID, u.id, t, created_at, related_entity_id],
        );
        if (exists?.[0]?.id) {
            cursor++;
            continue;
        }

        await dataSource.query(
            `
            insert into notifications
              (company_id, user_id, title, message, notification_type, related_entity_type, related_entity_id,
               delivery_channels, is_sent, sent_at, is_read, read_at, created_at, type, link, entity_type, entity_id, metadata, updated_at)
            values
              ($1,$2,$3,$4,$5,$6,$7,
               $8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
            `,
            [
                DEMO_COMPANY_ID,
                u.id,
                title,
                message,
                t,
                related_entity_type,
                related_entity_id,
                ['in_app'],
                true,
                created_at,
                is_read,
                is_read ? created_at : null,
                created_at,
                t, // legacy column
                link,
                related_entity_type,
                related_entity_id,
                JSON.stringify({ is_demo: true }),
                new Date().toISOString(),
            ],
        );

        insertedNotifs++;
        cursor++;
    }

    const afterNotifs = await dataSource.query(
        `select count(*)::int as n from notifications where company_id=$1 and deleted_at is null`,
        [DEMO_COMPANY_ID],
    );
    console.log(
        `✅ Notifications seeded: +${insertedNotifs} (before=${beforeNotifsTotal}, after=${afterNotifs[0].n}, target=${notifsTarget})`,
    );

    await dataSource.destroy();
    console.log('✅ Demo activity/audit/notifications seed complete');
}

main().catch((err) => {
    console.error('❌ Demo activity/audit/notifications seed error:', err);
    process.exit(1);
});

