import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../../modules/clients/entities/client.entity';
import { Job } from '../../modules/jobs/entities/job.entity';
import { Candidate } from '../../candidate/entities/candidate.entity';
import { Submission } from '../../modules/submissions/entities/submission.entity';

const LIMIT_PER_ENTITY = 10;

export interface GlobalSearchResult {
    type: 'client' | 'job' | 'candidate' | 'submission';
    id: string;
    name: string;
}

/**
 * Global search across clients, jobs, candidates, and submissions.
 * Tenant-isolated by company_id. Uses simple ILIKE queries; designed so that
 * PostgreSQL full-text search, ElasticSearch, or Meilisearch can be plugged in later.
 */
@Injectable()
export class SearchService {
    constructor(
        @InjectRepository(Client)
        private readonly clientRepo: Repository<Client>,
        @InjectRepository(Job)
        private readonly jobRepo: Repository<Job>,
        @InjectRepository(Candidate)
        private readonly candidateRepo: Repository<Candidate>,
        @InjectRepository(Submission)
        private readonly submissionRepo: Repository<Submission>,
    ) {}

    /**
     * Search across all entity types. company_id must be from tenant context only.
     */
    async globalSearch(companyId: string, query: string): Promise<GlobalSearchResult[]> {
        const term = (query || '').trim();
        if (!term) {
            return [];
        }

        const pattern = `%${this.escapeLike(term)}%`;

        const [clients, jobs, candidates, submissions] = await Promise.all([
            this.searchClients(companyId, pattern),
            this.searchJobs(companyId, pattern),
            this.searchCandidates(companyId, pattern),
            this.searchSubmissions(companyId, pattern),
        ]);

        const results: GlobalSearchResult[] = [
            ...clients.map((c) => ({ type: 'client' as const, id: c.id, name: c.name })),
            ...jobs.map((j) => ({ type: 'job' as const, id: j.id, name: j.title })),
            ...candidates.map((c) => ({
                type: 'candidate' as const,
                id: String(c.id),
                name: c.candidate_name,
            })),
            ...submissions.map((s) => ({
                type: 'submission' as const,
                id: s.id,
                name: s.displayName,
            })),
        ];

        return results;
    }

    private async searchClients(companyId: string, pattern: string): Promise<Client[]> {
        return this.clientRepo
            .createQueryBuilder('c')
            .select(['c.id', 'c.name'])
            .where('c.company_id = :companyId', { companyId })
            .andWhere('(c.deleted_at IS NULL)')
            .andWhere('(c.name ILIKE :pattern OR c.contact_person ILIKE :pattern OR c.email ILIKE :pattern)', {
                pattern,
            })
            .orderBy('c.name')
            .limit(LIMIT_PER_ENTITY)
            .getMany();
    }

    private async searchJobs(companyId: string, pattern: string): Promise<Job[]> {
        return this.jobRepo
            .createQueryBuilder('j')
            .select(['j.id', 'j.title'])
            .where('j.company_id = :companyId', { companyId })
            .andWhere('(j.deleted_at IS NULL)')
            .andWhere('(j.title ILIKE :pattern OR j.job_code ILIKE :pattern)', { pattern })
            .orderBy('j.title')
            .limit(LIMIT_PER_ENTITY)
            .getMany();
    }

    /**
     * Candidates are scoped by company via submissions: only candidates who have a submission in this company.
     */
    private async searchCandidates(companyId: string, pattern: string): Promise<Candidate[]> {
        return this.candidateRepo
            .createQueryBuilder('c')
            .select(['c.id', 'c.candidate_name'])
            .innerJoin('submissions', 's', 's.candidate_id = c.id AND s.company_id = :companyId AND s.deleted_at IS NULL', {
                companyId,
            })
            .where('(c.candidate_name ILIKE :pattern OR c.email ILIKE :pattern)', { pattern })
            .orderBy('c.candidate_name')
            .limit(LIMIT_PER_ENTITY)
            .getMany();
    }

    /**
     * Submissions: match on candidate name or job title; return display name "Candidate → Job".
     */
    private async searchSubmissions(
        companyId: string,
        pattern: string,
    ): Promise<Array<{ id: string; displayName: string }>> {
        const rows = await this.submissionRepo
            .createQueryBuilder('s')
            .select(['s.id', 'c.candidate_name', 'j.title'])
            .leftJoin('s.candidate', 'c')
            .leftJoin(Job, 'j', 'j.id = s.job_id')
            .where('s.company_id = :companyId', { companyId })
            .andWhere('(s.deleted_at IS NULL)')
            .andWhere('(c.candidate_name ILIKE :pattern OR j.title ILIKE :pattern)', { pattern })
            .orderBy('s.created_at', 'DESC')
            .limit(LIMIT_PER_ENTITY)
            .getRawMany();

        return rows.map((r) => ({
            id: r.s_id,
            displayName: `${r.c_candidate_name || 'Unknown'} → ${r.j_title || 'Unknown'}`,
        }));
    }

    /** Escape % and _ for safe use in LIKE/ILIKE. */
    private escapeLike(value: string): string {
        return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    }
}
