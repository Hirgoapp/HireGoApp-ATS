import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const DEMO_COMPANY_ID = 'aee933be-7729-434e-b078-17c2f9ae4119';

type PipelineDef = {
    name: string;
    description: string;
    is_default: boolean;
    is_active: boolean;
    enable_auto_advance: boolean;
    auto_advance_days: number | null;
    stages: Array<{
        name: string;
        description?: string;
        order_index: number;
        color_hex?: string | null;
        is_terminal?: boolean;
        require_action?: boolean;
        action_template?: Record<string, any> | null;
    }>;
};

const PIPELINES: PipelineDef[] = [
    {
        name: 'Standard Hiring Pipeline',
        description: 'General-purpose pipeline for most roles (recommended for demos).',
        is_default: true,
        is_active: true,
        enable_auto_advance: false,
        auto_advance_days: null,
        stages: [
            { name: 'Applied', order_index: 1, color_hex: '#64748B' },
            { name: 'Screening', order_index: 2, color_hex: '#2563EB' },
            { name: 'Phone Screen', order_index: 3, color_hex: '#0EA5E9' },
            { name: 'Interview', order_index: 4, color_hex: '#7C3AED' },
            { name: 'Final Interview', order_index: 5, color_hex: '#A855F7' },
            { name: 'Offer', order_index: 6, color_hex: '#F59E0B', require_action: true, action_template: { type: 'offer' } },
            { name: 'Hired', order_index: 7, color_hex: '#16A34A', is_terminal: true },
            { name: 'Rejected', order_index: 8, color_hex: '#DC2626', is_terminal: true },
        ],
    },
    {
        name: 'High-Volume Pipeline',
        description: 'Shorter pipeline optimized for speed (useful for SLA/filter demos).',
        is_default: false,
        is_active: true,
        enable_auto_advance: true,
        auto_advance_days: 7,
        stages: [
            { name: 'Applied', order_index: 1, color_hex: '#64748B' },
            { name: 'Screening', order_index: 2, color_hex: '#2563EB' },
            { name: 'Interview', order_index: 3, color_hex: '#7C3AED' },
            { name: 'Offer', order_index: 4, color_hex: '#F59E0B', require_action: true, action_template: { type: 'offer' } },
            { name: 'Hired', order_index: 5, color_hex: '#16A34A', is_terminal: true },
            { name: 'Rejected', order_index: 6, color_hex: '#DC2626', is_terminal: true },
        ],
    },
    {
        name: 'Executive Search Pipeline',
        description: 'Longer pipeline with extra steps (useful for edge case demos).',
        is_default: false,
        is_active: true,
        enable_auto_advance: false,
        auto_advance_days: null,
        stages: [
            { name: 'Applied', order_index: 1, color_hex: '#64748B' },
            { name: 'Screening', order_index: 2, color_hex: '#2563EB' },
            { name: 'Technical', order_index: 3, color_hex: '#7C3AED' },
            { name: 'Panel Interview', order_index: 4, color_hex: '#A855F7' },
            { name: 'Reference Check', order_index: 5, color_hex: '#0EA5E9', require_action: true, action_template: { type: 'reference_check' } },
            { name: 'Offer', order_index: 6, color_hex: '#F59E0B', require_action: true, action_template: { type: 'offer' } },
            { name: 'Hired', order_index: 7, color_hex: '#16A34A', is_terminal: true },
            { name: 'Rejected', order_index: 8, color_hex: '#DC2626', is_terminal: true },
        ],
    },
];

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

    // Ensure company exists
    const c = await dataSource.query(`select id from companies where id = $1`, [DEMO_COMPANY_ID]);
    if (!c?.[0]?.id) {
        throw new Error(`Demo company not found (${DEMO_COMPANY_ID}). Run seed:demo first.`);
    }

    const beforePipelines = await dataSource.query(
        `select count(*)::int as n from pipelines where company_id = $1 and deleted_at is null`,
        [DEMO_COMPANY_ID],
    );

    const pipelineIdsByName = new Map<string, string>();
    for (const p of PIPELINES) {
        const existing = await dataSource.query(
            `select id from pipelines where company_id = $1 and name = $2 and deleted_at is null limit 1`,
            [DEMO_COMPANY_ID, p.name],
        );
        let pipelineId: string;
        if (existing?.[0]?.id) {
            pipelineId = existing[0].id;
            await dataSource.query(
                `update pipelines
                 set description=$3, is_default=$4, is_active=$5, enable_auto_advance=$6, auto_advance_days=$7, updated_at=now()
                 where id=$1 and company_id=$2`,
                [
                    pipelineId,
                    DEMO_COMPANY_ID,
                    p.description,
                    p.is_default,
                    p.is_active,
                    p.enable_auto_advance,
                    p.auto_advance_days,
                ],
            );
        } else {
            const ins = await dataSource.query(
                `insert into pipelines
                   (company_id, name, description, is_default, is_active, enable_auto_advance, auto_advance_days)
                 values
                   ($1,$2,$3,$4,$5,$6,$7)
                 returning id`,
                [
                    DEMO_COMPANY_ID,
                    p.name,
                    p.description,
                    p.is_default,
                    p.is_active,
                    p.enable_auto_advance,
                    p.auto_advance_days,
                ],
            );
            pipelineId = ins[0].id;
        }
        pipelineIdsByName.set(p.name, pipelineId);

        // Stages: idempotent by (pipeline_id, name)
        for (const s of p.stages) {
            const stageExisting = await dataSource.query(
                `select id from pipeline_stages where company_id=$1 and pipeline_id=$2 and name=$3 limit 1`,
                [DEMO_COMPANY_ID, pipelineId, s.name],
            );
            const payload = [
                DEMO_COMPANY_ID,
                pipelineId,
                s.name,
                s.description ?? null,
                s.order_index,
                s.color_hex ?? null,
                Boolean(s.is_terminal ?? false),
                Boolean(s.require_action ?? false),
                s.action_template ? JSON.stringify(s.action_template) : null,
            ];

            if (stageExisting?.[0]?.id) {
                await dataSource.query(
                    `update pipeline_stages
                     set description=$4, order_index=$5, color_hex=$6, is_terminal=$7, require_action=$8, action_template=$9, updated_at=now()
                     where id=$10 and company_id=$1 and pipeline_id=$2`,
                    [...payload, stageExisting[0].id],
                );
            } else {
                await dataSource.query(
                    `insert into pipeline_stages
                      (company_id, pipeline_id, name, description, order_index, color_hex, is_terminal, require_action, action_template)
                     values
                      ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                    payload,
                );
            }
        }
    }

    // Attach pipelines to some jobs for demo filtering
    const standardId = pipelineIdsByName.get('Standard Hiring Pipeline');
    const highVolumeId = pipelineIdsByName.get('High-Volume Pipeline');
    const execId = pipelineIdsByName.get('Executive Search Pipeline');

    const jobs = await dataSource.query(
        `select id, status from jobs where company_id=$1 and deleted_at is null order by created_at asc`,
        [DEMO_COMPANY_ID],
    );
    for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        const pickId = i % 10 === 0 ? execId : i % 3 === 0 ? highVolumeId : standardId;
        if (!pickId) continue;
        await dataSource.query(
            `update jobs set pipeline_id=$3, updated_at=now() where id=$1 and company_id=$2`,
            [job.id, DEMO_COMPANY_ID, pickId],
        );
    }

    const afterPipelines = await dataSource.query(
        `select count(*)::int as n from pipelines where company_id = $1 and deleted_at is null`,
        [DEMO_COMPANY_ID],
    );
    const afterStages = await dataSource.query(
        `select count(*)::int as n from pipeline_stages where company_id = $1`,
        [DEMO_COMPANY_ID],
    );

    console.log(
        `✅ Pipelines seeded: before=${beforePipelines[0].n}, after=${afterPipelines[0].n}; stages=${afterStages[0].n}`,
    );

    await dataSource.destroy();
    console.log('✅ Demo pipelines seed complete');
}

main().catch((err) => {
    console.error('❌ Demo pipelines seed error:', err);
    process.exit(1);
});

