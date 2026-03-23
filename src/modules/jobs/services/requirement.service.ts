import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobRequirement } from '../entities/job-requirement.entity';
import { RequirementAssignment } from '../entities/requirement-assignment.entity';
import { RequirementSubmission } from '../../../submissions/entities/requirement-submission.entity';
import { ActivityService } from '../../../activity/services/activity.service';
import { AuditService } from '../../../common/services/audit.service';

@Injectable()
export class RequirementService {
    constructor(
        @InjectRepository(JobRequirement)
        private readonly requirementRepo: Repository<JobRequirement>,
        @InjectRepository(RequirementAssignment)
        private readonly assignmentRepo: Repository<RequirementAssignment>,
        @InjectRepository(RequirementSubmission)
        private readonly submissionRepo: Repository<RequirementSubmission>,
        private readonly activityService: ActivityService,
        private readonly auditService: AuditService,
    ) {}

    private ensureTenant<T extends { company_id?: string }>(
        entity: T | null,
        companyId: string,
        notFoundMessage: string,
    ): T {
        if (!entity || (entity as any).company_id !== companyId) {
            throw new NotFoundException(notFoundMessage);
        }
        return entity;
    }

    // REQUIREMENTS

    async createRequirement(companyId: string, userId: string, dto: Partial<JobRequirement>) {
        const requirement = this.requirementRepo.create({
            ...dto,
            company_id: companyId,
            created_by: userId,
        });
        const saved = await this.requirementRepo.save(requirement);

        await this.activityService.logActivity(companyId, userId, {
            entityType: 'job_requirement',
            entityId: saved.id,
            activityType: 'created',
            message: `Requirement created: ${saved.job_title}`,
            metadata: { requirementId: saved.id },
        });

        await this.auditService.log(companyId, userId, {
            entityType: 'job_requirement',
            entityId: saved.id,
            action: 'CREATE',
            newValues: saved,
        });

        return saved;
    }

    async getRequirements(companyId: string, filters: { status?: string }) {
        const qb = this.requirementRepo
            .createQueryBuilder('r')
            .where('r.company_id = :companyId', { companyId })
            .andWhere('r.deleted_at IS NULL');

        if (filters.status) {
            qb.andWhere('r.status = :status', { status: filters.status });
        }

        return qb.orderBy('r.created_at', 'DESC').getMany();
    }

    async getRequirementById(companyId: string, requirementId: string) {
        const requirement = await this.requirementRepo.findOne({
            where: { id: requirementId, company_id: companyId },
        });
        if (!requirement || requirement.deleted_at) {
            throw new NotFoundException('Requirement not found');
        }
        return requirement;
    }

    async updateRequirement(
        companyId: string,
        userId: string,
        requirementId: string,
        dto: Partial<JobRequirement>,
    ) {
        const requirement = await this.getRequirementById(companyId, requirementId);
        const oldValues = { ...requirement };
        Object.assign(requirement, dto, { updated_by: userId });
        const saved = await this.requirementRepo.save(requirement);

        await this.activityService.logActivity(companyId, userId, {
            entityType: 'job_requirement',
            entityId: saved.id,
            activityType: 'updated',
            message: `Requirement updated: ${saved.job_title}`,
            metadata: { requirementId: saved.id },
        });

        await this.auditService.log(companyId, userId, {
            entityType: 'job_requirement',
            entityId: saved.id,
            action: 'UPDATE',
            oldValues,
            newValues: saved,
        });

        return saved;
    }

    async closeRequirement(companyId: string, userId: string, requirementId: string) {
        const requirement = await this.getRequirementById(companyId, requirementId);
        if (requirement.status === 'closed') {
            return requirement;
        }
        const oldValues = { ...requirement };
        requirement.status = 'closed';
        const saved = await this.requirementRepo.save(requirement);

        await this.activityService.logActivity(companyId, userId, {
            entityType: 'job_requirement',
            entityId: saved.id,
            activityType: 'closed',
            message: `Requirement closed: ${saved.job_title}`,
            metadata: { requirementId: saved.id },
        });

        await this.auditService.log(companyId, userId, {
            entityType: 'job_requirement',
            entityId: saved.id,
            action: 'UPDATE',
            oldValues,
            newValues: saved,
        });

        return saved;
    }

    async deleteRequirement(companyId: string, userId: string, requirementId: string) {
        const requirement = await this.getRequirementById(companyId, requirementId);
        const oldValues = { ...requirement };
        requirement.deleted_at = new Date() as any;
        const saved = await this.requirementRepo.save(requirement);

        await this.activityService.logActivity(companyId, userId, {
            entityType: 'job_requirement',
            entityId: saved.id,
            activityType: 'deleted',
            message: `Requirement deleted: ${saved.job_title}`,
            metadata: { requirementId: saved.id },
        });

        await this.auditService.log(companyId, userId, {
            entityType: 'job_requirement',
            entityId: saved.id,
            action: 'DELETE',
            oldValues,
            newValues: null,
        });

        return saved;
    }

    // ASSIGNMENTS

