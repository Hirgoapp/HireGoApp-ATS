import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
    constructor(private readonly dataSource: DataSource) { }

    private toCount(value: unknown): number {
        const n = Number(value || 0);
        return Number.isFinite(n) ? n : 0;
    }

    private defaultWidgetsByRole(role: string) {
        const r = (role || 'employee').toLowerCase();
        if (r.includes('admin')) {
            return ['kpi-overview', 'pipeline-funnel', 'offers-status', 'interview-health', 'activity-feed', 'quick-actions'];
        }
        if (r.includes('manager')) {
            return ['kpi-overview', 'pipeline-funnel', 'interview-health', 'activity-feed', 'offers-status', 'quick-actions'];
        }
        return ['kpi-overview', 'activity-feed', 'pipeline-funnel', 'quick-actions', 'offers-status', 'interview-health'];
    }

    async getOverview(companyId: string) {
        const [jobsRows, candidateRows, clientRows, submissionsRows, interviewsRows, offersRows] = await Promise.all([
            this.dataSource.query(
                `SELECT
                    COUNT(*)::int AS total_jobs,
                    COUNT(*) FILTER (WHERE LOWER(COALESCE(status, '')) = 'open')::int AS active_jobs
                 FROM jobs
                 WHERE company_id = $1 AND deleted_at IS NULL`,
                [companyId],
            ),
            this.dataSource.query(
                `SELECT COUNT(*)::int AS total_candidates
                 FROM candidates
                 WHERE company_id = $1`,
                [companyId],
            ),
            this.dataSource.query(
                `SELECT COUNT(*)::int AS total_clients
                 FROM clients
                 WHERE company_id = $1 AND deleted_at IS NULL`,
                [companyId],
            ),
            // DB column is `current_stage` (Title Case values e.g. Interview, Offer, Hired) — not `status`
            this.dataSource.query(
                `SELECT
                    COUNT(*)::int AS total_submissions,
                    COUNT(*) FILTER (WHERE LOWER(COALESCE(current_stage, '')) = 'interview')::int AS interviewed_count,
                    COUNT(*) FILTER (WHERE LOWER(COALESCE(current_stage, '')) = 'offer')::int AS offer_count,
                    COUNT(*) FILTER (WHERE LOWER(COALESCE(current_stage, '')) = 'hired')::int AS joined_count
                 FROM submissions
                 WHERE company_id = $1 AND deleted_at IS NULL`,
                [companyId],
            ),
            this.dataSource.query(
                `SELECT
                    COUNT(*)::int AS total_interviews,
                    COUNT(*) FILTER (WHERE LOWER(COALESCE(status::text, '')) = 'scheduled')::int AS scheduled_count,
                    COUNT(*) FILTER (WHERE LOWER(COALESCE(status::text, '')) = 'completed')::int AS completed_count,
                    COUNT(*) FILTER (WHERE LOWER(COALESCE(status::text, '')) LIKE 'cancel%')::int AS cancelled_count,
                    COUNT(*) FILTER (WHERE LOWER(COALESCE(status::text, '')) LIKE 'resched%')::int AS rescheduled_count
                 FROM interviews
                 WHERE company_id = $1 AND deleted_at IS NULL`,
                [companyId],
            ),
            this.dataSource.query(
                `SELECT
                    COUNT(*)::int AS total_offers,
                    COUNT(*) FILTER (WHERE LOWER(COALESCE(status::text, '')) LIKE '%released%' OR LOWER(COALESCE(status::text, '')) = 'issued')::int AS issued_count,
                    COUNT(*) FILTER (WHERE LOWER(COALESCE(status::text, '')) LIKE '%accepted%' OR LOWER(COALESCE(status::text, '')) = 'joined')::int AS accepted_count,
                    COUNT(*) FILTER (WHERE LOWER(COALESCE(status::text, '')) LIKE '%rejected%')::int AS rejected_count,
                    COUNT(*) FILTER (WHERE LOWER(COALESCE(status::text, '')) LIKE '%withdrawn%')::int AS withdrawn_count,
                    COUNT(*) FILTER (WHERE LOWER(COALESCE(status::text, '')) = 'draft')::int AS draft_count
                 FROM offers
                 WHERE company_id = $1 AND deleted_at IS NULL`,
                [companyId],
            ),
        ]);

        const jobs = jobsRows?.[0] || {};
        const candidates = candidateRows?.[0] || {};
        const clients = clientRows?.[0] || {};
        const submissions = submissionsRows?.[0] || {};
        const interviews = interviewsRows?.[0] || {};
        const offers = offersRows?.[0] || {};

        const totalCandidates = this.toCount(candidates.total_candidates);
        const totalSubmissions = this.toCount(submissions.total_submissions);

        return {
            generatedAt: new Date().toISOString(),
            kpis: {
                activeJobs: this.toCount(jobs.active_jobs),
                totalJobs: this.toCount(jobs.total_jobs),
                totalCandidates,
                totalClients: this.toCount(clients.total_clients),
                totalSubmissions,
                totalInterviews: this.toCount(interviews.total_interviews),
                offersIssued: this.toCount(offers.issued_count),
                offersAccepted: this.toCount(offers.accepted_count),
            },
            pipeline: {
                sourced: totalCandidates,
                shortlisted: Math.max(totalSubmissions - this.toCount(submissions.offer_count), 0),
                submitted: totalSubmissions,
                interviewed: this.toCount(submissions.interviewed_count),
                offered: this.toCount(submissions.offer_count),
                joined: Math.max(this.toCount(offers.accepted_count), this.toCount(submissions.joined_count)),
            },
            offers: {
                draft: this.toCount(offers.draft_count),
                issued: this.toCount(offers.issued_count),
                accepted: this.toCount(offers.accepted_count),
                rejected: this.toCount(offers.rejected_count),
                withdrawn: this.toCount(offers.withdrawn_count),
            },
            interviews: {
                total: this.toCount(interviews.total_interviews),
                scheduled: this.toCount(interviews.scheduled_count),
                completed: this.toCount(interviews.completed_count),
                cancelled: this.toCount(interviews.cancelled_count),
                rescheduled: this.toCount(interviews.rescheduled_count),
            },
        };
    }

    async getWidgetCatalog() {
        return [
            { key: 'kpi-overview', title: 'KPI Overview', scopes: ['application'] },
            { key: 'pipeline-funnel', title: 'Pipeline Funnel', scopes: ['operations'] },
            { key: 'offers-status', title: 'Offer Status', scopes: ['operations'] },
            { key: 'interview-health', title: 'Interview Health', scopes: ['operations'] },
            { key: 'activity-feed', title: 'Activity Feed', scopes: ['application', 'operations'] },
            { key: 'quick-actions', title: 'Quick Actions', scopes: ['application', 'operations'] },
        ];
    }

    async getLayout(companyId: string, userId: string, role: string) {
        const key = `dashboard_layout_${userId}`;
        const rows = await this.dataSource.query(
            `SELECT setting_value
             FROM settings
             WHERE company_id = $1 AND setting_key = $2
             LIMIT 1`,
            [companyId, key],
        );

        const stored = rows?.[0]?.setting_value;
        return {
            key,
            role,
            widgets: stored?.widgets || this.defaultWidgetsByRole(role),
            hiddenWidgets: stored?.hiddenWidgets || [],
            updatedAt: stored?.updatedAt || null,
        };
    }

    async saveLayout(companyId: string, userId: string, role: string, payload: any) {
        const key = `dashboard_layout_${userId}`;
        const value = {
            role,
            widgets: Array.isArray(payload?.widgets) ? payload.widgets : this.defaultWidgetsByRole(role),
            hiddenWidgets: Array.isArray(payload?.hiddenWidgets) ? payload.hiddenWidgets : [],
            updatedAt: new Date().toISOString(),
        };

        await this.dataSource.query(
            `INSERT INTO settings (id, company_id, setting_key, setting_value, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, $3::jsonb, NOW(), NOW())
             ON CONFLICT (company_id, setting_key)
             DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
            [companyId, key, JSON.stringify(value)],
        );

        return value;
    }

    async getRoleTemplate(companyId: string, role: string) {
        const normalizedRole = String(role || 'employee').toLowerCase();
        const key = `dashboard_template_${normalizedRole}`;
        const rows = await this.dataSource.query(
            `SELECT setting_value
             FROM settings
             WHERE company_id = $1 AND setting_key = $2
             LIMIT 1`,
            [companyId, key],
        );

        const stored = rows?.[0]?.setting_value;
        const defaults = this.defaultWidgetsByRole(normalizedRole);
        return {
            role: normalizedRole,
            widgets: Array.isArray(stored?.widgets) ? stored.widgets : defaults,
            hiddenWidgets: Array.isArray(stored?.hiddenWidgets) ? stored.hiddenWidgets : [],
            updatedAt: stored?.updatedAt || null,
        };
    }

    async saveRoleTemplate(companyId: string, role: string, payload: any) {
        const normalizedRole = String(role || 'employee').toLowerCase();
        const key = `dashboard_template_${normalizedRole}`;
        const value = {
            role: normalizedRole,
            widgets: Array.isArray(payload?.widgets)
                ? payload.widgets
                : this.defaultWidgetsByRole(normalizedRole),
            hiddenWidgets: Array.isArray(payload?.hiddenWidgets)
                ? payload.hiddenWidgets
                : [],
            updatedAt: new Date().toISOString(),
        };

        await this.dataSource.query(
            `INSERT INTO settings (id, company_id, setting_key, setting_value, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, $3::jsonb, NOW(), NOW())
             ON CONFLICT (company_id, setting_key)
             DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
            [companyId, key, JSON.stringify(value)],
        );

        return value;
    }
}
