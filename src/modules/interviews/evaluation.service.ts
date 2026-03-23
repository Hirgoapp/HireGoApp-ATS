import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluation, EvaluationStatus } from './entities/evaluation.entity';
import { WebhookService } from '../webhooks/webhook.service';
import { WebhookEventType } from '../webhooks/entities/webhook-subscription.entity';
import { CreateEvaluationDto, UpdateEvaluationDto } from './dto/evaluation.dto';
import { Application } from '../applications/entities/application.entity';

@Injectable()
export class EvaluationService {
    constructor(
        @InjectRepository(Evaluation)
        private readonly evaluationRepository: Repository<Evaluation>,
        @InjectRepository(Application)
        private readonly applicationRepository: Repository<Application>,
        private readonly webhookService: WebhookService,
    ) { }

    /**
     * Create evaluation for an application
     */
    async create(createDto: CreateEvaluationDto, companyId: string): Promise<Evaluation> {
        // Verify application exists and belongs to company
        const application = await this.applicationRepository.findOne({
            where: { id: createDto.application_id, company_id: companyId },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        // Validate rating
        if (createDto.rating < 1 || createDto.rating > 5) {
            throw new BadRequestException('Rating must be between 1 and 5');
        }

        const evaluation = this.evaluationRepository.create({
            ...createDto,
            status: createDto.status || EvaluationStatus.PENDING,
        });
        const saved = await this.evaluationRepository.save(evaluation);

        // Publish webhook event for evaluation submission
        try {
            await this.webhookService.publishEvent(
                companyId,
                WebhookEventType.EVALUATION_SUBMITTED,
                {
                    id: saved.id,
                    applicationId: saved.application_id,
                    evaluatorId: saved.evaluator_id,
                    rating: saved.rating,
                    status: saved.status,
                    feedback: saved.feedback,
                    strengths: saved.strengths,
                    weaknesses: saved.weaknesses,
                    recommendation: saved.recommendation,
                    createdAt: saved.created_at,
                },
            );
        } catch (err) {
            // Swallow errors to avoid impacting core flow
        }

        return saved;
    }

    /**
     * Get evaluations for an application
     */
    async findByApplication(applicationId: string, companyId: string): Promise<Evaluation[]> {
        // Verify application exists
        const application = await this.applicationRepository.findOne({
            where: { id: applicationId, company_id: companyId },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        return this.evaluationRepository.find({
            where: { application_id: applicationId },
            relations: ['evaluator'],
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Get evaluation by ID
     */
    async findOne(id: string, companyId: string): Promise<Evaluation> {
        const evaluation = await this.evaluationRepository.findOne({
            where: { id },
            relations: ['application', 'evaluator'],
        });

        if (!evaluation) {
            throw new NotFoundException('Evaluation not found');
        }

        // Verify the application belongs to the company
        if (evaluation.application.company_id !== companyId) {
            throw new NotFoundException('Evaluation not found');
        }

        return evaluation;
    }

    /**
     * Update evaluation
     */
    async update(id: string, updateDto: UpdateEvaluationDto, companyId: string): Promise<Evaluation> {
        const evaluation = await this.findOne(id, companyId);

        if (updateDto.rating && (updateDto.rating < 1 || updateDto.rating > 5)) {
            throw new BadRequestException('Rating must be between 1 and 5');
        }

        Object.assign(evaluation, updateDto);
        return this.evaluationRepository.save(evaluation);
    }

    /**
     * Delete evaluation
     */
    async remove(id: string, companyId: string): Promise<void> {
        const evaluation = await this.findOne(id, companyId);
        await this.evaluationRepository.remove(evaluation);
    }

    /**
     * Get average rating for application
     */
    async getApplicationAverageRating(applicationId: string, companyId: string): Promise<number | null> {
        const application = await this.applicationRepository.findOne({
            where: { id: applicationId, company_id: companyId },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        const result = await this.evaluationRepository
            .createQueryBuilder('evaluation')
            .where('evaluation.application_id = :applicationId', { applicationId })
            .select('AVG(evaluation.rating)', 'average_rating')
            .getRawOne();

        return result?.average_rating ? parseFloat(result.average_rating) : null;
    }
}
