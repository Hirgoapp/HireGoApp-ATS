import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Application, ApplicationStatus } from './entities/application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { FilterApplicationDto } from './dto/filter-application.dto';
import { ApplicationResponseDto, ApplicationListResponseDto } from './dto/application-response.dto';
import { Pipeline } from '../pipelines/entities/pipeline.entity';
import { PipelineStage } from '../pipelines/entities/pipeline-stage.entity';
import { JobRequirement } from '../jobs/entities/job-requirement.entity';
@Injectable()
export class ApplicationService {
    constructor(
        @InjectRepository(Application)
        private readonly applicationRepository: Repository<Application>,
        @InjectRepository(Pipeline)
        private readonly pipelineRepository: Repository<Pipeline>,
        @InjectRepository(PipelineStage)
        private readonly stageRepository: Repository<PipelineStage>,
        @InjectRepository(JobRequirement)
        private readonly jobRepository: Repository<JobRequirement>,
    ) { }

    async create(
        createDto: CreateApplicationDto,
        companyId: string,
        userId: string,
    ): Promise<Application> {
        // Verify job exists
        const job = await this.jobRepository.findOne({
            where: { id: createDto.job_id } as any,
        });
        if (!job) {
            throw new NotFoundException('Job not found');
        }

        // Check for duplicate application (candidate already applied to this job)
        const existing = await this.applicationRepository.findOne({
            where: {
                candidate_id: createDto.candidate_id,
                job_id: createDto.job_id,
                company_id: companyId,
            },
            withDeleted: false,
        });
        if (existing) {
            throw new ConflictException('Candidate has already applied to this job');
        }

        // Determine pipeline: use provided, or company default
        let pipelineId = createDto.pipeline_id;
        if (!pipelineId) {
            // Use company default pipeline
            const defaultPipeline = await this.pipelineRepository.findOne({
                where: { company_id: companyId, is_default: true },
            });
            if (!defaultPipeline) {
                throw new BadRequestException('No default pipeline found. Please specify a pipeline_id.');
            }
            pipelineId = defaultPipeline.id;
        }

        // Verify pipeline belongs to company
        const pipeline = await this.pipelineRepository.findOne({
            where: { id: pipelineId, company_id: companyId },
            relations: ['stages'],
        });
        if (!pipeline) {
            throw new NotFoundException('Pipeline not found');
        }

        // Determine initial stage: use provided or first stage in pipeline
        let stageId = createDto.current_stage_id;
        if (!stageId) {
            const firstStage = await this.stageRepository.findOne({
                where: { pipeline_id: pipelineId },
                order: { stage_order: 'ASC' },
            });
            if (!firstStage) {
                throw new BadRequestException('Pipeline has no stages');
            }
            stageId = firstStage.id;
        } else {
            // Verify stage belongs to the pipeline
            const stage = await this.stageRepository.findOne({
                where: { id: stageId, pipeline_id: pipelineId },
            });
            if (!stage) {
                throw new BadRequestException('Stage does not belong to the selected pipeline');
            }
        }

        const application = this.applicationRepository.create({
            ...createDto,
            company_id: companyId,
            pipeline_id: pipelineId,
            current_stage_id: stageId,
        });

        return this.applicationRepository.save(application);
    }

    async findAll(
        filterDto: FilterApplicationDto,
        companyId: string,
    ): Promise<ApplicationListResponseDto> {
        const {
            candidate_id,
            job_id,
            pipeline_id,
            current_stage_id,
            source_id,
            status,
            assigned_to,
            include_archived,
            applied_after,
            applied_before,
            min_rating,
            page = 1,
            limit = 20,
        } = filterDto;

        const where: FindOptionsWhere<Application> = {
            company_id: companyId,
        };

        if (candidate_id) where.candidate_id = candidate_id;
        if (job_id) where.job_id = job_id;
        if (pipeline_id) where.pipeline_id = pipeline_id;
        if (current_stage_id) where.current_stage_id = current_stage_id;
        if (source_id) where.source_id = source_id;
        if (status) where.status = status;
        if (assigned_to) where.assigned_to = assigned_to;
        if (!include_archived) where.is_archived = false;

        // Date range filtering
        if (applied_after && applied_before) {
            where.applied_at = Between(applied_after, applied_before);
        } else if (applied_after) {
            where.applied_at = MoreThanOrEqual(applied_after);
        } else if (applied_before) {
            where.applied_at = LessThanOrEqual(applied_before);
        }

        const qb = this.applicationRepository.createQueryBuilder('application');
        qb.where(where);

        if (min_rating) {
            qb.andWhere('application.rating >= :min_rating', { min_rating });
        }

        qb.leftJoinAndSelect('application.job', 'job');
        qb.leftJoinAndSelect('application.current_stage', 'current_stage');
        qb.leftJoinAndSelect('application.source', 'source');
        qb.leftJoinAndSelect('application.assignee', 'assignee');

        qb.orderBy('application.applied_at', 'DESC');
        qb.skip((page - 1) * limit);
        qb.take(limit);

        const [data, total] = await qb.getManyAndCount();

        return {
            data: data.map(ApplicationResponseDto.fromEntity),
            total,
            page,
            limit,
        };
    }

