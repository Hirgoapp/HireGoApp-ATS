import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Submission, SubmissionStatus } from '../entities/submission.entity';

@Injectable()
export class SubmissionRepository {
    constructor(
        @InjectRepository(Submission)
        private readonly repository: Repository<Submission>,
    ) { }

    async create(submission: Partial<Submission>): Promise<Submission> {
        const entity = this.repository.create(submission);
        return this.repository.save(entity);
    }

    async findById(id: string, companyId: string): Promise<Submission | null> {
        return this.repository.findOne({
            where: {
                id,
                company_id: companyId,
                deleted_at: IsNull(),
            },
        });
    }

    async findByJobAndCandidate(
        jobId: string,
        candidateId: string,
        companyId: string,
    ): Promise<Submission | null> {
        return this.repository.findOne({
            where: {
                job_id: jobId,
                candidate_id: candidateId,
                company_id: companyId,
                deleted_at: IsNull(),
            },
        });
    }

    async findByJobId(
        jobId: string,
        companyId: string,
        skip: number = 0,
        take: number = 20,
        status?: string,
        includeCandidate = false,
        includeJob = false,
    ): Promise<{ data: Submission[]; total: number }> {
        const where: any = {
            job_id: jobId,
            company_id: companyId,
            deleted_at: IsNull(),
        };

        if (status) {
            where.status = status;
        }

        const relations = this.mergeSubmissionRelations(includeCandidate, includeJob);

        const [data, total] = await this.repository.findAndCount({
            where,
            order: { created_at: 'DESC' },
            skip,
            take,
            relations,
        });

        return { data, total };
    }

    async findByCandidateId(
        candidateId: string,
        companyId: string,
        skip: number = 0,
        take: number = 20,
        status?: string,
        includeJob = false,
        includeCandidate = false,
    ): Promise<{ data: Submission[]; total: number }> {
        const where: any = {
            candidate_id: candidateId,
            company_id: companyId,
            deleted_at: IsNull(),
        };

        if (status) {
            where.status = status;
        }

        const relations = this.mergeSubmissionRelations(includeCandidate, includeJob);

        const [data, total] = await this.repository.findAndCount({
            where,
            order: { created_at: 'DESC' },
            skip,
            take,
            relations,
        });

        return { data, total };
    }

    async findAll(
        companyId: string,
        skip: number = 0,
        take: number = 20,
        filters?: {
            status?: string;
            job_id?: string;
            candidate_id?: string;
            include_candidate?: boolean;
            include_job?: boolean;
        },
    ): Promise<{ data: Submission[]; total: number }> {
        const where: any = {
            company_id: companyId,
            deleted_at: IsNull(),
        };

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.job_id) {
            where.job_id = filters.job_id;
        }

        if (filters?.candidate_id) {
            where.candidate_id = filters.candidate_id;
        }

        const relations = this.mergeSubmissionRelations(
            !!filters?.include_candidate,
            !!filters?.include_job,
        );

        const [data, total] = await this.repository.findAndCount({
            where,
            order: { created_at: 'DESC' },
            skip,
            take,
            relations,
        });

        return { data, total };
    }

    async countByStatus(
        companyId: string,
        stage: SubmissionStatus,
    ): Promise<number> {
        return this.repository.count({
            where: {
                company_id: companyId,
                status: stage,
                deleted_at: IsNull(),
            },
        });
    }

    async countByJobAndStatus(
        jobId: string,
        companyId: string,
        stage: SubmissionStatus,
    ): Promise<number> {
        return this.repository.count({
            where: {
                job_id: jobId,
                company_id: companyId,
                status: stage,
                deleted_at: IsNull(),
            },
        });
    }

    async update(id: string, companyId: string, data: Partial<Submission>): Promise<Submission | null> {
        await this.repository.update(
            {
                id,
                company_id: companyId,
                deleted_at: IsNull(),
            },
            data,
        );

        return this.findById(id, companyId);
    }

    async softDelete(id: string, companyId: string): Promise<boolean> {
        const result = await this.repository.update(
            {
                id,
                company_id: companyId,
                deleted_at: IsNull(),
            },
            {
                deleted_at: new Date(),
            },
        );

        return result.affected > 0;
    }

    async getStatusCounts(companyId: string, jobId?: string): Promise<Record<SubmissionStatus, number>> {
        const qb = this.repository
            .createQueryBuilder('s')
            .select('s.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .where('s.company_id = :companyId', { companyId })
            .andWhere('s.deleted_at IS NULL');

        if (jobId) {
            qb.andWhere('s.job_id = :jobId', { jobId });
        }

        const rows: { status: SubmissionStatus; count: string }[] = await qb
            .groupBy('s.status')
            .getRawMany();

        const counts: Record<SubmissionStatus, number> = {} as any;
        for (const s of Object.values(SubmissionStatus) as SubmissionStatus[]) {
            counts[s] = 0;
        }
        for (const row of rows) {
            counts[row.status] = parseInt(row.count, 10);
        }
        return counts;
    }

    private mergeSubmissionRelations(includeCandidate: boolean, includeJob: boolean): string[] {
        const rels: string[] = [];
        if (includeCandidate) rels.push('candidate');
        if (includeJob) rels.push('job');
        return rels;
    }
}
