import api from '../../../services/api';

export interface ExperienceType {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const experienceTypesApi = {
    async list(params?: any) {
        const response = await api.get('/experience-types', { params });
        return response.data.data as ExperienceType[];
    },
    async getActive() {
        const response = await api.get('/experience-types/active');
        return response.data.data as ExperienceType[];
    },
    async getById(id: string) {
        const response = await api.get(`/experience-types/${id}`);
        return response.data.data as ExperienceType;
    },
    async create(payload: any) {
        const response = await api.post('/experience-types', payload);
        return response.data.data as ExperienceType;
    },
    async update(id: string, payload: any) {
        const response = await api.put(`/experience-types/${id}`, payload);
        return response.data.data as ExperienceType;
    },
    async delete(id: string) {
        await api.delete(`/experience-types/${id}`);
    },
};
