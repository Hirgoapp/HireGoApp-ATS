import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from './entities/application.entity';
import { RejectionReason, RejectionReasonType } from './entities/rejection-reason.entity';
import { ApplicationWorkflowService } from './application-workflow.service';
import { PipelineStage, StageType } from '../pipelines/entities/pipeline-stage.entity';
import { HireApplicationDto, RejectApplicationDto, WithdrawApplicationDto } from './dto/hire-reject-flow.dto';
import { TransitionReason } from './entities/application-transition.entity';

@Injectable()
export class HireRejectFlowService {
    constructor(
        @InjectRepository(Application)
        private readonly applicationRepository: Repository<Application>,
        @InjectRepository(RejectionReason)
        private readonly rejectionReasonRepository: Repository<RejectionReason>,
        @InjectRepository(PipelineStage)
        private readonly stageRepository: Repository<PipelineStage>,
        private readonly workflowService: ApplicationWorkflowService,
    ) { }

    async hireApplication(
        applicationId: string,
        companyId: string,
        userId: string,
        hireDto: HireApplicationDto,
    ) {
        const application = await this.applicationRepository.findOne({
            where: { id: applicationId, company_id: companyId },
            relations: ['pipeline', 'current_stage'],
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        if (application.status === ApplicationStatus.HIRED) {
            throw new BadRequestException('Application is already hired');
        }

        const hiredStage = await this.stageRepository.findOne({
            where: { pipeline_id: application.pipeline_id, stage_type: StageType.HIRED },
        });

        if (!hiredStage) {
            throw new NotFoundException('No hired stage in pipeline');
        }

        await this.workflowService.moveToStage(
            applicationId,
            { to_stage_id: hiredStage.id, reason: TransitionReason.HIRE },
            companyId,
            userId,
        );

        application.status = ApplicationStatus.HIRED;
        if (hireDto.notes) {
            application.notes = hireDto.notes;
        }
        await this.applicationRepository.save(application);

        return {
            id: application.id,
            status: application.status,
            current_stage_id: hiredStage.id,
            hired_at: new Date(),
            message: 'Candidate successfully hired',
        };
    }

    async rejectApplication(
        applicationId: string,
        companyId: string,
        userId: string,
        rejectDto: RejectApplicationDto,
    ) {
        const application = await this.applicationRepository.findOne({
            where: { id: applicationId, company_id: companyId },
            relations: ['pipeline', 'current_stage'],
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        if (application.status === ApplicationStatus.REJECTED) {
            throw new BadRequestException('Application is already rejected');
        }

        const rejectedStage = await this.stageRepository.findOne({
            where: { pipeline_id: application.pipeline_id, stage_type: StageType.REJECTED },
        });

        if (!rejectedStage) {
            throw new NotFoundException('No rejection stage in pipeline');
        }

        await this.workflowService.moveToStage(
            applicationId,
            { to_stage_id: rejectedStage.id, reason: TransitionReason.REJECTION, notes: rejectDto.reason_details },
            companyId,
            userId,
        );

        const rejectionReason = this.rejectionReasonRepository.create({
            application_id: applicationId,
            company_id: companyId,
            reason_type: rejectDto.reason_type,
            reason_details: rejectDto.reason_details,
            rejected_by: userId,
        });
        await this.rejectionReasonRepository.save(rejectionReason);

        application.status = ApplicationStatus.REJECTED;
        await this.applicationRepository.save(application);

        return {
            id: application.id,
            status: application.status,
            current_stage_id: rejectedStage.id,
            rejection_reason_id: rejectionReason.id,
            rejected_at: new Date(),
            message: 'Application successfully rejected',
        };
    }

    async withdrawApplication(
        applicationId: string,
        companyId: string,
        userId: string,
        withdrawDto: WithdrawApplicationDto,
    ) {
        const application = await this.applicationRepository.findOne({
            where: { id: applicationId, company_id: companyId },
            relations: ['pipeline'],
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        if (application.status === ApplicationStatus.WITHDRAWN) {
            throw new BadRequestException('Application is already withdrawn');
        }

        const withdrawnStage = await this.stageRepository.findOne({
            where: { pipeline_id: application.pipeline_id, stage_type: StageType.REJECTED },
        });

        if (!withdrawnStage) {
            throw new NotFoundException('No withdrawal stage in pipeline');
        }

        await this.workflowService.moveToStage(
            applicationId,
            { to_stage_id: withdrawnStage.id, reason: TransitionReason.WITHDRAWAL },
            companyId,
            userId,
        );

        application.status = ApplicationStatus.WITHDRAWN;
        if (withdrawDto.notes) {
            application.notes = withdrawDto.notes;
        }
        await this.applicationRepository.save(application);

        const rejectionReason = this.rejectionReasonRepository.create({
            application_id: applicationId,
            company_id: companyId,
            reason_type: RejectionReasonType.CANDIDATE_DECLINED,
            reason_details: withdrawDto.reason || 'Candidate withdrew application',
            rejected_by: userId,
        });
        await this.rejectionReasonRepository.save(rejectionReason);

        return {
            id: application.id,
            status: application.status,
            current_stage_id: withdrawnStage.id,
            withdrawn_at: new Date(),
            message: 'Application successfully withdrawn',
        };
    }

    async getRejectionReason(applicationId: string, companyId: string) {
        const rejectionReason = await this.rejectionReasonRepository.findOne({
            where: { application_id: applicationId, company_id: companyId },
        });

        if (!rejectionReason) {
            return null;
        }

        return rejectionReason;
    }

    async getRejectionStatistics(companyId: string) {
        const [totalRejections, byReason] = await Promise.all([
            this.rejectionReasonRepository.count({
                where: { company_id: companyId },
            }),
            this.rejectionReasonRepository
                .createQueryBuilder('rr')
                .where('rr.company_id = :companyId', { companyId })
                .select('rr.reason_type', 'reason_type')
                .addSelect('COUNT(*)', 'count')
                .groupBy('rr.reason_type')
                .getRawMany(),
        ]);

        return {
            total_rejections: totalRejections,
            by_reason: byReason,
        };
    }
}
