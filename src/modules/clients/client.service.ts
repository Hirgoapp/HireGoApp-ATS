import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { ClientPoc } from './entities/client-poc.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { FilterClientDto } from './dto/filter-client.dto';
import { CreatePocDto } from './dto/create-poc.dto';
import { UpdatePocDto } from './dto/update-poc.dto';

const CLIENT_LIST_SORT_FIELDS = new Set([
    'name',
    'code',
    'contact_person',
    'email',
    'phone',
    'city',
    'state',
    'country',
    'industry',
    'status',
    'is_active',
    'created_at',
    'updated_at',
]);

@Injectable()
export class ClientService {
    constructor(
        @InjectRepository(Client)
        private readonly clientRepository: Repository<Client>,
        @InjectRepository(ClientPoc)
        private readonly pocRepository: Repository<ClientPoc>,
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) { }

    async create(createClientDto: CreateClientDto, companyId: string, userId: string): Promise<Client> {
        const client = this.clientRepository.create({
            ...createClientDto,
            company_id: companyId,
            created_by: userId,
            updated_by: userId,
        });

        return await this.clientRepository.save(client);
    }

    async findAll(companyId: string, filterDto: FilterClientDto): Promise<{ data: Client[]; total: number; page: number; limit: number }> {
        const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC', ...filters } = filterDto;
        const skip = (page - 1) * limit;
        const sortField = CLIENT_LIST_SORT_FIELDS.has(sortBy) ? sortBy : 'created_at';
        const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

        const queryBuilder = this.clientRepository
            .createQueryBuilder('client')
            .where('client.company_id = :companyId', { companyId })
            .andWhere('client.deleted_at IS NULL');

        const q = filters.search?.trim();
        if (q) {
            const search = `%${q}%`;
            queryBuilder.andWhere(
                '(client.name ILIKE :search OR client.code ILIKE :search OR client.email ILIKE :search OR client.contact_person ILIKE :search OR client.phone ILIKE :search)',
                { search },
            );
        }

        if (filters.name) {
            queryBuilder.andWhere('client.name ILIKE :name', { name: `%${filters.name}%` });
        }

        if (filters.status) {
            queryBuilder.andWhere('client.status = :status', { status: filters.status });
        }

        if (filters.city) {
            queryBuilder.andWhere('client.city ILIKE :city', { city: `%${filters.city}%` });
        }

        if (filters.country) {
            queryBuilder.andWhere('client.country ILIKE :country', { country: `%${filters.country}%` });
        }

        if (filters.state) {
            queryBuilder.andWhere('client.state ILIKE :state', { state: `%${filters.state}%` });
        }

        if (filters.industry) {
            queryBuilder.andWhere('client.industry ILIKE :industry', { industry: `%${filters.industry}%` });
        }

        if (filters.is_active !== undefined) {
            queryBuilder.andWhere('client.is_active = :is_active', { is_active: filters.is_active });
        }

        const total = await queryBuilder.getCount();

        const data = await queryBuilder
            .orderBy(`client.${sortField}`, order)
            .skip(skip)
            .take(limit)
            .getMany();

        return { data, total, page, limit };
    }

    async getListSummary(companyId: string): Promise<{
        total: number;
        active: number;
        inactive: number;
        suspended: number;
        clients_with_open_jobs: number;
    }> {
        const total = await this.getCount(companyId);
        const active = await this.getCountByStatus(companyId, 'Active');
        const inactive = await this.getCountByStatus(companyId, 'Inactive');
        const suspended = await this.getCountByStatus(companyId, 'Suspended');

        const raw = await this.dataSource
            .createQueryBuilder()
            .select('COUNT(DISTINCT job.client_id)', 'cnt')
            .from('jobs', 'job')
            .where('job.company_id = :companyId', { companyId })
            .andWhere('job.deleted_at IS NULL')
            .andWhere('LOWER(job.status) = :open', { open: 'open' })
            .andWhere('job.client_id IS NOT NULL')
            .getRawOne<{ cnt: string }>();

        const clients_with_open_jobs = parseInt(String(raw?.cnt ?? '0'), 10) || 0;

        return {
            total,
            active,
            inactive,
            suspended,
            clients_with_open_jobs,
        };
    }

