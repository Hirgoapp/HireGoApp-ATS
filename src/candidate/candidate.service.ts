import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, Between, In } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { FilterCandidateDto } from './dto/filter-candidate.dto';
import { CandidateResponseDto, CandidateListResponseDto } from './dto/candidate-response.dto';
import { AdvancedCandidateSearchDto, AdvancedCandidateSearchResponseDto, SearchOperator, SearchFilter } from './dto/advanced-search-candidate.dto';
import { BulkImportCandidateDto, BulkImportCandidateItemDto, BulkImportResultDto } from './dto/bulk-import-candidate.dto';
import { BulkUpdateCandidateDto, BulkUpdateResultDto } from './dto/bulk-update-candidate.dto';

@Injectable()
export class CandidateService {
    private candidateColumnCache: Set<string> | null = null;

    constructor(
        @InjectRepository(Candidate)
        private readonly candidateRepository: Repository<Candidate>,
    ) { }

    private async getCandidateColumns(): Promise<Set<string>> {
        if (this.candidateColumnCache) {
            return this.candidateColumnCache;
        }

        const rows = await this.candidateRepository.query(
            `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'candidates'`
        );

        this.candidateColumnCache = new Set((rows || []).map((r: any) => String(r.column_name)));
        return this.candidateColumnCache;
    }

    /**
     * Create a new candidate (tenant-scoped)
     */
    async create(
        createCandidateDto: CreateCandidateDto,
        companyId: string,
        userId: string,
    ): Promise<CandidateResponseDto> {
        // Check for duplicate email within company
        const existing = await this.candidateRepository.findOne({
            where: {
                company_id: companyId,
                email: createCandidateDto.email,
            },
        });

        if (existing) {
            throw new BadRequestException('Candidate with this email already exists in your company');
        }

        const candidate = this.candidateRepository.create({
            ...createCandidateDto,
            company_id: companyId,
            created_by: userId,
            updated_by: userId,
        });

        const saved = await this.candidateRepository.save(candidate);
        return saved;
    }

    /**
     * Get all candidates for a company (tenant-scoped, with filters)
     */
    async findAll(
        companyId: string,
        filterDto: FilterCandidateDto,
    ): Promise<CandidateListResponseDto> {
        const { page = 1, limit = 10, candidate_status, source_id, recruiter_id, search, date_from, date_to, sort_by = 'created_at', sort_order = 'DESC' } = filterDto;

        const skip = (page - 1) * limit;

        const columns = await this.getCandidateColumns();
        const selectFields = [
            'id',
            'company_id',
            'candidate_name',
            'email',
            'phone',
            'candidate_status',
            'current_company',
            'total_experience',
            'relevant_experience',
            'job_location',
            'notice_period',
            'skill_set',
            'location_preference',
            'notes',
            'last_submission_date',
            'created_at',
            'updated_at',
        ];

        const selectSql = selectFields
            .map((field) =>
                columns.has(field)
                    ? `candidate."${field}" AS "${field}"`
                    : `NULL AS "${field}"`
            )
            .join(', ');

        const whereSql: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (columns.has('company_id')) {
            whereSql.push(`candidate."company_id" = $${idx++}`);
            params.push(companyId);
        }

        if (candidate_status && columns.has('candidate_status')) {
            whereSql.push(`candidate."candidate_status" = $${idx++}`);
            params.push(candidate_status);
        }

        if (source_id && columns.has('source_id')) {
            whereSql.push(`candidate."source_id" = $${idx++}`);
            params.push(source_id);
        }

        if (recruiter_id && columns.has('recruiter_id')) {
            whereSql.push(`candidate."recruiter_id" = $${idx++}`);
            params.push(recruiter_id);
        }

        if (search) {
            const searchable = ['candidate_name', 'email', 'phone'].filter((f) => columns.has(f));
            if (searchable.length > 0) {
                const parts = searchable.map((f) => `candidate."${f}" ILIKE $${idx}`).join(' OR ');
                whereSql.push(`(${parts})`);
                params.push(`%${search}%`);
                idx += 1;
            }
        }

        if (date_from && date_to && columns.has('created_at')) {
            whereSql.push(`candidate."created_at" BETWEEN $${idx++} AND $${idx++}`);
            params.push(date_from, date_to);
        } else if (date_from && columns.has('created_at')) {
            whereSql.push(`candidate."created_at" >= $${idx++}`);
            params.push(date_from);
        } else if (date_to && columns.has('created_at')) {
            whereSql.push(`candidate."created_at" <= $${idx++}`);
            params.push(date_to);
        }

        const whereClause = whereSql.length > 0 ? `WHERE ${whereSql.join(' AND ')}` : '';
        const sortable = ['created_at', 'updated_at', 'candidate_name', 'email'];
        const safeSortBy = sortable.includes(sort_by) && columns.has(sort_by) ? sort_by : 'created_at';
        const safeSortOrder = sort_order === 'ASC' ? 'ASC' : 'DESC';

        const countSql = `SELECT COUNT(*)::int AS total FROM candidates candidate ${whereClause}`;
        const countRows = await this.candidateRepository.query(countSql, params);
        const total = Number(countRows?.[0]?.total || 0);

        const dataSql = `
            SELECT ${selectSql}
            FROM candidates candidate
            ${whereClause}
            ORDER BY candidate."${safeSortBy}" ${safeSortOrder}
            OFFSET ${skip}
            LIMIT ${limit}
        `;
        const data = await this.candidateRepository.query(dataSql, params);

        return {
            data,
            total,
            page,
            limit,
        };
    }

