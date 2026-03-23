import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Job } from '../jobs/entities/job.entity';
import { Candidate } from '../../candidate/entities/candidate.entity';
import { Submission } from '../submissions/entities/submission.entity';
import {
    computeMatchScore,
    jobKeywordTokens,
    jobRequiredTokens,
    matchQualityLabel,
} from './matching-scoring.util';

export interface JobMatchSuggestionDto {
    candidate_id: string;
    candidate_name: string;
    email: string;
    total_score: number;
    skills_score: number;
    experience_score: number;
    location_score: number;
    keyword_score: number;
    quality: string;
    already_submitted: boolean;
}

@Injectable()
export class MatchingService {
    constructor(
        @InjectRepository(Job)
        private readonly jobRepo: Repository<Job>,
        @InjectRepository(Candidate)
        private readonly candidateRepo: Repository<Candidate>,
        @InjectRepository(Submission)
        private readonly submissionRepo: Repository<Submission>,
    ) {}

    async suggestCandidatesForJob(
        companyId: string,
        jobId: string,
        opts: { limit?: number; minScore?: number; poolSize?: number; excludeSubmitted?: boolean },
    ): Promise<{ job_id: string; suggestions: JobMatchSuggestionDto[] }> {
        const limit = Math.min(100, Math.max(1, opts.limit ?? 25));
        const minScore = Math.min(100, Math.max(0, opts.minScore ?? 0));
        const poolSize = Math.min(500, Math.max(50, opts.poolSize ?? 250));
        const excludeSubmitted = opts.excludeSubmitted !== false;

        const job = await this.jobRepo.findOne({
            where: { id: jobId, company_id: companyId } as any,
        });
        if (!job) {
            throw new NotFoundException('Job not found');
        }

        const requiredSkillTokens = jobRequiredTokens({
            requiredSkills: job.required_skills as string[] | undefined,
            requirements: job.requirements,
        });
        const keywordTokens = jobKeywordTokens({
            title: job.title,
            description: job.description,
            domainIndustry: job.domain_industry,
            department: job.department,
        });

        let submittedIds = new Set<string>();
        if (excludeSubmitted) {
            const rows = await this.submissionRepo.find({
                where: { job_id: jobId, company_id: companyId } as any,
                select: ['candidate_id'],
            });
            submittedIds = new Set(rows.map((r) => r.candidate_id));
        }

        const candidates = await this.candidateRepo.find({
            where: { company_id: companyId },
            order: { updated_at: 'DESC' },
            take: poolSize,
        });

        const suggestions: JobMatchSuggestionDto[] = [];

        for (const c of candidates) {
            const breakdown = computeMatchScore({
                requiredSkillTokens,
                keywordTokens,
                yearsRequired: job.years_required != null ? Number(job.years_required) : null,
                candidateSkillSet: c.skill_set,
                candidateTotalExperience: c.total_experience != null ? Number(c.total_experience) : null,
                jobLocation: job.location,
                workLocations: job.work_locations as string[] | undefined,
                candidateLocationText: `${c.job_location || ''} ${c.location_preference || ''}`,
                candidateName: c.candidate_name,
                candidateCompany: c.current_company,
            });

            if (breakdown.total < minScore) continue;

            suggestions.push({
                candidate_id: c.id,
                candidate_name: c.candidate_name,
                email: c.email,
                total_score: breakdown.total,
                skills_score: breakdown.skills,
                experience_score: breakdown.experience,
                location_score: breakdown.location,
                keyword_score: breakdown.keywords,
                quality: matchQualityLabel(breakdown.total),
                already_submitted: submittedIds.has(c.id),
            });
        }

        suggestions.sort((a, b) => b.total_score - a.total_score);
        return {
            job_id: jobId,
            suggestions: suggestions.slice(0, limit),
        };
    }

    /**
     * Batch scores for known candidate UUIDs (e.g. submission enrichment).
     */
    async scoreCandidatesForJob(
        companyId: string,
        jobId: string,
        candidateIds: string[],
    ): Promise<Map<string, JobMatchSuggestionDto>> {
        const unique = [...new Set(candidateIds)].filter(Boolean).slice(0, 200);
        const out = new Map<string, JobMatchSuggestionDto>();

        if (!unique.length) return out;

        const job = await this.jobRepo.findOne({
            where: { id: jobId, company_id: companyId } as any,
        });
        if (!job) return out;

        const requiredSkillTokens = jobRequiredTokens({
            requiredSkills: job.required_skills as string[] | undefined,
            requirements: job.requirements,
        });
        const keywordTokens = jobKeywordTokens({
            title: job.title,
            description: job.description,
            domainIndustry: job.domain_industry,
            department: job.department,
        });

        const rows = await this.candidateRepo.find({
            where: { company_id: companyId, id: In(unique) },
        });

        const submitted = await this.submissionRepo.find({
            where: { job_id: jobId, company_id: companyId, candidate_id: In(unique) } as any,
            select: ['candidate_id'],
        });
        const submittedSet = new Set(submitted.map((s) => s.candidate_id));

        for (const c of rows) {
            const breakdown = computeMatchScore({
                requiredSkillTokens,
                keywordTokens,
                yearsRequired: job.years_required != null ? Number(job.years_required) : null,
                candidateSkillSet: c.skill_set,
                candidateTotalExperience: c.total_experience != null ? Number(c.total_experience) : null,
                jobLocation: job.location,
                workLocations: job.work_locations as string[] | undefined,
                candidateLocationText: `${c.job_location || ''} ${c.location_preference || ''}`,
                candidateName: c.candidate_name,
                candidateCompany: c.current_company,
            });
            out.set(c.id, {
                candidate_id: c.id,
                candidate_name: c.candidate_name,
                email: c.email,
                total_score: breakdown.total,
                skills_score: breakdown.skills,
                experience_score: breakdown.experience,
                location_score: breakdown.location,
                keyword_score: breakdown.keywords,
                quality: matchQualityLabel(breakdown.total),
                already_submitted: submittedSet.has(c.id),
            });
        }

        return out;
    }
}
