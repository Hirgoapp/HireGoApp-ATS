import api from '../../../services/api';

export interface SkillCategory {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const skillCategoriesApi = {
    async list(params?: any) {
        const response = await api.get('/skill-categories', { params });
        return response.data.data as SkillCategory[];
    },
    async getActive() {
        const response = await api.get('/skill-categories/active');
        return response.data.data as SkillCategory[];
    },
    async getById(id: string) {
        const response = await api.get(`/skill-categories/${id}`);
        return response.data.data as SkillCategory;
    },
    async create(payload: any) {
        const response = await api.post('/skill-categories', payload);
        return response.data.data as SkillCategory;
    },
    async update(id: string, payload: any) {
        const response = await api.put(`/skill-categories/${id}`, payload);
        return response.data.data as SkillCategory;
    },
    async delete(id: string) {
        await api.delete(`/skill-categories/${id}`);
    },
};
