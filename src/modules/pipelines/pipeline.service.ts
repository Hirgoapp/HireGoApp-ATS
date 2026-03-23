import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pipeline } from './entities/pipeline.entity';
import { PipelineStage, StageType } from './entities/pipeline-stage.entity';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { UpdatePipelineDto } from './dto/update-pipeline.dto';
import { FilterPipelineDto } from './dto/filter-pipeline.dto';

@Injectable()
export class PipelineService {
    constructor(
        @InjectRepository(Pipeline)
        private readonly pipelineRepo: Repository<Pipeline>,
        @InjectRepository(PipelineStage)
        private readonly stageRepo: Repository<PipelineStage>,
    ) { }

    async create(dto: CreatePipelineDto, companyId: string, userId: string): Promise<Pipeline> {
        const pipeline = this.pipelineRepo.create({
            ...dto,
            company_id: companyId,
            created_by: userId,
            updated_by: userId,
        });

        const saved = await this.pipelineRepo.save(pipeline);

        if (dto.stages && dto.stages.length > 0) {
            const stages = dto.stages.map((stage) =>
                this.stageRepo.create({
                    ...stage,
                    pipeline_id: saved.id,
                }),
            );
            await this.stageRepo.save(stages);
        }

        return await this.findOne(saved.id, companyId);
    }

    async createDefault(companyId: string, userId: string): Promise<Pipeline> {
        const defaultStages = [
            { name: 'Applied', stage_order: 1, stage_type: StageType.APPLIED, color: '#3B82F6' },
            { name: 'Screening', stage_order: 2, stage_type: StageType.SCREENING, color: '#8B5CF6' },
            { name: 'Phone Interview', stage_order: 3, stage_type: StageType.PHONE_SCREEN, color: '#EC4899' },
            { name: 'Technical Interview', stage_order: 4, stage_type: StageType.TECHNICAL, color: '#F59E0B' },
            { name: 'Final Interview', stage_order: 5, stage_type: StageType.FINAL_INTERVIEW, color: '#10B981' },
            { name: 'Offer', stage_order: 6, stage_type: StageType.OFFER, color: '#06B6D4' },
            { name: 'Hired', stage_order: 7, stage_type: StageType.HIRED, color: '#22C55E' },
        ];

        return await this.create(
            {
                name: 'Default Hiring Pipeline',
                description: 'Standard recruitment process',
                is_default: true,
                stages: defaultStages,
            },
            companyId,
            userId,
        );
    }

    async findAll(companyId: string, filter: FilterPipelineDto) {
        const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC', ...rest } = filter;
        const qb = this.pipelineRepo
            .createQueryBuilder('pipeline')
            .leftJoinAndSelect('pipeline.stages', 'stages')
            .where('pipeline.company_id = :companyId', { companyId })
            .andWhere('pipeline.deleted_at IS NULL');

        if (rest.search) {
            qb.andWhere('pipeline.name ILIKE :search', { search: `%${rest.search}%` });
        }

        const total = await qb.getCount();
        const data = await qb
            .orderBy(`pipeline.${sortBy}`, sortOrder)
            .addOrderBy('stages.stage_order', 'ASC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return { data, total, page, limit };
    }

    async findOne(id: string, companyId: string): Promise<Pipeline> {
        const pipeline = await this.pipelineRepo.findOne({
            where: { id, company_id: companyId, deleted_at: null },
            relations: ['stages'],
            order: { stages: { stage_order: 'ASC' } },
        });
        if (!pipeline) throw new NotFoundException(`Pipeline ${id} not found`);
        return pipeline;
    }

    async findDefault(companyId: string): Promise<Pipeline> {
        const pipeline = await this.pipelineRepo.findOne({
            where: { company_id: companyId, is_default: true, deleted_at: null },
            relations: ['stages'],
            order: { stages: { stage_order: 'ASC' } },
        });
        if (!pipeline) throw new NotFoundException('No default pipeline found');
        return pipeline;
    }

    async update(id: string, dto: UpdatePipelineDto, companyId: string, userId: string): Promise<Pipeline> {
        const pipeline = await this.findOne(id, companyId);
        Object.assign(pipeline, dto);
        pipeline.updated_by = userId;
        await this.pipelineRepo.save(pipeline);
        return await this.findOne(id, companyId);
    }

    async remove(id: string, companyId: string): Promise<void> {
        await this.findOne(id, companyId);
        await this.pipelineRepo.softDelete(id);
    }

    async addStage(pipelineId: string, stageDto: any, companyId: string): Promise<PipelineStage> {
        const pipeline = await this.findOne(pipelineId, companyId);
        const stage = this.stageRepo.create({
            ...stageDto,
            pipeline_id: pipeline.id,
        });
        const saved = await this.stageRepo.save(stage);
        return Array.isArray(saved) ? saved[0] : saved;
    }

    async updateStage(stageId: string, stageDto: any, companyId: string): Promise<PipelineStage> {
        const stage = await this.stageRepo.findOne({
            where: { id: stageId },
            relations: ['pipeline'],
        });
        if (!stage || stage.pipeline.company_id !== companyId) {
            throw new NotFoundException(`Stage ${stageId} not found`);
        }
        Object.assign(stage, stageDto);
        return await this.stageRepo.save(stage);
    }

    async removeStage(stageId: string, companyId: string): Promise<void> {
        const stage = await this.stageRepo.findOne({
            where: { id: stageId },
            relations: ['pipeline'],
        });
        if (!stage || stage.pipeline.company_id !== companyId) {
            throw new NotFoundException(`Stage ${stageId} not found`);
        }
        await this.stageRepo.softDelete(stageId);
    }
}
