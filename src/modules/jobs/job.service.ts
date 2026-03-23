import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Job } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { FilterJobDto } from './dto/filter-job.dto';
import { CreateJobFromEmailDto } from './dto/import-email.dto';
import { ActivityService } from '../../activity/services/activity.service';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class JobService {
    constructor(
        @InjectRepository(Job)
        private readonly jobRepository: Repository<Job>,
        private readonly activityService: ActivityService,
        private readonly auditService: AuditService,
    ) { }

    async create(createJobDto: CreateJobDto, companyId: string, userId: string): Promise<Job> {
        const job = this.jobRepository.create({
            ...createJobDto,
            company_id: companyId,
            created_by_id: userId,
        });
        const saved = await this.jobRepository.save(job);

        await this.activityService.logActivity(companyId, userId, {
            entityType: 'job',
            entityId: saved.id,
            activityType: 'created',
            message: `Job created: ${saved.title}`,
            metadata: { jobId: saved.id },
        });

        await this.auditService.log(companyId, userId, {
            entityType: 'job',
            entityId: saved.id,
            action: 'CREATE',
            newValues: saved,
        });

        return saved;
    }

    async findAll(filters: FilterJobDto, companyId: string): Promise<{ data: Job[]; total: number; page: number; limit: number }> {
        let {
            page = 1,
            limit = 20,
            orderBy = 'created_at',
            orderDirection = 'DESC',
            search,
            status,
            department,
            client_id,
            location,
        } = filters;

        const ALLOWED_ORDER = new Set([
            'created_at',
            'updated_at',
            'title',
            'status',
            'department',
            'location',
            'employment_type',
            'job_code',
            'salary_min',
        ]);
        const safeOrder = ALLOWED_ORDER.has(orderBy) ? orderBy : 'created_at';
        const dir = orderDirection === 'ASC' ? 'ASC' : 'DESC';

        page = Math.max(1, Number(page) || 1);
        limit = Math.min(100, Math.max(1, Number(limit) || 20));

        const qb = this.jobRepository
            .createQueryBuilder('job')
            .where('job.company_id = :companyId', { companyId })
            .andWhere('job.deleted_at IS NULL');

        if (search?.trim()) {
            const term = `%${search.trim()}%`;
            qb.andWhere(
                '(job.title ILIKE :jSearch OR job.job_code ILIKE :jSearch OR job.location ILIKE :jSearch OR job.client_req_id ILIKE :jSearch OR job.department ILIKE :jSearch)',
                { jSearch: term },
            );
        }
        if (status) {
            qb.andWhere('job.status = :status', { status });
        }
        if (department?.trim()) {
            qb.andWhere('job.department ILIKE :dept', { dept: `%${department.trim()}%` });
        }
        if (location?.trim()) {
            qb.andWhere('job.location ILIKE :loc', { loc: `%${location.trim()}%` });
        }
        if (client_id) {
            qb.andWhere('job.client_id = :client_id', { client_id });
        }

        const [data, total] = await qb
            .orderBy(`job.${safeOrder}`, dir)
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return { data, total, page, limit };
    }

    async findOne(id: string, companyId?: string): Promise<Job> {
        // Prefer tenant isolation when companyId is available; otherwise fall back to ID only
        const where: FindOptionsWhere<Job> = { id };
        if (companyId) {
            where.company_id = companyId;
        }
        where.deleted_at = null;

        const job = await this.jobRepository.findOne({ where });
        if (!job) {
            throw new NotFoundException(`Job with ID ${id} not found`);
        }
        return job;
    }

    async createFromEmail(createJobFromEmailDto: CreateJobFromEmailDto, companyId: string, userId: string): Promise<Job> {
        const { parsedData, title, ecms_req_id, mandatory_skills, client_id, priority, active_flag } = createJobFromEmailDto;

        // Merge parsed data with overrides (overrides take precedence)
        const jobData = {
            title: title || parsedData.extractedFields.title || 'Untitled Job',
            ecms_req_id: ecms_req_id || parsedData.extractedFields.ecmsReqId,
            description: parsedData.rawEmail, // Use full email as description
            location: parsedData.extractedFields.location,
            experience_required: parsedData.extractedFields.totalExperience,
            skills_required: mandatory_skills || parsedData.extractedFields.mandatorySkills,
            skills_preferred: parsedData.extractedFields.desiredSkills,
            status: 'draft',
            priority: 2, // Default to medium priority (1=Low, 2=Medium, 3=High)
            active_flag: active_flag !== undefined ? active_flag : true,
            client_id: client_id?.toString() || '1',

            // Email-specific fields
            raw_email_content: parsedData.rawEmail,
            submission_email: parsedData.submissionGuidelines?.email,
            client_code: parsedData.extractedFields.clientCode,
            extracted_fields: parsedData.extractedFields as any,
            candidate_tracker_format: parsedData.candidateTracker as any,
            submission_guidelines: parsedData.submissionGuidelines ?
                JSON.stringify(parsedData.submissionGuidelines) : null,
            jd_metadata: parsedData.jdMetadata as any,

            company_id: companyId,
            created_by_id: userId,
        };

        const job = this.jobRepository.create(jobData);
        return this.jobRepository.save(job);
    }

    async update(id: string, updateJobDto: UpdateJobDto, companyId: string, userId: string): Promise<Job> {
        const job = await this.findOne(id, companyId);
        const oldValues = { ...job };

        Object.assign(job, { ...updateJobDto, updated_by_id: userId });
        const saved = await this.jobRepository.save(job);

        await this.activityService.logActivity(companyId, userId, {
            entityType: 'job',
            entityId: saved.id,
            activityType: 'updated',
            message: `Job updated: ${saved.title}`,
            metadata: { jobId: saved.id },
        });

        await this.auditService.log(companyId, userId, {
            entityType: 'job',
            entityId: saved.id,
            action: 'UPDATE',
            oldValues,
            newValues: saved,
        });

        return saved;
    }

    async remove(id: string, companyId: string, userId: string): Promise<Job> {
        const job = await this.findOne(id, companyId);
        await this.jobRepository.softRemove(job);

        await this.activityService.logActivity(companyId, userId, {
            entityType: 'job',
            entityId: job.id,
            activityType: 'deleted',
            message: `Job deleted: ${job.title}`,
            metadata: { jobId: job.id },
        });

        await this.auditService.log(companyId, userId, {
            entityType: 'job',
            entityId: job.id,
            action: 'DELETE',
            oldValues: job,
            newValues: null,
        });

        return job;
    }

    async closeJob(id: string, companyId: string, userId: string): Promise<Job> {
        const job = await this.findOne(id, companyId);
        if (job.status === 'closed') {
            return job;
        }
        const oldValues = { ...job };
        job.status = 'closed';
        (job as any).closed_at = new Date();
        const saved = await this.jobRepository.save(job);

        await this.activityService.logActivity(companyId, userId, {
            entityType: 'job',
            entityId: saved.id,
            activityType: 'closed',
            message: `Job closed: ${saved.title}`,
            metadata: { jobId: saved.id },
        });

        await this.auditService.log(companyId, userId, {
            entityType: 'job',
            entityId: saved.id,
            action: 'UPDATE',
            oldValues,
            newValues: saved,
        });

        return saved;
    }

    async getStats(companyId: string): Promise<any> {
        const base = { company_id: companyId };
        const totalJobs = await this.jobRepository.count({ where: base });
        const openJobs = await this.jobRepository.count({ where: { ...base, status: 'open' } });
        const closedJobs = await this.jobRepository.count({ where: { ...base, status: 'closed' } });
        const draftJobs = await this.jobRepository.count({ where: { ...base, status: 'draft' } });
        const archivedJobs = await this.jobRepository.count({ where: { ...base, status: 'archived' } });

        return { totalJobs, openJobs, closedJobs, draftJobs, archivedJobs };
    }
}
