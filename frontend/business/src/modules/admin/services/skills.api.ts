import api from '../../../services/api';

export interface Skill {
    id: string;
    name: string;
    category_id?: string;
    description?: string;
    proficiency_scale?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const skillsApi = {
    async list(params?: any) {
        const response = await api.get('/skills', { params });
        return response.data.data as Skill[];
    },
    async search(term: string) {
        const response = await api.get('/skills/search', { params: { term } });
        return response.data.data as Skill[];
    },
    async getByCategory(categoryId: string) {
        const response = await api.get(`/skills/by-category/${categoryId}`);
        return response.data.data as Skill[];
    },
    async getActive() {
        const response = await api.get('/skills/active');
        return response.data.data as Skill[];
    },
    async getById(id: string) {
        const response = await api.get(`/skills/${id}`);
        return response.data.data as Skill;
    },
    async create(payload: any) {
        const response = await api.post('/skills', payload);
        return response.data.data as Skill;
    },
    async update(id: string, payload: any) {
        const response = await api.put(`/skills/${id}`, payload);
        return response.data.data as Skill;
    },
    async delete(id: string) {
        await api.delete(`/skills/${id}`);
    },
};