    /**
     * Get one candidate by ID (tenant-scoped)
     */
    async findOne(id: string, companyId: string): Promise<CandidateResponseDto> {
        const candidate = await this.candidateRepository.findOne({
            where: {
                id,
                company_id: companyId,
            },
            relations: ['skills', 'education', 'experience', 'documents', 'addresses', 'history', 'attachments'],
        });

        if (!candidate) {
            throw new NotFoundException('Candidate not found or you do not have access to this candidate');
        }

        return candidate;
    }

    /**
     * Update candidate (tenant-scoped)
     */
    async update(
        id: string,
        updateCandidateDto: UpdateCandidateDto,
        companyId: string,
        userId: string,
    ): Promise<CandidateResponseDto> {
        const candidate = await this.candidateRepository.findOne({
            where: {
                id,
                company_id: companyId,
            },
        });

        if (!candidate) {
            throw new NotFoundException('Candidate not found or you do not have access to this candidate');
        }

        // Check for duplicate email if changing email
        if (updateCandidateDto.email && updateCandidateDto.email !== candidate.email) {
            const existing = await this.candidateRepository.findOne({
                where: {
                    company_id: companyId,
                    email: updateCandidateDto.email,
                },
            });

            if (existing) {
                throw new BadRequestException('Candidate with this email already exists in your company');
            }
        }

        // Update
        Object.assign(candidate, updateCandidateDto);
        candidate.updated_by = userId;

        const updated = await this.candidateRepository.save(candidate);
        return updated;
    }

    /**
     * Delete candidate (tenant-scoped, soft delete)
     */
    async remove(id: string, companyId: string): Promise<void> {
        const candidate = await this.candidateRepository.findOne({
            where: {
                id,
                company_id: companyId,
            },
        });

        if (!candidate) {
            throw new NotFoundException('Candidate not found or you do not have access to this candidate');
        }

        // Soft delete by setting status to Inactive
        candidate.candidate_status = 'Inactive';
        await this.candidateRepository.save(candidate);
    }

    /**
     * Hard delete candidate (tenant-scoped, admin only)
     */
    async hardDelete(id: string, companyId: string): Promise<void> {
        const candidate = await this.candidateRepository.findOne({
            where: {
                id,
                company_id: companyId,
            },
        });

        if (!candidate) {
            throw new NotFoundException('Candidate not found or you do not have access to this candidate');
        }

        await this.candidateRepository.remove(candidate);
    }

