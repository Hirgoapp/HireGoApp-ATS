import api from '../../../services/api';

export interface EducationLevel {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const educationLevelsApi = {
    async list(params?: any) {
        const response = await api.get('/education-levels', { params });
        return response.data.data as EducationLevel[];
    },
    async getActive() {
        const response = await api.get('/education-levels/active');
        return response.data.data as EducationLevel[];
    },
    async getById(id: string) {
        const response = await api.get(`/education-levels/${id}`);
        return response.data.data as EducationLevel;
    },
    async create(payload: any) {
        const response = await api.post('/education-levels', payload);
        return response.data.data as EducationLevel;
    },
    async update(id: string, payload: any) {
        const response = await api.put(`/education-levels/${id}`, payload);
        return response.data.data as EducationLevel;
    },
    async delete(id: string) {
        await api.delete(`/education-levels/${id}`);
    },
};
