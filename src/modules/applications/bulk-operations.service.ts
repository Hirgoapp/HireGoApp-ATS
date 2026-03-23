import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from './entities/application.entity';
import { ApplicationWorkflowService } from './application-workflow.service';
import { BulkMoveToStageDto, BulkRejectApplicationsDto, BulkHireApplicationsDto, BulkOperationResultDto } from './dto/bulk-operations.dto';
import { TransitionReason } from './entities/application-transition.entity';
import { PipelineStage, StageType } from '../pipelines/entities/pipeline-stage.entity';

@Injectable()
export class BulkOperationsService {
    constructor(
        @InjectRepository(Application)
        private readonly applicationRepository: Repository<Application>,
        @InjectRepository(PipelineStage)
        private readonly stageRepository: Repository<PipelineStage>,
        private readonly workflowService: ApplicationWorkflowService,
    ) { }

    async bulkMoveToStage(
        bulkDto: BulkMoveToStageDto,
        companyId: string,
        userId: string,
    ): Promise<BulkOperationResultDto> {
        const result: BulkOperationResultDto = {
            success: 0,
            failed: 0,
            errors: {},
        };

        const targetStage = await this.stageRepository.findOne({
            where: { id: bulkDto.to_stage_id },
        });

        if (!targetStage) {
            throw new Error('Target stage not found');
        }

        for (const appId of bulkDto.application_ids) {
            try {
                await this.workflowService.moveToStage(appId, { to_stage_id: bulkDto.to_stage_id }, companyId, userId);
                result.success++;
            } catch (error) {
                result.failed++;
                result.errors[appId] = error.message;
            }
        }

        return result;
    }

    async bulkReject(
        bulkDto: BulkRejectApplicationsDto,
        companyId: string,
        userId: string,
    ): Promise<BulkOperationResultDto> {
        const result: BulkOperationResultDto = {
            success: 0,
            failed: 0,
            errors: {},
        };

        for (const appId of bulkDto.application_ids) {
            try {
                const application = await this.applicationRepository.findOne({
                    where: { id: appId, company_id: companyId },
                });

                if (!application) {
                    throw new Error('Application not found');
                }

                const rejectedStage = await this.stageRepository.findOne({
                    where: { pipeline_id: application.pipeline_id, stage_type: StageType.REJECTED },
                });

                if (!rejectedStage) {
                    throw new Error('No rejection stage in pipeline');
                }

                await this.workflowService.moveToStage(
                    appId,
                    { to_stage_id: rejectedStage.id, notes: bulkDto.reason },
                    companyId,
                    userId,
                );

                application.status = ApplicationStatus.REJECTED;
                application.notes = bulkDto.notes || application.notes;
                await this.applicationRepository.save(application);

                result.success++;
            } catch (error) {
                result.failed++;
                result.errors[appId] = error.message;
            }
        }

        return result;
    }

    async bulkHire(
        bulkDto: BulkHireApplicationsDto,
        companyId: string,
        userId: string,
    ): Promise<BulkOperationResultDto> {
        const result: BulkOperationResultDto = {
            success: 0,
            failed: 0,
            errors: {},
        };

        for (const appId of bulkDto.application_ids) {
            try {
                const application = await this.applicationRepository.findOne({
                    where: { id: appId, company_id: companyId },
                });

                if (!application) {
                    throw new Error('Application not found');
                }

                const hiredStage = await this.stageRepository.findOne({
                    where: { pipeline_id: application.pipeline_id, stage_type: StageType.HIRED },
                });

                if (!hiredStage) {
                    throw new Error('No hired stage in pipeline');
                }

                await this.workflowService.moveToStage(
                    appId,
                    { to_stage_id: hiredStage.id, reason: TransitionReason.HIRE },
                    companyId,
                    userId,
                );

                application.status = ApplicationStatus.HIRED;
                application.notes = bulkDto.notes || application.notes;
                await this.applicationRepository.save(application);

                result.success++;
            } catch (error) {
                result.failed++;
                result.errors[appId] = error.message;
            }
        }

        return result;
    }

    async bulkArchive(applicationIds: string[], companyId: string): Promise<BulkOperationResultDto> {
        const result: BulkOperationResultDto = {
            success: 0,
            failed: 0,
            errors: {},
        };

        for (const appId of applicationIds) {
            try {
                const application = await this.applicationRepository.findOne({
                    where: { id: appId, company_id: companyId },
                });

                if (!application) {
                    throw new Error('Application not found');
                }

                application.is_archived = true;
                application.archived_at = new Date();
                await this.applicationRepository.save(application);

                result.success++;
            } catch (error) {
                result.failed++;
                result.errors[appId] = error.message;
            }
        }

        return result;
    }

    async getStatistics(companyId: string) {
        const [total, byStatus, byPipeline, archived] = await Promise.all([
            this.applicationRepository.count({
                where: { company_id: companyId },
            }),
            this.applicationRepository
                .createQueryBuilder('app')
                .where('app.company_id = :companyId', { companyId })
                .select('app.status', 'status')
                .addSelect('COUNT(*)', 'count')
                .groupBy('app.status')
                .getRawMany(),
            this.applicationRepository
                .createQueryBuilder('app')
                .where('app.company_id = :companyId', { companyId })
                .leftJoinAndSelect('app.pipeline', 'pipeline')
                .select('pipeline.name', 'pipeline_name')
                .addSelect('COUNT(*)', 'count')
                .groupBy('pipeline.id')
                .getRawMany(),
            this.applicationRepository.count({
                where: { company_id: companyId, is_archived: true },
            }),
        ]);

        return {
            total,
            by_status: byStatus,
            by_pipeline: byPipeline,
            archived,
        };
    }
}