    async assignRecruiter(
        companyId: string,
        userId: string,
        requirementId: string,
        dto: {
            assigned_to_user_id: string;
            target_count?: number;
            target_submission_date?: string;
            assignment_notes?: string;
        },
    ) {
        const req = await this.getRequirementById(companyId, requirementId);
        const assignment = this.assignmentRepo.create({
            company_id: companyId,
            job_requirement_id: req.id,
            assigned_to_user_id: dto.assigned_to_user_id,
            assigned_by_user_id: userId,
            assignment_notes: dto.assignment_notes,
            target_count: dto.target_count,
            target_submission_date: dto.target_submission_date
                ? new Date(dto.target_submission_date)
                : null,
            status: 'assigned',
        });
        const saved = await this.assignmentRepo.save(assignment);

        await this.activityService.logActivity(companyId, userId, {
            entityType: 'requirement_assignment',
            entityId: saved.id,
            activityType: 'assigned',
            message: `Recruiter assigned to requirement: ${req.job_title}`,
            metadata: { requirementId: req.id, assignmentId: saved.id },
        });

        await this.auditService.log(companyId, userId, {
            entityType: 'requirement_assignment',
            entityId: saved.id,
            action: 'CREATE',
            newValues: saved,
        });

        return saved;
    }

    async cancelAssignment(companyId: string, userId: string, assignmentId: string) {
        const assignment = await this.assignmentRepo.findOne({
            where: { id: assignmentId },
        });
        if (!assignment) {
            throw new NotFoundException('Assignment not found');
        }
        if (assignment.company_id !== companyId) {
            throw new ForbiddenException();
        }
        const oldValues = { ...assignment };
        assignment.status = 'cancelled';
        const saved = await this.assignmentRepo.save(assignment);

        await this.activityService.logActivity(companyId, userId, {
            entityType: 'requirement_assignment',
            entityId: saved.id,
            activityType: 'cancelled',
            message: 'Recruiter assignment cancelled',
            metadata: { assignmentId: saved.id },
        });

        await this.auditService.log(companyId, userId, {
            entityType: 'requirement_assignment',
            entityId: saved.id,
            action: 'UPDATE',
            oldValues,
            newValues: saved,
        });

        return saved;
    }

    // SUBMISSIONS

    async submitCandidate(
        companyId: string,
        userId: string,
        requirementId: string,
        dto: Partial<RequirementSubmission>,
    ) {
        const req = await this.getRequirementById(companyId, requirementId);
        const submission = this.submissionRepo.create({
            ...dto,
            job_requirement_id: (req as any).id,
            submitted_by_user_id: Number(userId) || undefined,
            submission_status: dto.submission_status || 'Pending',
        });
        const saved = await this.submissionRepo.save(submission);

        await this.activityService.logActivity(companyId, userId, {
            entityType: 'requirement_submission',
            entityId: String(saved.id),
            activityType: 'submitted',
            message: `Candidate submitted for requirement: ${req.job_title}`,
            metadata: { requirementId: req.id, submissionId: saved.id },
        });

        await this.auditService.log(companyId, userId, {
            entityType: 'requirement_submission',
            entityId: String(saved.id),
            action: 'CREATE',
            newValues: saved,
        });

        return saved;
    }

    async updateSubmissionStatus(
        companyId: string,
        userId: string,
        submissionId: number,
        dto: { submission_status: string },
    ) {
        const submission = await this.submissionRepo.findOne({
            where: { id: submissionId },
        });
        if (!submission) {
            throw new NotFoundException('Submission not found');
        }
        // Tenant isolation via requirement
        const req = await this.requirementRepo.findOne({
            where: { id: String(submission.job_requirement_id), company_id: companyId },
        });
        if (!req) {
            throw new ForbiddenException();
        }

        const oldValues = { ...submission };
        submission.submission_status = dto.submission_status;
        submission.status_updated_at = new Date();
        const saved = await this.submissionRepo.save(submission);

        await this.activityService.logActivity(companyId, userId, {
            entityType: 'requirement_submission',
            entityId: String(saved.id),
            activityType: 'status_updated',
            message: `Submission status updated to ${dto.submission_status}`,
            metadata: { submissionId: saved.id, requirementId: req.id },
        });

        await this.auditService.log(companyId, userId, {
            entityType: 'requirement_submission',
            entityId: String(saved.id),
            action: 'UPDATE',
            oldValues,
            newValues: saved,
        });

        return saved;
    }

    // EXPORT

    async exportSubmissions(companyId: string, requirementId: string) {
        const req = await this.getRequirementById(companyId, requirementId);
        const submissions = await this.submissionRepo.find({
            where: { job_requirement_id: Number(req.id) },
            order: { created_at: 'DESC' as any },
        });

        return { requirement: req, submissions };
    }

    // ANALYTICS

    async getAnalytics(companyId: string) {
        const total_requirements = await this.requirementRepo.count({
            where: { company_id: companyId, deleted_at: null },
        });

        const total_submissions = await this.submissionRepo
            .createQueryBuilder('s')
            .innerJoin(JobRequirement, 'r', 'r.id::int = s.job_requirement_id')
            .where('r.company_id = :companyId', { companyId })
            .getCount();

        const requirements_by_client = await this.requirementRepo
            .createQueryBuilder('r')
            .select('r.client_id', 'client_id')
            .addSelect('COUNT(*)', 'count')
            .where('r.company_id = :companyId', { companyId })
            .andWhere('r.deleted_at IS NULL')
            .groupBy('r.client_id')
            .getRawMany();

        const recent_submissions = await this.submissionRepo
            .createQueryBuilder('s')
            .innerJoin(JobRequirement, 'r', 'r.id::int = s.job_requirement_id')
            .where('r.company_id = :companyId', { companyId })
            .orderBy('s.created_at', 'DESC')
            .limit(20)
            .getMany();

        return {
            total_requirements,
            total_submissions,
            requirements_by_client,
            recent_submissions,
        };
    }
}

