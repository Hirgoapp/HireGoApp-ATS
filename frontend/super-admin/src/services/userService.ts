import apiClient from './apiClient';

export interface SuperAdminUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
    isActive: boolean;
    emailVerified: boolean;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSuperAdminDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
}

export interface UpdateSuperAdminDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    isActive?: boolean;
}

export interface ChangePasswordDto {
    oldPassword: string;
    newPassword: string;
}

export interface SuperAdminResponse {
    success: boolean;
    data: {
        users: SuperAdminUser[];
        pagination: {
            total: number;
            page: number;
            limit: number;
        };
    };
}

class UserService {
    async getSuperAdminUsers(page = 1, limit = 20): Promise<SuperAdminResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        const response = await apiClient.get<SuperAdminResponse>(
            `/super-admin/users?${params.toString()}`
        );
        return response.data;
    }

    async getSuperAdminUserById(id: string): Promise<SuperAdminUser> {
        const response = await apiClient.get<{ data: SuperAdminUser }>(
            `/super-admin/users/${id}`
        );
        return response.data.data;
    }

    async createSuperAdminUser(data: CreateSuperAdminDto): Promise<SuperAdminUser> {
        const response = await apiClient.post<{ data: SuperAdminUser }>(
            '/super-admin/users',
            data
        );
        return response.data.data;
    }

    async updateSuperAdminUser(id: string, data: UpdateSuperAdminDto): Promise<SuperAdminUser> {
        const response = await apiClient.patch<{ data: SuperAdminUser }>(
            `/super-admin/users/${id}`,
            data
        );
        return response.data.data;
    }

    async deleteSuperAdminUser(id: string): Promise<void> {
        await apiClient.delete(`/super-admin/users/${id}`);
    }

    async changePassword(data: ChangePasswordDto): Promise<void> {
        await apiClient.post('/super-admin/auth/change-password', data);
    }

    async getCurrentUser(): Promise<SuperAdminUser> {
        const response = await apiClient.get<{ data: SuperAdminUser }>(
            '/super-admin/users/me'
        );
        return response.data.data;
    }
}

export default new UserService();
