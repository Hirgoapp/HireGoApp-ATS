import api from '../../../services/api';

export interface Qualification {
    id: string;
    name: string;
    level?: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const qualificationsApi = {
    async list(params?: any) {
        const response = await api.get('/qualifications', { params });
        return response.data.data as Qualification[];
    },
    async getActive() {
        const response = await api.get('/qualifications/active');
        return response.data.data as Qualification[];
    },
    async getById(id: string) {
        const response = await api.get(`/qualifications/${id}`);
        return response.data.data as Qualification;
    },
    async create(payload: any) {
        const response = await api.post('/qualifications', payload);
        return response.data.data as Qualification;
    },
    async update(id: string, payload: any) {
        const response = await api.put(`/qualifications/${id}`, payload);
        return response.data.data as Qualification;
    },
    async delete(id: string) {
        await api.delete(`/qualifications/${id}`);
    },
};
