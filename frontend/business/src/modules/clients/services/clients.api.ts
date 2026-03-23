import api from '../../../services/api';

export interface Client {
    id: string;
    company_id: string;
    name: string;
    code?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    website?: string;
    industry?: string;
    status?: string;
    payment_terms?: string;
    tax_id?: string;
    notes?: string;
    is_active?: boolean;
    // Optional tags for advanced UX (if backend adds later)
    tags?: string[];
    created_at: string;
    updated_at: string;
}

export interface ClientListResponse {
    data: Client[];
    total: number;
    page?: number;
    limit?: number;
}

export type ClientSortField =
    | 'name'
    | 'code'
    | 'contact_person'
    | 'email'
    | 'phone'
    | 'city'
    | 'state'
    | 'country'
    | 'industry'
    | 'status'
    | 'is_active'
    | 'created_at'
    | 'updated_at';

export interface ClientFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    industry?: string;
    city?: string;
    country?: string;
    state?: string;
    is_active?: boolean;
    sortBy?: ClientSortField;
    sortOrder?: 'ASC' | 'DESC';
}

export interface CreateClientPayload {
    name: string;
    code?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    website?: string;
    industry?: string;
    status?: string;
    payment_terms?: string;
    tax_id?: string;
    notes?: string;
    is_active?: boolean;
}

export type UpdateClientPayload = Partial<CreateClientPayload>;

export async function fetchClients(filters: ClientFilters = {}): Promise<ClientListResponse> {
    const params: Record<string, any> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
    };

    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.industry) params.industry = filters.industry;
    if (filters.city) params.city = filters.city;
    if (filters.country) params.country = filters.country;
    if (filters.state) params.state = filters.state;
    if (filters.is_active !== undefined) params.is_active = filters.is_active;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    const response = await api.get<ClientListResponse>('/clients', { params });
    return response.data;
}

export async function getClient(id: string): Promise<Client> {
    const response = await api.get<Client>(`/clients/${id}`);
    return (response.data as any).data ?? (response.data as any);
}

export async function createClient(payload: CreateClientPayload): Promise<Client> {
    const response = await api.post<Client>('/clients', payload);
    return (response.data as any).data ?? (response.data as any);
}

export async function updateClient(id: string, payload: UpdateClientPayload): Promise<Client> {
    const response = await api.put<Client>(`/clients/${id}`, payload);
    return (response.data as any).data ?? (response.data as any);
}

export async function deleteClient(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
}

export interface ClientListSummary {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    clients_with_open_jobs: number;
}

export async function fetchClientListSummary(): Promise<ClientListSummary> {
    const response = await api.get<ClientListSummary>('/clients/stats/summary');
    return response.data;
}

// ——— POC (Points of Contact) ———
export interface ClientPoc {
    id: string;
    company_id: string;
    client_id: string;
    name: string;
    designation?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    notes?: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface CreatePocPayload {
    name: string;
    designation?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    notes?: string;
    status?: string;
}

export type UpdatePocPayload = Partial<CreatePocPayload>;

export async function fetchPocs(clientId: string): Promise<ClientPoc[]> {
    const response = await api.get<ClientPoc[]>(`/clients/${clientId}/pocs`);
    return Array.isArray(response.data) ? response.data : (response.data as any)?.data ?? [];
}

export async function getPoc(clientId: string, pocId: string): Promise<ClientPoc> {
    const response = await api.get<ClientPoc>(`/clients/${clientId}/pocs/${pocId}`);
    return (response.data as any).data ?? response.data;
}

export async function createPoc(clientId: string, payload: CreatePocPayload): Promise<ClientPoc> {
    const response = await api.post<ClientPoc>(`/clients/${clientId}/pocs`, payload);
    return (response.data as any).data ?? response.data;
}

export async function updatePoc(
    clientId: string,
    pocId: string,
    payload: UpdatePocPayload,
): Promise<ClientPoc> {
    const response = await api.put<ClientPoc>(`/clients/${clientId}/pocs/${pocId}`, payload);
    return (response.data as any).data ?? response.data;
}

export async function deletePoc(clientId: string, pocId: string): Promise<void> {
    await api.delete(`/clients/${clientId}/pocs/${pocId}`);
}

