import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

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
        `select count(*)::int as n from offers where company_id=$1 and deleted_at is null`,
        [DEMO_COMPANY_ID],
    );
    const beforeTotal = Number(before?.[0]?.n ?? 0);

    const targetTotal = 30;
    if (beforeTotal >= targetTotal) {
        console.log(`✅ Offers already >= target (${beforeTotal}/${targetTotal}), skipping.`);
        await dataSource.destroy();
        return;
    }

    const subs: Array<{ id: string; current_stage: string }> = await dataSource.query(
        `
        select id, current_stage
        from submissions
        where company_id=$1 and deleted_at is null
          and current_stage in ('Offer','Hired')
        order by created_at desc
        `,
        [DEMO_COMPANY_ID],
    );
    if (subs.length === 0) throw new Error('No Offer/Hired submissions found. Run seed:demo:workflows first.');

    const offerStatuses = ['draft', 'sent', 'accepted', 'rejected', 'withdrawn', 'expired'] as const;
    const employment = ['full_time', 'contract', 'part_time', 'intern'] as const;

    let inserted = 0;
    let cursor = 0;
    const desired = targetTotal - beforeTotal;

    for (const s of subs) {
        if (inserted >= desired) break;

        const existing = await dataSource.query(
            `select id from offers where company_id=$1 and submission_id=$2 and deleted_at is null limit 1`,
            [DEMO_COMPANY_ID, s.id],
        );
        if (existing?.[0]?.id) {
            // If an older run inserted the offer but failed before writing history, backfill minimal history.
            const hist = await dataSource.query(
                `select count(*)::int as n from offer_status_history where company_id=$1 and offer_id=$2`,
                [DEMO_COMPANY_ID, existing[0].id],
            );
            if (Number(hist?.[0]?.n ?? 0) === 0) {
                await dataSource.query(
                    `insert into offer_status_history (company_id, offer_id, old_status, new_status, changed_by_id, reason, metadata)
                     values ($1,$2,$3,$4,$5,$6,$7)`,
                    [
                        DEMO_COMPANY_ID,
                        existing[0].id,
                        'draft',
                        'issued',
                        recruiter[0].id,
                        'Backfilled demo history',
                        JSON.stringify({ is_demo: true }),
                    ],
                );
            }
            continue;
        }

        const status = pick(offerStatuses, cursor);
        const ctc = 95000 + cursor * 1500;
        const base_salary = Math.round(ctc * 0.85);
        const bonus = Math.round(ctc * 0.1);
        const equity = cursor % 5 === 0 ? '0.05%' : null;
        const joining_date = isoDateOnly(daysAgo(-(14 + (cursor % 30)))); // future date
        const expires_at = status === 'expired' ? daysAgo(2).toISOString() : daysAgo(-10).toISOString();
        const sent_at = status === 'draft' ? null : daysAgo(5 - (cursor % 3)).toISOString();
        const accepted_at = status === 'accepted' ? daysAgo(1).toISOString() : null;
        const closed_at = status === 'rejected' || status === 'withdrawn' || status === 'expired' ? daysAgo(1).toISOString() : null;

        const offerId = randomUUID();

        await dataSource.query(
            `
            insert into offers
              (id, company_id, submission_id, current_version, status, ctc, breakup, designation, joining_date,
               department, reporting_manager, location, terms_and_conditions, rejection_reason, internal_notes,
               sent_at, expires_at, accepted_at, closed_at, created_by_id, updated_by_id,
               offer_version, currency, base_salary, bonus, equity, employment_type, start_date, expiry_date, notes)
            values
              ($1,$2,$3,$4,$5,$6,$7,$8,$9,
               $10,$11,$12,$13,$14,$15,
               $16,$17,$18,$19,$20,$21,
               $22,$23,$24,$25,$26,$27,$28,$29,$30)
            `,
            [
                offerId,
                DEMO_COMPANY_ID,
                s.id,
                1,
                status,
                ctc,
                JSON.stringify({
                    base: base_salary,
                    bonus,
                    equity,
                    currency: 'USD',
                    notes: 'Demo breakup for UI rendering',
                }),
                pick(['Software Engineer', 'Senior Engineer', 'Product Manager', 'Data Analyst'], cursor),
                joining_date,
                pick(['Engineering', 'Product', 'Sales', 'Data'], cursor),
                cursor % 4 === 0 ? 'Morgan Manager' : null,
                pick(['New York, NY', 'Austin, TX', 'Remote (US)'], cursor),
                'Standard employment terms. Demo-only.',
                status === 'rejected' ? 'Candidate declined compensation.' : null,
                'Internal notes for sales demo: show approvals, expiries, and rejections.',
                sent_at,
                expires_at,
                accepted_at,
                closed_at,
                admin[0].id,
                admin[0].id,
                1,
                'USD',
                base_salary,
                bonus,
                equity,
                pick(employment, cursor),
                joining_date,
                isoDateOnly(daysAgo(-(21 + (cursor % 30)))),
                status === 'draft' ? 'Draft offer pending approval.' : 'Demo offer record.',
            ],
        );

        // Status history (2 entries to support UI timeline)
        const historyIssued = status === 'draft' ? 'draft' : 'issued';
        const historyFinal =
            status === 'accepted'
                ? 'accepted'
                : status === 'rejected'
                  ? 'rejected'
                  : status === 'withdrawn'
                    ? 'withdrawn'
                    : status === 'expired'
                      ? 'withdrawn'
                      : 'issued';

        await dataSource.query(
            `insert into offer_status_history (company_id, offer_id, old_status, new_status, changed_by_id, reason, metadata)
             values ($1,$2,$3,$4,$5,$6,$7)`,
            [
                DEMO_COMPANY_ID,
                offerId,
                'draft',
                historyIssued,
                recruiter[0].id,
                status === 'draft' ? 'Seeded demo offer (draft)' : 'Seeded demo offer (issued)',
                JSON.stringify({ is_demo: true, offers_status: status }),
            ],
        );

        if (historyFinal !== historyIssued) {
            await dataSource.query(
                `insert into offer_status_history (company_id, offer_id, old_status, new_status, changed_by_id, reason, metadata)
                 values ($1,$2,$3,$4,$5,$6,$7)`,
                [
                    DEMO_COMPANY_ID,
                    offerId,
                    historyIssued,
                    historyFinal,
                    admin[0].id,
                    status === 'expired' ? 'Offer expired (demo)' : 'Offer lifecycle update (demo)',
                    JSON.stringify({ is_demo: true, stage: s.current_stage, offers_status: status }),
                ],
            );
        }

        inserted++;
        cursor++;
    }

    const after = await dataSource.query(
        `select count(*)::int as n from offers where company_id=$1 and deleted_at is null`,
        [DEMO_COMPANY_ID],
    );

    console.log(`✅ Offers seeded: +${inserted} (before=${beforeTotal}, after=${after[0].n}, target=${targetTotal})`);
    await dataSource.destroy();
    console.log('✅ Demo offers seed complete');
}

main().catch((err) => {
    console.error('❌ Demo offers seed error:', err);
    process.exit(1);
});

