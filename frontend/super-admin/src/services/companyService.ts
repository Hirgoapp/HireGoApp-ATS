import apiClient from './apiClient';

export interface Company {
    id: string;
    name: string;
    slug: string;
    description?: string;
    email?: string;
    status: 'active' | 'suspended' | 'inactive';
    licenseType: string;
    modules: Record<string, boolean>;
    userCount: number;
    admin?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateCompanyDto {
    name: string;
    slug: string;
    description?: string;
    licenseType: string;
}

export interface UpdateCompanyDto {
    name?: string;
    slug?: string;
    description?: string;
    email?: string;
    licenseTier?: string;
    isActive?: boolean;
    status?: 'active' | 'suspended' | 'inactive';
}

export interface CompaniesResponse {
    companies: Company[];
    pagination: {
        total: number;
        page: number;
        limit: number;
    };
}

class CompanyService {
    async getCompanies(page = 1, limit = 20, search?: string): Promise<CompaniesResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (search) {
            params.append('search', search);
        }

        const response = await apiClient.get<{ success: boolean; data: CompaniesResponse }>(
            `/super-admin/companies?${params.toString()}`
        );
        return response.data.data;
    }

    async getCompanyById(id: string): Promise<Company> {
        const response = await apiClient.get<{ data: Company }>(
            `/super-admin/companies/${id}`
        );
        return response.data.data;
    }

    async createCompany(data: CreateCompanyDto): Promise<Company> {
        console.log('🔗 [API CLIENT] POST /super-admin/companies');
        console.log('📤 [API CLIENT] Request body:', data);
        try {
            const response = await apiClient.post<{ data: Company }>(
                '/super-admin/companies',
                data
            );
            console.log('✅ [API CLIENT] Response received:', response.data);
            return response.data.data;
        } catch (error: any) {
            console.error('❌ [API CLIENT] API call failed');
            console.error('❌ [API CLIENT] Error status:', error.response?.status);
            console.error('❌ [API CLIENT] Error data:', error.response?.data);
            console.error('❌ [API CLIENT] Error message:', error.message);
            throw error;
        }
    }

    async updateCompany(id: string, data: UpdateCompanyDto): Promise<Company> {
        const response = await apiClient.patch<{ data: Company }>(
            `/super-admin/companies/${id}`,
            data
        );
        return response.data.data;
    }

    async deleteCompany(id: string): Promise<void> {
        await apiClient.delete(`/super-admin/companies/${id}`);
    }

    async enableModule(companyId: string, moduleKey: string): Promise<void> {
        await apiClient.post(`/super-admin/modules/${companyId}/enable`, {
            module: moduleKey,
        });
    }

    async disableModule(companyId: string, moduleKey: string): Promise<void> {
        await apiClient.post(`/super-admin/modules/${companyId}/disable`, {
            module: moduleKey,
        });
    }

    async getModules(companyId: string): Promise<Record<string, any>> {
        const response = await apiClient.get<{ data: { companyId: string; modules: Record<string, any> } }>(
            `/super-admin/modules/${companyId}`
        );
        return response.data.data.modules;
    }

    async getCompanyAdmins(companyId: string): Promise<Array<{ id: string; email: string; firstName: string; lastName: string; role: string; isActive: boolean; createdAt: string; }>> {
        const response = await apiClient.get<{ success: boolean; data: { companyId: string; admins: Array<{ id: string; email: string; firstName: string; lastName: string; role: string; isActive: boolean; createdAt: string; }> } }>(
            `/super-admin/companies/${companyId}/admins`
        );
        return response.data.data.admins;
    }

    async createCompanyAdmin(companyId: string, body: { firstName: string; lastName: string; email: string; password: string; role?: string; }) {
        const response = await apiClient.post<{ success: boolean; data: { id: string; email: string; firstName: string; lastName: string; role: string; companyId: string; createdAt: string } }>(
            `/super-admin/companies/${companyId}/admins`,
            body
        );
        return response.data.data;
    }

    async updateCompanyAdmin(
        companyId: string,
        adminId: string | number,
        body: { firstName?: string; lastName?: string; email?: string; password?: string; role?: string; isActive?: boolean }
    ) {
        const response = await apiClient.patch<{ success: boolean; data: { id: string | number; email: string; firstName: string; lastName: string; role: string; isActive: boolean; companyId: string; updatedAt: string } }>(
            `/super-admin/companies/${companyId}/admins/${adminId}`,
            body
        );
        return response.data.data;
    }

    async resendWelcomeEmail(companyId: string): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.post<{ success: boolean; message: string }>(
            `/super-admin/companies/${companyId}/resend-welcome-email`,
            {}
        );
        return response.data;
    }
}

export default new CompanyService();