    async findOne(id: string, companyId: string): Promise<Client> {
        const client = await this.clientRepository.findOne({
            where: { id, company_id: companyId, deleted_at: null },
            relations: ['company', 'creator', 'updater'],
        });

        if (!client) {
            throw new NotFoundException(`Client with ID ${id} not found`);
        }

        return client;
    }

    async update(id: string, updateClientDto: UpdateClientDto, companyId: string, userId: string): Promise<Client> {
        const client = await this.findOne(id, companyId);

        Object.assign(client, updateClientDto);
        client.updated_by = userId;

        return await this.clientRepository.save(client);
    }

    async remove(id: string, companyId: string): Promise<void> {
        const client = await this.findOne(id, companyId);
        await this.clientRepository.softDelete(id);
    }

    async hardDelete(id: string, companyId: string): Promise<void> {
        const client = await this.findOne(id, companyId);
        await this.clientRepository.delete(id);
    }

    async getCount(companyId: string): Promise<number> {
        return await this.clientRepository.count({
            where: { company_id: companyId, deleted_at: null },
        });
    }

    async getCountByStatus(companyId: string, status: string): Promise<number> {
        return await this.clientRepository.count({
            where: { company_id: companyId, status, deleted_at: null },
        });
    }

    async findByStatus(companyId: string, status: string): Promise<Client[]> {
        return await this.clientRepository.find({
            where: { company_id: companyId, status, deleted_at: null },
            order: { created_at: 'DESC' },
        });
    }

    async findActive(companyId: string): Promise<Client[]> {
        return await this.clientRepository.find({
            where: { company_id: companyId, is_active: true, deleted_at: null },
            order: { name: 'ASC' },
        });
    }

    async searchClients(companyId: string, searchTerm: string): Promise<Client[]> {
        return await this.clientRepository
            .createQueryBuilder('client')
            .where('client.company_id = :companyId', { companyId })
            .andWhere('client.deleted_at IS NULL')
            .andWhere('(client.name ILIKE :searchTerm OR client.email ILIKE :searchTerm OR client.contact_person ILIKE :searchTerm)', {
                searchTerm: `%${searchTerm}%`,
            })
            .orderBy('client.name', 'ASC')
            .limit(10)
            .getMany();
    }

    // ——— POC (Point of Contact) ———
    async findPocsByClientId(clientId: string, companyId: string): Promise<ClientPoc[]> {
        await this.findOne(clientId, companyId);
        return await this.pocRepository.find({
            where: { client_id: clientId, company_id: companyId, deleted_at: null },
            order: { name: 'ASC' },
        });
    }

    async createPoc(clientId: string, createPocDto: CreatePocDto, companyId: string): Promise<ClientPoc> {
        await this.findOne(clientId, companyId);
        const poc = this.pocRepository.create({
            ...createPocDto,
            client_id: clientId,
            company_id: companyId,
        });
        return await this.pocRepository.save(poc);
    }

    async findPocById(pocId: string, companyId: string, clientId?: string): Promise<ClientPoc> {
        const where: any = { id: pocId, company_id: companyId, deleted_at: null };
        if (clientId) where.client_id = clientId;
        const poc = await this.pocRepository.findOne({ where });
        if (!poc) {
            throw new NotFoundException(`POC with ID ${pocId} not found`);
        }
        return poc;
    }

    async updatePoc(pocId: string, updatePocDto: UpdatePocDto, companyId: string): Promise<ClientPoc> {
        const poc = await this.findPocById(pocId, companyId);
        Object.assign(poc, updatePocDto);
        return await this.pocRepository.save(poc);
    }

    async removePoc(pocId: string, companyId: string): Promise<void> {
        const poc = await this.findPocById(pocId, companyId);
        await this.pocRepository.softDelete(poc.id);
    }
}
