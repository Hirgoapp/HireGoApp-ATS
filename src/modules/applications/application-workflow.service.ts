import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from './entities/application.entity';
import { ApplicationTransition, TransitionReason } from './entities/application-transition.entity';
import { PipelineStage, StageType } from '../pipelines/entities/pipeline-stage.entity';
import { MoveApplicationToStageDto } from './dto/move-application-dto';

@Injectable()
export class ApplicationWorkflowService {
    constructor(
        @InjectRepository(Application)
        private readonly applicationRepository: Repository<Application>,
        @InjectRepository(ApplicationTransition)
        private readonly transitionRepository: Repository<ApplicationTransition>,
        @InjectRepository(PipelineStage)
        private readonly stageRepository: Repository<PipelineStage>,
    ) { }

    /**
     * Move application to a new stage
     * Creates audit trail via ApplicationTransition
     */
    async moveToStage(
        applicationId: string,
        moveDto: MoveApplicationToStageDto,
        companyId: string,
        userId?: string,
    ): Promise<Application> {
        // Get application with current stage
        const application = await this.applicationRepository.findOne({
            where: { id: applicationId, company_id: companyId },
            relations: ['current_stage', 'pipeline'],
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        // Validate target stage exists and belongs to same pipeline
        const targetStage = await this.stageRepository.findOne({
            where: {
                id: moveDto.to_stage_id,
                pipeline_id: application.pipeline_id,
            },
        });

        if (!targetStage) {
            throw new BadRequestException(
                'Target stage not found or does not belong to application pipeline',
            );
        }

        // Check if already on this stage
        if (application.current_stage_id === moveDto.to_stage_id) {
            throw new BadRequestException('Application is already on this stage');
        }

        // Validate stage transition (prevent backward moves in certain pipelines)
        await this.validateStageTransition(
            application.current_stage,
            targetStage,
            application.pipeline_id,
        );

        // Create transition record (audit trail)
        const transition = this.transitionRepository.create({
            application_id: applicationId,
            from_stage_id: application.current_stage_id,
            to_stage_id: moveDto.to_stage_id,
            moved_by: userId,
            reason: moveDto.reason || TransitionReason.MANUAL_MOVE,
            notes: moveDto.notes,
            metadata: moveDto.metadata || {},
        });

        await this.transitionRepository.save(transition);

        // Update application stage
        application.current_stage_id = moveDto.to_stage_id;
        application.current_stage = targetStage;
        application.updated_at = new Date();

        // Auto-update status based on stage type if needed
        if (targetStage.stage_type === StageType.HIRED) {
            application.status = ApplicationStatus.HIRED;
        } else if (targetStage.stage_type === StageType.REJECTED) {
            application.status = ApplicationStatus.REJECTED;
        } else if (application.status === ApplicationStatus.HIRED || application.status === ApplicationStatus.REJECTED) {
            // Reset status if moving away from terminal states
            application.status = ApplicationStatus.ACTIVE;
        }

        return this.applicationRepository.save(application);
    }

    /**
     * Get application transition history
     */
    async getTransitionHistory(
        applicationId: string,
        companyId: string,
    ): Promise<ApplicationTransition[]> {
        // Verify application belongs to company
        const application = await this.applicationRepository.findOne({
            where: { id: applicationId, company_id: companyId },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        return this.transitionRepository.find({
            where: { application_id: applicationId },
            relations: ['from_stage', 'to_stage', 'moved_by_user'],
            order: { transitioned_at: 'ASC' },
        });
    }

    /**
     * Get latest stage history (most recent transitions)
     */
    async getLatestTransitions(
        applicationId: string,
        companyId: string,
        limit: number = 10,
    ): Promise<ApplicationTransition[]> {
        const application = await this.applicationRepository.findOne({
            where: { id: applicationId, company_id: companyId },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        return this.transitionRepository.find({
            where: { application_id: applicationId },
            relations: ['from_stage', 'to_stage', 'moved_by_user'],
            order: { transitioned_at: 'DESC' },
            take: limit,
        });
    }

    /**
     * Validate if stage transition is allowed
     * Could implement complex logic: prevent backward moves, validate prerequisites, etc.
     */
    private async validateStageTransition(
        fromStage: PipelineStage,
        toStage: PipelineStage,
        pipelineId: string,
    ): Promise<void> {
        // Get all stages ordered to determine flow
        const allStages = await this.stageRepository.find({
            where: { pipeline_id: pipelineId },
            order: { stage_order: 'ASC' },
        });

        const fromIndex = allStages.findIndex((s) => s.id === fromStage.id);
        const toIndex = allStages.findIndex((s) => s.id === toStage.id);

        // Allow backward moves (e.g., move candidate back to earlier stage for reconsideration)
        // For strict forward-only flow, uncomment below:
        // if (toIndex < fromIndex && ![StageType.REJECTED].includes(toStage.stage_type)) {
        //   throw new BadRequestException('Cannot move applications to earlier stages');
        // }

        // Terminal states validation - don't move away from HIRED/REJECTED without explicit reason
        if (
            (fromStage.stage_type === StageType.HIRED || fromStage.stage_type === StageType.REJECTED) &&
            (toStage.stage_type !== StageType.HIRED && toStage.stage_type !== StageType.REJECTED)
        ) {
            // Could add a flag to allow overrides, or require specific permissions
            // For MVP, allow but could restrict later
        }
    }

    /**
     * Bulk move applications to stage (used in Phase 3.4)
     */
    async bulkMoveToStage(
        applicationIds: string[],
        toStageId: string,
        companyId: string,
        userId?: string,
        reason: TransitionReason = TransitionReason.BULK_OPERATION,
    ): Promise<{ success: number; failed: number; errors: Record<string, string> }> {
        const errors: Record<string, string> = {};
        let successCount = 0;
        let failedCount = 0;

        for (const appId of applicationIds) {
            try {
                await this.moveToStage(appId, { to_stage_id: toStageId }, companyId, userId);
                successCount++;
            } catch (error) {
                failedCount++;
                errors[appId] = error.message;
            }
        }

        return { success: successCount, failed: failedCount, errors };
    }
}
