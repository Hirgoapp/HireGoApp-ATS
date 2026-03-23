import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from './entities/application.entity';
import { ApplicationTransition } from './entities/application-transition.entity';
import { PipelineStage, StageType } from '../pipelines/entities/pipeline-stage.entity';

@Injectable()
export class ApplicationAnalyticsService {
    constructor(
        @InjectRepository(Application) private readonly appRepo: Repository<Application>,
        @InjectRepository(ApplicationTransition) private readonly transRepo: Repository<ApplicationTransition>,
        @InjectRepository(PipelineStage) private readonly stageRepo: Repository<PipelineStage>,
    ) { }

    async statusBreakdown(companyId: string) {
        return this.appRepo
            .createQueryBuilder('app')
            .select('app.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .where('app.company_id = :companyId', { companyId })
            .groupBy('app.status')
            .getRawMany();
    }

    async funnel(companyId: string, pipelineId?: string) {
        const qb = this.appRepo
            .createQueryBuilder('app')
            .leftJoin(PipelineStage, 'stage', 'stage.id = app.current_stage_id')
            .select('stage.stage_type', 'stage_type')
            .addSelect('COUNT(*)', 'count')
            .where('app.company_id = :companyId', { companyId });

        if (pipelineId) qb.andWhere('app.pipeline_id = :pipelineId', { pipelineId });

        return qb.groupBy('stage.stage_type').getRawMany();
    }

    async timeToHire(companyId: string) {
        // Average days from applied_at to first transition to HIRED stage
        const qb = this.transRepo
            .createQueryBuilder('t')
            .innerJoin(PipelineStage, 's', 's.id = t.to_stage_id')
            .innerJoin(Application, 'a', 'a.id = t.application_id')
            .where('a.company_id = :companyId', { companyId })
            .andWhere('s.stage_type = :hired', { hired: StageType.HIRED })
            .select('AVG(EXTRACT(EPOCH FROM (t.transitioned_at - a.applied_at)) / 86400)', 'avg_days');

        const row = await qb.getRawOne<{ avg_days: string }>();
        return { average_days: row?.avg_days ? parseFloat(row.avg_days) : null };
    }

    async sourceEffectiveness(companyId: string) {
        // Count applications and hires per source
        const totalBySource = await this.appRepo
            .createQueryBuilder('a')
            .select('a.source_id', 'source_id')
            .addSelect('COUNT(*)', 'applications')
            .where('a.company_id = :companyId', { companyId })
            .groupBy('a.source_id')
            .getRawMany();

        const hiresBySource = await this.transRepo
            .createQueryBuilder('t')
            .innerJoin(PipelineStage, 's', 's.id = t.to_stage_id')
            .innerJoin(Application, 'a', 'a.id = t.application_id')
            .select('a.source_id', 'source_id')
            .addSelect('COUNT(*)', 'hires')
            .where('a.company_id = :companyId', { companyId })
            .andWhere('s.stage_type = :hired', { hired: StageType.HIRED })
            .groupBy('a.source_id')
            .getRawMany();

        // Merge results by source_id
        const hireMap = new Map<string, number>();
        for (const r of hiresBySource) hireMap.set(r.source_id, parseInt(r.hires, 10));

        return totalBySource.map((r) => ({
            source_id: r.source_id,
            applications: parseInt(r.applications, 10),
            hires: hireMap.get(r.source_id) || 0,
            conversion_rate: (hireMap.get(r.source_id) || 0) / Math.max(parseInt(r.applications, 10), 1),
        }));
    }
}
