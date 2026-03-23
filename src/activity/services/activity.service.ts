import { Injectable } from '@nestjs/common';
import { ActivityRepository } from '../repositories/activity.repository';

interface LogActivityInput {
    entityType: string;
    entityId: string;
    activityType: string;
    message: string;
    metadata?: any;
}

@Injectable()
export class ActivityService {
    constructor(private readonly activityRepository: ActivityRepository) {}

    async logActivity(
        companyId: string,
        userId: string | null,
        data: LogActivityInput,
    ) {
        await this.activityRepository.createActivity(companyId, {
            entityType: data.entityType,
            entityId: data.entityId,
            activityType: data.activityType,
            message: data.message,
            metadata: data.metadata,
            createdBy: userId,
        });
    }

    async getEntityActivities(
        companyId: string,
        entityType: string,
        entityId: string,
    ) {
        return this.activityRepository.getEntityActivities(companyId, entityType, entityId);
    }

    async deleteActivitiesForEntity(
        companyId: string,
        entityType: string,
        entityId: string,
    ) {
        await this.activityRepository.deleteActivitiesForEntity(companyId, entityType, entityId);
    }
}

