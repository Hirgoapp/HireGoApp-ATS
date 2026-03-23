import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../entities/activity.entity';

@Injectable()
export class ActivityRepository {
    constructor(
        @InjectRepository(Activity)
        private readonly repository: Repository<Activity>,
    ) { }

    async createActivity(
        companyId: string,
        data: {
            entityType: string;
            entityId: string;
            activityType: string;
            message: string;
            metadata?: any;
            createdBy?: string | null;
        },
    ): Promise<Activity> {
        const entity = this.repository.create({
            company_id: companyId,
            entity_type: data.entityType,
            entity_id: data.entityId,
            activity_type: data.activityType,
            message: data.message,
            metadata: data.metadata ?? null,
            created_by: data.createdBy ?? null,
        });
        return this.repository.save(entity);
    }

    async findWithPagination(
        companyId: string,
        page: number = 1,
        limit: number = 50,
        entityType?: string,
    ): Promise<{ data: Activity[]; total: number }> {
        const where: any = {
            company_id: companyId,
        };

        if (entityType) {
            where.entity_type = entityType;
        }

        const [data, total] = await this.repository.findAndCount({
            where,
            order: { created_at: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, total };
    }

    async getEntityActivities(
        companyId: string,
        entityType: string,
        entityId: string,
    ): Promise<Activity[]> {
        return this.repository.find({
            where: { company_id: companyId, entity_type: entityType, entity_id: entityId },
            order: { created_at: 'DESC' },
        });
    }

    async deleteActivitiesForEntity(
        companyId: string,
        entityType: string,
        entityId: string,
    ): Promise<void> {
        await this.repository.delete({ company_id: companyId, entity_type: entityType, entity_id: entityId });
    }
}