    /**
     * Get candidate statistics (tenant-scoped)
     */
    async getStats(companyId: string): Promise<any> {
        const total = await this.candidateRepository.count({
            where: { company_id: companyId },
        });

        const active = await this.candidateRepository.count({
            where: { company_id: companyId, candidate_status: 'Active' },
        });

        const inactive = await this.candidateRepository.count({
            where: { company_id: companyId, candidate_status: 'Inactive' },
        });

        const submitted = await this.candidateRepository
            .createQueryBuilder('candidate')
            .where('candidate.company_id = :companyId', { companyId })
            .andWhere('candidate.last_submission_date IS NOT NULL')
            .getCount();

        return {
            total,
            active,
            inactive,
            submitted,
        };
    }

    /**
     * Search candidates by skill set (tenant-scoped)
     */
    async searchBySkills(companyId: string, skills: string): Promise<CandidateResponseDto[]> {
        return this.candidateRepository
            .createQueryBuilder('candidate')
            .where('candidate.company_id = :companyId', { companyId })
            .andWhere('candidate.skill_set ILIKE :skills', { skills: `%${skills}%` })
            .andWhere('candidate.candidate_status = :status', { status: 'Active' })
            .getMany();
    }

    /**
     * Advanced search with full-text, filters, and custom fields (tenant-scoped)
     */
    async advancedSearch(
        companyId: string,
        searchDto: AdvancedCandidateSearchDto,
    ): Promise<AdvancedCandidateSearchResponseDto> {
        const { page = 1, limit = 20, q, status, recruiter_id, archived, filters, sort_by = 'created_at', sort_order = 'DESC', custom_fields } = searchDto;
        const skip = (page - 1) * limit;

        const queryBuilder = this.candidateRepository
            .createQueryBuilder('candidate')
            .where('candidate.company_id = :companyId', { companyId });

        // Apply full-text search
        if (q) {
            const searchTerm = `%${q}%`;
            queryBuilder.andWhere(
                '(candidate.candidate_name ILIKE :q OR candidate.email ILIKE :q OR candidate.phone ILIKE :q OR candidate.skill_set ILIKE :q)',
                { q: searchTerm }
            );
        }

        // Apply simple filters
        if (status) {
            queryBuilder.andWhere('candidate.candidate_status = :status', { status });
        }

        if (recruiter_id) {
            queryBuilder.andWhere('candidate.recruiter_id = :recruiterId', { recruiterId: recruiter_id });
        }

        if (archived !== undefined) {
            if (archived) {
                queryBuilder.andWhere('candidate.candidate_status = :archivedStatus', { archivedStatus: 'Inactive' });
            } else {
                queryBuilder.andWhere('candidate.candidate_status != :archivedStatus', { archivedStatus: 'Inactive' });
            }
        }

        // Apply advanced filters
        if (filters && Array.isArray(filters)) {
            filters.forEach((filter: SearchFilter, index: number) => {
                this.applySearchFilter(queryBuilder, filter, index, companyId);
            });
        }

        // Apply custom field filters
        if (custom_fields && Object.keys(custom_fields).length > 0) {
            Object.entries(custom_fields).forEach(([fieldName, value], index) => {
                const paramName = `custom_${index}`;
                queryBuilder.andWhere(`candidate.custom_fields->>'${fieldName}' ILIKE :${paramName}`, {
                    [paramName]: `%${value}%`,
                });
            });
        }

        // Apply sorting
        const validSortFields = ['created_at', 'updated_at', 'candidate_name', 'email'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
        queryBuilder.orderBy(`candidate.${sortField}`, sort_order);

        // Get total count (before pagination)
        const total = await queryBuilder.getCount();

        // Get paginated results
        const data = await queryBuilder.skip(skip).take(limit).getMany();

        const pages = Math.ceil(total / limit);

        return {
            data,
            total,
            page,
            limit,
            pages,
        };
    }

    /**
     * Apply individual search filter to query builder
     */
    private applySearchFilter(queryBuilder: any, filter: SearchFilter, index: number, companyId: string): void {
        const paramName = `filter_${index}`;
        const field = filter.field;

        // Validate field to prevent injection
        const allowedFields = ['candidate_name', 'email', 'phone', 'skill_set', 'candidate_status', 'recruiter_id', 'created_at'];
        if (!allowedFields.includes(field)) {
            return;
        }

        const op = filter.operator;

        switch (op) {
            case SearchOperator.EQUALS:
                queryBuilder.andWhere(`candidate.${field} = :${paramName}`, { [paramName]: filter.value });
                break;
            case SearchOperator.NOT_EQUALS:
                queryBuilder.andWhere(`candidate.${field} != :${paramName}`, { [paramName]: filter.value });
                break;
            case SearchOperator.CONTAINS:
                queryBuilder.andWhere(`candidate.${field} ILIKE :${paramName}`, { [paramName]: `%${filter.value}%` });
                break;
            case SearchOperator.NOT_CONTAINS:
                queryBuilder.andWhere(`candidate.${field} NOT ILIKE :${paramName}`, { [paramName]: `%${filter.value}%` });
                break;
            case SearchOperator.STARTS_WITH:
                queryBuilder.andWhere(`candidate.${field} ILIKE :${paramName}`, { [paramName]: `${filter.value}%` });
                break;
            case SearchOperator.ENDS_WITH:
                queryBuilder.andWhere(`candidate.${field} ILIKE :${paramName}`, { [paramName]: `%${filter.value}` });
                break;
            case SearchOperator.GREATER_THAN:
                queryBuilder.andWhere(`candidate.${field} > :${paramName}`, { [paramName]: filter.value });
                break;
            case SearchOperator.LESS_THAN:
                queryBuilder.andWhere(`candidate.${field} < :${paramName}`, { [paramName]: filter.value });
                break;
            case SearchOperator.GREATER_OR_EQUAL:
                queryBuilder.andWhere(`candidate.${field} >= :${paramName}`, { [paramName]: filter.value });
                break;
            case SearchOperator.LESS_OR_EQUAL:
                queryBuilder.andWhere(`candidate.${field} <= :${paramName}`, { [paramName]: filter.value });
                break;
            case SearchOperator.IN:
                if (Array.isArray(filter.value)) {
                    queryBuilder.andWhere(`candidate.${field} IN (:...${paramName})`, { [paramName]: filter.value });
                }
                break;
            case SearchOperator.NOT_IN:
                if (Array.isArray(filter.value)) {
                    queryBuilder.andWhere(`candidate.${field} NOT IN (:...${paramName})`, { [paramName]: filter.value });
                }
                break;
            case SearchOperator.EXISTS:
                queryBuilder.andWhere(`candidate.${field} IS NOT NULL`);
                break;
        }
    }

    /**
     * Bulk import candidates from array
     */
    async bulkImport(
        bulkImportDto: BulkImportCandidateDto,
        companyId: string,
        userId: string,
    ): Promise<BulkImportResultDto> {
        const { candidates, skip_duplicates, assign_to_recruiter_id } = bulkImportDto;

        const result: BulkImportResultDto = {
            total: candidates.length,
            success: 0,
            failed: 0,
            skipped: 0,
            errors: [],
            imported_ids: [],
        };

        // Check for duplicate emails within the import batch
        const emailsInBatch = candidates.map(c => c.email.toLowerCase());
        const duplicatesInBatch = emailsInBatch.filter((email, index) => emailsInBatch.indexOf(email) !== index);

        if (duplicatesInBatch.length > 0 && !skip_duplicates) {
            throw new BadRequestException(
                `Duplicate emails found in import batch: ${[...new Set(duplicatesInBatch)].join(', ')}`
            );
        }

        // Check for existing emails in database
        const existingCandidates = await this.candidateRepository.find({
            where: {
                company_id: companyId,
                email: In(emailsInBatch),
            },
            select: ['email'],
        });

        const existingEmails = new Set(existingCandidates.map(c => c.email.toLowerCase()));

        // Process each candidate
        for (let i = 0; i < candidates.length; i++) {
            const candidateData = candidates[i];
            const rowNumber = i + 1;

            try {
                // Skip if duplicate email in batch (only keep first occurrence)
                const firstOccurrenceIndex = emailsInBatch.indexOf(candidateData.email.toLowerCase());
                if (firstOccurrenceIndex !== i) {
                    result.skipped++;
                    result.errors.push({
                        row: rowNumber,
                        email: candidateData.email,
                        error: 'Duplicate email in import batch',
                    });
                    continue;
                }

                // Skip if email exists in database
                if (existingEmails.has(candidateData.email.toLowerCase())) {
                    if (skip_duplicates) {
                        result.skipped++;
                        result.errors.push({
                            row: rowNumber,
                            email: candidateData.email,
                            error: 'Email already exists (skipped)',
                        });
                        continue;
                    } else {
                        result.failed++;
                        result.errors.push({
                            row: rowNumber,
                            email: candidateData.email,
                            error: 'Email already exists',
                        });
                        continue;
                    }
                }

                // Create candidate
                const candidate = this.candidateRepository.create({
                    ...candidateData,
                    company_id: companyId,
                    created_by: userId,
                    updated_by: userId,
                    recruiter_id: assign_to_recruiter_id || candidateData.recruiter_id,
                });

                const saved = await this.candidateRepository.save(candidate);
                result.success++;
                result.imported_ids.push(saved.id);

            } catch (error) {
                result.failed++;
                result.errors.push({
                    row: rowNumber,
                    email: candidateData.email,
                    name: candidateData.candidate_name,
                    error: error.message || 'Failed to import candidate',
                });
            }
        }

        return result;
    }

    /**
     * Bulk update candidates
     */
    async bulkUpdate(
        bulkUpdateDto: BulkUpdateCandidateDto,
        companyId: string,
        userId: string,
    ): Promise<BulkUpdateResultDto> {
        const { candidate_ids, candidate_status, recruiter_id, add_notes } = bulkUpdateDto;

        const result: BulkUpdateResultDto = {
            total: candidate_ids.length,
            success: 0,
            failed: 0,
            errors: [],
            updated_ids: [],
        };

        // Fetch all candidates at once for validation
        const candidates = await this.candidateRepository.find({
            where: {
                id: In(candidate_ids),
                company_id: companyId,
            },
        });

        const foundIds = new Set(candidates.map(c => c.id));
        const notFoundIds = candidate_ids.filter(id => !foundIds.has(id));

        // Track not found candidates as errors
        notFoundIds.forEach(id => {
            result.failed++;
            result.errors.push({
                candidate_id: id,
                error: 'Candidate not found or does not belong to your company',
            });
        });

        // Update each candidate
        for (const candidate of candidates) {
            try {
                // Update status
                if (candidate_status !== undefined) {
                    candidate.candidate_status = candidate_status;
                }

                // Update recruiter
                if (recruiter_id !== undefined) {
                    candidate.recruiter_id = recruiter_id;
                }

                // Append notes
                if (add_notes) {
                    const timestamp = new Date().toISOString();
                    const noteEntry = `\n\n[${timestamp}] ${add_notes}`;
                    candidate.notes = (candidate.notes || '') + noteEntry;
                }

                // Update metadata
                candidate.updated_by = userId;

                await this.candidateRepository.save(candidate);
                result.success++;
                result.updated_ids.push(candidate.id);

            } catch (error) {
                result.failed++;
                result.errors.push({
                    candidate_id: candidate.id,
                    error: error.message || 'Failed to update candidate',
                });
            }
        }

        return result;
    }
}
