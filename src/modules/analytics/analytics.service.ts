import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from '../applications/entities/application.entity';
import { ApplicationTransition } from '../applications/entities/application-transition.entity';
import { PipelineStage, StageType } from '../pipelines/entities/pipeline-stage.entity';
import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(Application) private readonly appRepo: Repository<Application>,
        @InjectRepository(ApplicationTransition) private readonly transRepo: Repository<ApplicationTransition>,
        @InjectRepository(PipelineStage) private readonly stageRepo: Repository<PipelineStage>,
        private readonly cache: CacheService,
    ) { }

    /** Funnel metrics: counts by stage_type and status */
    async getFunnel(companyId: string) {
        const cacheKey = `analytics:funnel:${companyId}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;

        const rows = await this.appRepo.createQueryBuilder('a')
            .leftJoin(PipelineStage, 's', 's.id = a.current_stage_id')
            .where('a.company_id = :companyId', { companyId })
            .select([
                's.stage_type as stage_type',
                'COUNT(*)::int as count',
            ])
            .groupBy('s.stage_type')
            .getRawMany();

        const statusRows = await this.appRepo.createQueryBuilder('a')
            .where('a.company_id = :companyId', { companyId })
            .select(['a.status as status', 'COUNT(*)::int as count'])
            .groupBy('a.status')
            .getRawMany();

        const result = { byStageType: rows, byStatus: statusRows };
        await this.cache.set(cacheKey, result, 60);
        return result;
    }

    /** Time-to-hire metrics: avg, median (approx), p90 based on transition to HIRED */
    async getTimeToHire(companyId: string) {
        const cacheKey = `analytics:tth:${companyId}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;

        // Get transitions to HIRED with applied_at
        const hiredTransitions = await this.transRepo.createQueryBuilder('t')
            .leftJoin(Application, 'a', 'a.id = t.application_id')
            .leftJoin(PipelineStage, 'to', 'to.id = t.to_stage_id')
            .where('a.company_id = :companyId', { companyId })
            .andWhere('to.stage_type = :hired', { hired: StageType.HIRED })
            .select(['a.applied_at as applied_at', 't.transitioned_at as hired_at'])
            .getRawMany();

        const durations = hiredTransitions
            .map((r: any) => (new Date(r.hired_at).getTime() - new Date(r.applied_at).getTime()) / (1000 * 60 * 60 * 24))
            .filter((d) => d >= 0)
            .sort((a, b) => a - b);

        const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null;
        const median = durations.length ? durations[Math.floor(durations.length / 2)] : null;
        const p90 = durations.length ? durations[Math.floor(durations.length * 0.9)] : null;

        const result = { count: durations.length, avgDays: avg, medianDays: median, p90Days: p90 };
        await this.cache.set(cacheKey, result, 300);
        return result;
    }

    /** Source effectiveness: applications and hires by source */
    async getSourceEffectiveness(companyId: string) {
        const cacheKey = `analytics:source:${companyId}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;

        const appsBySource = await this.appRepo.createQueryBuilder('a')
            .select(['a.source_id as source_id', 'COUNT(*)::int as applications'])
            .where('a.company_id = :companyId', { companyId })
            .groupBy('a.source_id')
            .getRawMany();

        const hiresBySource = await this.appRepo.createQueryBuilder('a')
            .select(['a.source_id as source_id', 'COUNT(*)::int as hires'])
            .where('a.company_id = :companyId', { companyId })
            .andWhere('a.status = :status', { status: ApplicationStatus.HIRED })
            .groupBy('a.source_id')
            .getRawMany();

        const hiresMap = new Map<string, number>();
        hiresBySource.forEach((r: any) => hiresMap.set(r.source_id, r.hires));

        const result = appsBySource.map((r: any) => {
            const hires = hiresMap.get(r.source_id) || 0;
            const conversion = r.applications > 0 ? +(100 * hires / r.applications).toFixed(2) : 0;
            return { sourceId: r.source_id, applications: r.applications, hires, conversionRate: conversion };
        });

        await this.cache.set(cacheKey, result, 300);
        return result;
    }

    /** Recruiter performance: hired count & avg time-to-hire by assignee */
    async getRecruiterPerformance(companyId: string) {
        const cacheKey = `analytics:recruiter:${companyId}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;

        const hiredApps = await this.appRepo.createQueryBuilder('a')
            .select(['a.assigned_to as user_id', 'COUNT(*)::int as hires'])
            .where('a.company_id = :companyId', { companyId })
            .andWhere('a.status = :status', { status: ApplicationStatus.HIRED })
            .groupBy('a.assigned_to')
            .getRawMany();

        // Time-to-hire per recruiter: join transitions where to_stage_type=HIRED
        const hiredTransitions = await this.transRepo.createQueryBuilder('t')
            .leftJoin(Application, 'a', 'a.id = t.application_id')
            .leftJoin(PipelineStage, 'to', 'to.id = t.to_stage_id')
            .where('a.company_id = :companyId', { companyId })
            .andWhere('to.stage_type = :hired', { hired: StageType.HIRED })
            .select(['a.assigned_to as user_id', 'a.applied_at as applied_at', 't.transitioned_at as hired_at'])
            .getRawMany();

        const map: Record<string, { hires: number; avgDays?: number }> = {};
        hiredApps.forEach((r: any) => (map[r.user_id] = { hires: r.hires }));

        const durationsByUser: Record<string, number[]> = {};
        hiredTransitions.forEach((r: any) => {
            const d = (new Date(r.hired_at).getTime() - new Date(r.applied_at).getTime()) / (1000 * 60 * 60 * 24);
            if (d >= 0) {
                durationsByUser[r.user_id] = durationsByUser[r.user_id] || [];
                durationsByUser[r.user_id].push(d);
            }
        });

        Object.entries(durationsByUser).forEach(([userId, arr]) => {
            const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
            if (!map[userId]) map[userId] = { hires: 0 };
            map[userId].avgDays = +avg.toFixed(2);
        });

        return Object.entries(map).map(([userId, stats]) => ({ userId, ...stats }));
    }

    /** Job performance: applicants, hires, avg days to hire */
    async getJobPerformance(companyId: string) {
        const cacheKey = `analytics:job:${companyId}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;

        const apps = await this.appRepo.createQueryBuilder('a')
            .select(['a.job_id as job_id', 'COUNT(*)::int as applications'])
            .where('a.company_id = :companyId', { companyId })
            .groupBy('a.job_id')
            .getRawMany();

        const hires = await this.appRepo.createQueryBuilder('a')
            .select(['a.job_id as job_id', 'COUNT(*)::int as hires'])
            .where('a.company_id = :companyId', { companyId })
            .andWhere('a.status = :status', { status: ApplicationStatus.HIRED })
            .groupBy('a.job_id')
            .getRawMany();

        const tthRows = await this.transRepo.createQueryBuilder('t')
            .leftJoin(Application, 'a', 'a.id = t.application_id')
            .leftJoin(PipelineStage, 'to', 'to.id = t.to_stage_id')
            .where('a.company_id = :companyId', { companyId })
            .andWhere('to.stage_type = :hired', { hired: StageType.HIRED })
            .select(['a.job_id as job_id', 'a.applied_at as applied_at', 't.transitioned_at as hired_at'])
            .getRawMany();

        const durationsByJob: Record<string, number[]> = {};
        tthRows.forEach((r: any) => {
            const d = (new Date(r.hired_at).getTime() - new Date(r.applied_at).getTime()) / (1000 * 60 * 60 * 24);
            if (d >= 0) {
                const id = String(r.job_id);
                durationsByJob[id] = durationsByJob[id] || [];
                durationsByJob[id].push(d);
            }
        });

        const hiresMap = new Map<string, number>();
        hires.forEach((r: any) => hiresMap.set(String(r.job_id), r.hires));
        const appsMap = new Map<string, number>();
        apps.forEach((r: any) => appsMap.set(String(r.job_id), r.applications));

        const jobIds = new Set<string>([...appsMap.keys(), ...hiresMap.keys(), ...Object.keys(durationsByJob)]);

        const result = Array.from(jobIds).map((jobId) => {
            const applications = appsMap.get(jobId) || 0;
            const hired = hiresMap.get(jobId) || 0;
            const arr = durationsByJob[jobId] || [];
            const avgDays = arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : null;
            const conversionRate = applications > 0 ? +(100 * hired / applications).toFixed(2) : 0;
            return { jobId, applications, hired, conversionRate, avgDaysToHire: avgDays };
        });

        await this.cache.set(cacheKey, result, 300);
        return result;
    }
}