    async findOne(id: string, companyId: string): Promise<Application> {
        const application = await this.applicationRepository.findOne({
            where: { id, company_id: companyId },
            relations: ['job', 'pipeline', 'current_stage', 'source', 'assignee'],
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        return application;
    }

    async findByCandidate(candidateId: number, companyId: string): Promise<Application[]> {
        return this.applicationRepository.find({
            where: { candidate_id: candidateId, company_id: companyId },
            relations: ['job', 'current_stage', 'pipeline'],
            order: { applied_at: 'DESC' },
        });
    }

    async findByJob(jobId: number, companyId: string): Promise<Application[]> {
        return this.applicationRepository.find({
            where: { job_id: jobId, company_id: companyId },
            relations: ['current_stage', 'pipeline'],
            order: { applied_at: 'DESC' },
        });
    }

    async update(
        id: string,
        updateDto: UpdateApplicationDto,
        companyId: string,
    ): Promise<Application> {
        const application = await this.findOne(id, companyId);

        // Prevent changing candidate_id or job_id
        if (updateDto.candidate_id && updateDto.candidate_id !== application.candidate_id) {
            throw new BadRequestException('Cannot change candidate_id after application creation');
        }
        if (updateDto.job_id && updateDto.job_id !== application.job_id) {
            throw new BadRequestException('Cannot change job_id after application creation');
        }

        // If changing pipeline, validate it
        if (updateDto.pipeline_id && updateDto.pipeline_id !== application.pipeline_id) {
            const pipeline = await this.pipelineRepository.findOne({
                where: { id: updateDto.pipeline_id, company_id: companyId },
            });
            if (!pipeline) {
                throw new NotFoundException('Pipeline not found');
            }
        }

        // If changing stage, validate it belongs to the pipeline
        if (updateDto.current_stage_id) {
            const pipelineId = updateDto.pipeline_id || application.pipeline_id;
            const stage = await this.stageRepository.findOne({
                where: { id: updateDto.current_stage_id, pipeline_id: pipelineId },
            });
            if (!stage) {
                throw new BadRequestException('Stage does not belong to the selected pipeline');
            }
        }

        Object.assign(application, updateDto);
        return this.applicationRepository.save(application);
    }

    async archive(id: string, companyId: string): Promise<Application> {
        const application = await this.findOne(id, companyId);
        application.is_archived = true;
        application.archived_at = new Date();
        return this.applicationRepository.save(application);
    }

    async unarchive(id: string, companyId: string): Promise<Application> {
        const application = await this.findOne(id, companyId);
        application.is_archived = false;
        application.archived_at = null;
        return this.applicationRepository.save(application);
    }

    async remove(id: string, companyId: string): Promise<void> {
        const application = await this.findOne(id, companyId);
        await this.applicationRepository.softRemove(application);
    }

    async hardDelete(id: string, companyId: string): Promise<void> {
        const application = await this.applicationRepository.findOne({
            where: { id, company_id: companyId },
            withDeleted: true,
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        await this.applicationRepository.remove(application);
    }

    async advancedSearch(
        dto: any,
        companyId: string,
    ): Promise<{ data: Application[]; total: number; page: number; limit: number }> {
        const {
            statuses,
            pipeline_id,
            stage_id,
            source_id,
            assigned_to,
            candidate_id,
            job_id,
            rating_min,
            rating_max,
            from_date,
            to_date,
            include_archived,
            keyword,
            page = 1,
            limit = 20,
        } = dto;

        const qb = this.applicationRepository.createQueryBuilder('application');
        qb.where('application.company_id = :companyId', { companyId });

        if (statuses && statuses.length) qb.andWhere('application.status IN (:...statuses)', { statuses });
        if (pipeline_id) qb.andWhere('application.pipeline_id = :pipeline_id', { pipeline_id });
        if (stage_id) qb.andWhere('application.current_stage_id = :stage_id', { stage_id });
        if (source_id) qb.andWhere('application.source_id = :source_id', { source_id });
        if (assigned_to) qb.andWhere('application.assigned_to = :assigned_to', { assigned_to });
        if (candidate_id) qb.andWhere('application.candidate_id = :candidate_id', { candidate_id });
        if (job_id) qb.andWhere('application.job_id = :job_id', { job_id });
        if (rating_min) qb.andWhere('application.rating >= :rating_min', { rating_min });
        if (rating_max) qb.andWhere('application.rating <= :rating_max', { rating_max });
        if (!include_archived) qb.andWhere('application.is_archived = false');
        if (from_date) qb.andWhere('application.applied_at >= :from_date', { from_date });
        if (to_date) qb.andWhere('application.applied_at <= :to_date', { to_date });
        if (keyword) qb.andWhere('application.notes ILIKE :kw', { kw: `%${keyword}%` });

        qb.leftJoinAndSelect('application.job', 'job');
        qb.leftJoinAndSelect('application.current_stage', 'current_stage');
        qb.leftJoinAndSelect('application.source', 'source');
        qb.leftJoinAndSelect('application.assignee', 'assignee');

        qb.orderBy('application.applied_at', 'DESC');
        qb.skip((page - 1) * limit);
        qb.take(limit);

        const [data, total] = await qb.getManyAndCount();
        return { data, total, page, limit };
    }
}
