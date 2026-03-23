import api from '../api';

export interface Activity {
    id: string;
    company_id: string;
    entity_type: string;
    entity_id: string;
    activity_type: string;
    message: string;
    metadata?: any;
    created_by?: string;
    created_at: string;
}

export interface PaginatedActivities {
    success: boolean;
    data: Activity[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

// List all activities for the company
export const listActivities = async (
    page: number = 1,
    limit: number = 50,
    entityType?: string,
): Promise<PaginatedActivities> => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(entityType && { entityType }),
    });

    const response = await api.get(`/activity?${params}`);
    return response.data;
};

// Get activity timeline for a specific entity
export const getEntityActivities = async (
    entityType: string,
    entityId: string,
): Promise<{ success: boolean; data: Activity[] }> => {
    const response = await api.get(`/activity/${entityType}/${entityId}`);
    return response.data;
};

export default {
    listActivities,
    getEntityActivities,
};
