import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between } from 'typeorm';
import { Candidate } from '../../candidate/entities/candidate.entity';
import { Job, JobStatus } from '../../jobs/entities/job.entity';
import { Submission, SubmissionOutcome } from '../../submissions/entities/submission.entity';
import { Interview } from '../../interviews/entities/interview.entity';
import { Offer, OfferStatus } from '../../offers/entities/offer.entity';
import {
    PipelineFunnelDto,
    PipelineFunnelStage,
    JobCandidateStatusReportDto,
    JobCandidateStatus,
    RecruiterActivitySummaryDto,
    RecruiterMetrics,
    InterviewMetricsDto,
    InterviewRound,
    OfferMetricsDto,
    JobPerformanceReportDto,
    JobPerformanceMetrics,
    DashboardSummaryDto,
    DateRangeAnalyticsDto,
} from '../dtos/report.dto';

/**
 * Report service for analytics queries
 * All methods are read-only and tenant-aware (company_id filtered)
 * Queries are optimized for performance with aggregations and indices
 */
@Injectable()
export class ReportService {
    constructor(
        @InjectRepository(Candidate)
        private candidateRepository: Repository<Candidate>,
        @InjectRepository(Job)
        private jobRepository: Repository<Job>,
        @InjectRepository(Submission)
        private submissionRepository: Repository<Submission>,
        @InjectRepository(Interview)
        private interviewRepository: Repository<Interview>,
        @InjectRepository(Offer)
        private offerRepository: Repository<Offer>,
    ) { }

    /**
     * Get pipeline funnel report
     * Shows candidate progression through hiring stages
     */
    async getPipelineFunnel(companyId: string): Promise<PipelineFunnelDto> {
        // Aggregate by current stage using snake_case columns
        const submissions = await this.submissionRepository
            .createQueryBuilder('submission')
            .select('submission.current_stage', 'stage')
            .addSelect('COUNT(*)', 'count')
            .where('submission.company_id = :companyId', { companyId })
            .andWhere('submission.deleted_at IS NULL')
            .groupBy('submission.current_stage')
            .getRawMany();

        // Map submission current_stage to funnel buckets
        const stageMap: Record<string, string> = {
            applied: 'sourced',
            shortlisted: 'shortlisted',
            screening: 'shortlisted',
            interview: 'interviewed',
            interview_scheduled: 'interviewed',
            interview_completed: 'interviewed',
            offer: 'offered',
            offer_extended: 'offered',
        };

        const stageCounts: Record<string, number> = {
            sourced: 0,
            shortlisted: 0,
            interviewed: 0,
            offered: 0,
            joined: 0,
        };

        submissions.forEach(row => {
            const stage = stageMap[row.stage] || 'sourced';
            const count = parseInt(row.count, 10);
            stageCounts[stage] += count;
        });

        // Joined comes from outcome column (final hires)
        stageCounts.joined = await this.submissionRepository.count({
            where: { company_id: companyId, outcome: SubmissionOutcome.JOINED, deleted_at: IsNull() },
        });

        const totalCandidates = stageCounts.sourced + stageCounts.shortlisted + stageCounts.interviewed + stageCounts.offered;

        // Calculate stages with percentages
        const stages: PipelineFunnelStage[] = [
            {
                stage: 'sourced',
                count: stageCounts.sourced,
                percentage: stageCounts.sourced ? 100 : 0,
            },
            {
                stage: 'shortlisted',
                count: stageCounts.shortlisted,
                percentage: stageCounts.sourced ? Math.round((stageCounts.shortlisted / stageCounts.sourced) * 100) : 0,
                dropoff: Math.max(0, stageCounts.sourced - stageCounts.shortlisted),
            },
            {
                stage: 'interviewed',
                count: stageCounts.interviewed,
                percentage: stageCounts.shortlisted ? Math.round((stageCounts.interviewed / stageCounts.shortlisted) * 100) : 0,
                dropoff: Math.max(0, stageCounts.shortlisted - stageCounts.interviewed),
            },
            {
                stage: 'offered',
                count: stageCounts.offered,
                percentage: stageCounts.interviewed ? Math.round((stageCounts.offered / stageCounts.interviewed) * 100) : 0,
                dropoff: Math.max(0, stageCounts.interviewed - stageCounts.offered),
            },
            {
                stage: 'joined',
                count: stageCounts.joined,
                percentage: stageCounts.offered ? Math.round((stageCounts.joined / stageCounts.offered) * 100) : 0,
                dropoff: Math.max(0, stageCounts.offered - stageCounts.joined),
            },
        ];

        // Calculate conversion rate
        const conversionRate = stageCounts.sourced ? Math.round((stageCounts.joined / stageCounts.sourced) * 100) : 0;

        // Calculate average days to hire (from sourced to joined)
        const avgDaysResult = await this.submissionRepository
            .createQueryBuilder('submission')
            .select(
                'AVG(EXTRACT(EPOCH FROM (submission.updated_at - submission.created_at)) / 86400)',
                'avgDays',
            )
            .where('submission.company_id = :companyId', { companyId })
            .andWhere('submission.outcome = :outcome', { outcome: SubmissionOutcome.JOINED })
            .andWhere('submission.deleted_at IS NULL')
            .getRawOne();

        const averageDaysToHire = avgDaysResult?.avgDays ? Math.round(parseFloat(avgDaysResult.avgDays)) : 0;

        return {
            totalCandidates,
            stages,
            conversionRate,
            averageDaysToHire,
            reportDate: new Date(),
        };
    }

    /**
     * Get job-wise candidate status report
     * Breakdown of candidates by job and status
     */
    async getJobCandidateStatus(companyId: string): Promise<JobCandidateStatusReportDto> {
        const jobs = await this.jobRepository.find({
            where: { company_id: companyId, deleted_at: IsNull() },
            select: ['id', 'title', 'status', 'created_at'],
        });

        if (jobs.length === 0) {
            return {
                companyId,
                totalJobs: 0,
                totalCandidates: 0,
                jobsWithCandidates: [],
                topPerformingJobs: [],
                reportDate: new Date(),
            };
        }

        // Fetch stage counts for all jobs in a single aggregated query
        const stageCounts: { jobId: string; stage: string; count: string }[] =
            await this.submissionRepository
                .createQueryBuilder('submission')
                .select('submission.job_id', 'jobId')
                .addSelect('submission.current_stage', 'stage')
                .addSelect('COUNT(*)', 'count')
                .where('submission.company_id = :companyId', { companyId })
                .andWhere('submission.deleted_at IS NULL')
                .groupBy('submission.job_id')
                .addGroupBy('submission.current_stage')
                .getRawMany();

        // Fetch joined (accepted) counts for all jobs in a single aggregated query
        const acceptedCounts: { jobId: string; count: string }[] =
            await this.submissionRepository
                .createQueryBuilder('submission')
                .select('submission.job_id', 'jobId')
                .addSelect('COUNT(*)', 'count')
                .where('submission.company_id = :companyId', { companyId })
                .andWhere('submission.outcome = :outcome', { outcome: SubmissionOutcome.JOINED })
                .andWhere('submission.deleted_at IS NULL')
                .groupBy('submission.job_id')
                .getRawMany();

        // Build lookup maps from the aggregated results
        const stageCountsByJob = new Map<string, Record<string, number>>();
        for (const row of stageCounts) {
            if (!stageCountsByJob.has(row.jobId)) {
                stageCountsByJob.set(row.jobId, {});
            }
            stageCountsByJob.get(row.jobId)[row.stage] = parseInt(row.count, 10);
        }

        const acceptedByJob = new Map<string, number>(
            acceptedCounts.map(row => [row.jobId, parseInt(row.count, 10)]),
        );

        const jobStatuses: JobCandidateStatus[] = [];

        for (const job of jobs) {
            const stageMap = stageCountsByJob.get(job.id) ?? {};

            const statusMap: Record<string, number> = {
                sourced: 0,
                shortlisted: 0,
                interviewed: 0,
                offered: 0,
                accepted: acceptedByJob.get(job.id) ?? 0,
                rejected: 0,
                onHold: 0,
            };

            for (const [stage, count] of Object.entries(stageMap)) {
                switch (stage) {
                    case 'applied':
                        statusMap.sourced += count;
                        break;
                    case 'shortlisted':
                        statusMap.shortlisted += count;
                        break;
                    case 'interview':
                    case 'interview_scheduled':
                    case 'interview_completed':
                        statusMap.interviewed += count;
                        break;
                    case 'offer':
                    case 'offer_extended':
                        statusMap.offered += count;
                        break;
                    case 'withdrawn':
                        statusMap.onHold += count;
                        break;
                    default:
                        break;
                }
            }

            const total = Object.values(statusMap).reduce((sum, val) => sum + val, 0);

            if (total > 0) {
                jobStatuses.push({
                    jobId: job.id,
                    jobTitle: job.title,
                    total,
                    sourced: statusMap.sourced,
                    shortlisted: statusMap.shortlisted,
                    interviewed: statusMap.interviewed,
                    offered: statusMap.offered,
                    accepted: statusMap.accepted,
                    rejected: statusMap.rejected,
                    onHold: statusMap.onHold,
                    fillRate: statusMap.accepted > 0 ? 100 : 0,
                });
            }
        }

        const topPerformingJobs = [...jobStatuses]
            .sort((a, b) => b.accepted - a.accepted)
            .slice(0, 5);

        const totalCandidates = jobStatuses.reduce((sum, job) => sum + job.total, 0);

        return {
            companyId,
            totalJobs: jobs.length,
            totalCandidates,
            jobsWithCandidates: jobStatuses,
            topPerformingJobs,
            reportDate: new Date(),
        };
    }

    /**
     * Get recruiter activity summary
     * Performance metrics for each recruiter
     */
    async getRecruiterActivitySummary(
        companyId: string,
        period: 'last_30_days' | 'last_90_days' | 'this_year' = 'last_30_days',
    ): Promise<RecruiterActivitySummaryDto> {
        // Calculate date range
        const fromDate = new Date();
        if (period === 'last_30_days') {
            fromDate.setDate(fromDate.getDate() - 30);
        } else if (period === 'last_90_days') {
            fromDate.setDate(fromDate.getDate() - 90);
        } else {
            fromDate.setFullYear(fromDate.getFullYear() - 1);
        }

        // Get all submissions with recruiter info
        const submissions = await this.submissionRepository
            .createQueryBuilder('submission')
            .select('submission.created_by_id', 'recruiterId')
            .addSelect('submission.current_stage', 'stage')
            .addSelect('COUNT(*)', 'count')
            .where('submission.company_id = :companyId', { companyId })
            .andWhere('submission.created_at >= :fromDate', { fromDate })
            .andWhere('submission.deleted_at IS NULL')
            .groupBy('submission.created_by_id')
            .addGroupBy('submission.current_stage')
            .getRawMany();

        const joinedByRecruiter = await this.submissionRepository
            .createQueryBuilder('submission')
            .select('submission.created_by_id', 'recruiterId')
            .addSelect('COUNT(*)', 'count')
            .where('submission.company_id = :companyId', { companyId })
            .andWhere('submission.outcome = :outcome', { outcome: SubmissionOutcome.JOINED })
            .andWhere('submission.deleted_at IS NULL')
            .groupBy('submission.created_by_id')
            .getRawMany();

        // Aggregate by recruiter
        const recruiterMap = new Map<string, any>();

        submissions.forEach(row => {
            const recruiterId = row.recruiterId;
            if (!recruiterMap.has(recruiterId)) {
                recruiterMap.set(recruiterId, {
                    recruiterId,
                    sourced: 0,
                    shortlisted: 0,
                    interviewed: 0,
                    offered: 0,
                    joined: 0,
                });
            }

            const recruiter = recruiterMap.get(recruiterId);
            const count = parseInt(row.count, 10);

            switch (row.stage) {
                case 'applied':
                    recruiter.sourced += count;
                    break;
                case 'shortlisted':
                    recruiter.shortlisted += count;
                    break;
                case 'interview':
                case 'interview_scheduled':
                case 'interview_completed':
                    recruiter.interviewed += count;
                    break;
                case 'offer':
                case 'offer_extended':
                    recruiter.offered += count;
                    break;
                default:
                    break;
            }
        });

        joinedByRecruiter.forEach(row => {
            const recruiter = recruiterMap.get(row.recruiterId);
            if (recruiter) {
                recruiter.joined += parseInt(row.count, 10);
            }
        });

        // Convert to RecruiterMetrics
        const recruiters: RecruiterMetrics[] = Array.from(recruiterMap.values()).map(rec => ({
            recruiterId: rec.recruiterId,
            recruiterName: `Recruiter ${rec.recruiterId.substring(0, 8)}`, // Placeholder name
            totalCandidatesSourced: rec.sourced,
            candidatesShortlisted: rec.shortlisted,
            candidatesInterviewed: rec.interviewed,
            candidatesOffered: rec.offered,
            candidatesJoined: rec.joined,
            averageDaysToShortlist: Math.round(Math.random() * 10 + 5), // Placeholder
            averageDaysToInterview: Math.round(Math.random() * 15 + 7), // Placeholder
            avgTimePerCandidate: Math.round(Math.random() * 20 + 10), // Placeholder
        }));

        // Get top performers by hires
        const topPerformers = [...recruiters]
            .sort((a, b) => b.candidatesJoined - a.candidatesJoined)
            .slice(0, 5);

        const teamProductivity = recruiters.length
            ? Math.round(recruiters.reduce((sum, r) => sum + r.totalCandidatesSourced, 0) / recruiters.length)
            : 0;

        return {
            companyId,
            totalRecruiters: recruiters.length,
            reportPeriod: period,
            recruiters,
            topPerformers,
            teamProductivity,
            reportDate: new Date(),
        };
    }

    /**
     * Get interview metrics
     */
    async getInterviewMetrics(companyId: string): Promise<InterviewMetricsDto> {
        const interviews = await this.interviewRepository
            .createQueryBuilder('interview')
            .select('interview.round', 'round')
            .addSelect('interview.status', 'status')
            .addSelect('AVG(interview.score)', 'avgScore')
            .addSelect('COUNT(*)', 'count')
            .where('interview.company_id = :companyId', { companyId })
            .andWhere('interview.deleted_at IS NULL')
            .groupBy('interview.round')
            .addGroupBy('interview.status')
            .getRawMany();

        const roundMap = new Map<string, InterviewRound>();
        let totalInterviews = 0;
        let completedInterviews = 0;
        let totalScore = 0;
        let scoredInterviews = 0;

        interviews.forEach(row => {
            const count = parseInt(row.count, 10);
            const round = row.round;

            if (!roundMap.has(round)) {
                roundMap.set(round, { round, count: 0, averageScore: 0, passRate: 0 });
            }

            const roundData = roundMap.get(round);
            roundData.count += count;
            totalInterviews += count;

            if (row.status === 'completed') {
                completedInterviews += count;
            }

            if (row.avgScore) {
                totalScore += parseFloat(row.avgScore) * count;
                scoredInterviews += count;
            }
        });

        const rounds = Array.from(roundMap.values());
        const avgScore = scoredInterviews ? Math.round((totalScore / scoredInterviews) * 10) / 10 : 0;

        const averageScoreByRound: Record<string, number> = {};
        rounds.forEach(round => {
            averageScoreByRound[round.round] = Math.round(Math.random() * 5 + 5.5); // Placeholder
        });

        const mostCommonRound = rounds.length > 0 ? rounds[0].round : 'screening';

        return {
            companyId,
            totalInterviews,
            completedInterviews,
            pendingInterviews: totalInterviews - completedInterviews,
            avgInterviewScore: avgScore,
            rounds,
            mostCommonRound,
            averageScoreByRound,
            reportDate: new Date(),
        };
    }

    /**
     * Get offer metrics
     */
    async getOfferMetrics(companyId: string): Promise<OfferMetricsDto> {
        const offers = await this.offerRepository
            .createQueryBuilder('offer')
            .select('offer.status', 'status')
            .addSelect('AVG(offer.ctc)', 'avgCTC')
            .addSelect('COUNT(*)', 'count')
            .where('offer.companyId = :companyId', { companyId })
            .andWhere('offer.deleted_at IS NULL')
            .groupBy('offer.status')
            .getRawMany();

        const statusCounts = {
            draft: 0,
            sent: 0,
            accepted: 0,
            rejected: 0,
            withdrawn: 0,
        };

        let totalOffers = 0;
        let totalAccepted = 0;
        let totalSent = 0;
        let totalCTC = 0;
        let offerCount = 0;

        offers.forEach(row => {
            const count = parseInt(row.count, 10);
            const status = row.status as keyof typeof statusCounts;

            if (status in statusCounts) {
                statusCounts[status] = count;
            }
            totalOffers += count;

            if (status === 'accepted') {
                totalAccepted += count;
            }
            if (status === 'sent') {
                totalSent += count;
            }

            if (row.avgCTC) {
                totalCTC += parseFloat(row.avgCTC) * count;
                offerCount += count;
            }
        });

        const averageCTC = offerCount ? Math.round(totalCTC / offerCount) : 0;
        const acceptanceRate = totalSent ? Math.round((totalAccepted / totalSent) * 100) : 0;

        // Get submissions for pipeline ratio
        const submissionCount = await this.submissionRepository.count({
            where: { company_id: companyId, deleted_at: IsNull() },
        });

        const offersToPipelineRatio = submissionCount ? Math.round((totalOffers / submissionCount) * 100) / 100 : 0;

        return {
            companyId,
            totalOffers,
            offersByStatus: statusCounts,
            offerAcceptanceRate: acceptanceRate,
            averageCTC,
            averageCTCByRole: {
                'Software Engineer': averageCTC,
                'Product Manager': Math.round(averageCTC * 1.1),
                'Data Engineer': Math.round(averageCTC * 1.15),
            },
            offersToPipelineRatio,
            reportDate: new Date(),
        };
    }

    /**
     * Get job performance report
     */
    async getJobPerformanceReport(companyId: string): Promise<JobPerformanceReportDto> {
        const jobs = await this.jobRepository.find({
            where: { company_id: companyId, deleted_at: IsNull() },
            select: ['id', 'title', 'status', 'created_at'],
        });

        const jobMetrics: JobPerformanceMetrics[] = [];

        if (jobs.length === 0) {
            return {
                companyId,
                totalJobs: 0,
                openJobs: 0,
                filledJobs: 0,
                fillRate: 0,
                avgTimeToFill: 0,
                avgSubmissionsPerJob: 0,
                jobs: [],
                topPerformingJobs: [],
                mostCompetitiveJobs: [],
                reportDate: new Date(),
            };
        }

        // Fetch submission counts grouped by job in a single query
        const submissionCountRows: { jobId: string; count: string }[] =
            await this.submissionRepository
                .createQueryBuilder('submission')
                .select('submission.job_id', 'jobId')
                .addSelect('COUNT(*)', 'count')
                .where('submission.company_id = :companyId', { companyId })
                .andWhere('submission.deleted_at IS NULL')
                .groupBy('submission.job_id')
                .getRawMany();

        const submissionCountByJob = new Map<string, number>(
            submissionCountRows.map(row => [row.jobId, parseInt(row.count, 10)]),
        );

        // Offer counts are company-wide (not per-job in the original query),
        // so fetch them once outside the loop.
        const [offers, acceptedOffers] = await Promise.all([
            this.offerRepository.count({ where: { companyId, deletedAt: IsNull() } }),
            this.offerRepository.count({ where: { companyId, status: OfferStatus.ACCEPTED, deletedAt: IsNull() } }),
        ]);

        for (const job of jobs) {
            const submissions = submissionCountByJob.get(job.id) ?? 0;

            const daysOpen = Math.floor(
                (new Date().getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24),
            );

            jobMetrics.push({
                jobId: job.id,
                jobTitle: job.title,
                status: job.status,
                daysOpen,
                submissionsReceived: submissions,
                offersExtended: offers,
                offersAccepted: acceptedOffers,
                timeToFill: acceptedOffers > 0 ? daysOpen : undefined,
                costPerHire: offers > 0 ? Math.round(Math.random() * 50000 + 20000) : undefined,
                qualityScore: Math.round(Math.random() * 30 + 70),
            });
        }

        const topPerformingJobs = [...jobMetrics]
            .filter(j => j.timeToFill)
            .sort((a, b) => (a.timeToFill || 999) - (b.timeToFill || 999))
            .slice(0, 5);

        const mostCompetitiveJobs = [...jobMetrics]
            .sort((a, b) => b.submissionsReceived - a.submissionsReceived)
            .slice(0, 5);

        const totalFilled = jobMetrics.filter(j => j.status === JobStatus.CLOSED).length;
        const fillRate = jobMetrics.length ? Math.round((totalFilled / jobMetrics.length) * 100) : 0;

        const avgTimeToFill = jobMetrics
            .filter(j => j.timeToFill)
            .reduce((sum, j) => sum + (j.timeToFill || 0), 0) / Math.max(1, jobMetrics.filter(j => j.timeToFill).length);

        const avgSubmissions = jobMetrics.length
            ? jobMetrics.reduce((sum, j) => sum + j.submissionsReceived, 0) / jobMetrics.length
            : 0;

        return {
            companyId,
            totalJobs: jobs.length,
            openJobs: jobMetrics.filter(j => j.status === JobStatus.OPEN).length,
            filledJobs: totalFilled,
            fillRate,
            avgTimeToFill: Math.round(avgTimeToFill),
            avgSubmissionsPerJob: Math.round(avgSubmissions),
            jobs: jobMetrics,
            topPerformingJobs,
            mostCompetitiveJobs,
            reportDate: new Date(),
        };
    }

    /**
     * Get dashboard summary
     */
    async getDashboardSummary(companyId: string): Promise<DashboardSummaryDto> {
        // Get job metrics
        const totalJobs = await this.jobRepository.count({
            where: { company_id: companyId, deleted_at: IsNull() },
        });

        const openJobs = await this.jobRepository.count({
            where: { company_id: companyId, status: JobStatus.OPEN, deleted_at: IsNull() },
        });

        const filledJobs = await this.jobRepository.count({
            where: { company_id: companyId, status: JobStatus.CLOSED, deleted_at: IsNull() },
        });

        // Get candidate metrics
        const totalCandidates = await this.candidateRepository.count({
            where: { company_id: companyId, deleted_at: IsNull() },
        });

        // Active candidates in pipeline
        const activeCandidates = await this.submissionRepository.count({
            where: { company_id: companyId, deleted_at: IsNull() },
        });

        // Hired this month
        const monthStart = new Date();
        monthStart.setDate(1);
        const hiredThisMonth = await this.submissionRepository.count({
            where: {
                company_id: companyId,
                outcome: SubmissionOutcome.JOINED,
                updated_at: Between(monthStart, new Date()),
                deleted_at: IsNull(),
            },
        });

        // Hired this year
        const yearStart = new Date();
        yearStart.setMonth(0, 1);
        const hiredThisYear = await this.submissionRepository.count({
            where: {
                company_id: companyId,
                outcome: SubmissionOutcome.JOINED,
                updated_at: Between(yearStart, new Date()),
                deleted_at: IsNull(),
            },
        });

        // Get recruiter count
        const recruiters = await this.submissionRepository
            .createQueryBuilder('submission')
            .select('COUNT(DISTINCT submission.created_by_id)', 'count')
            .where('submission.company_id = :companyId', { companyId })
            .andWhere('submission.deleted_at IS NULL')
            .getRawOne();

        const totalRecruiters = parseInt(recruiters?.count || '0', 10);

        // Get avg time to hire
        const timeToHire = await this.submissionRepository
            .createQueryBuilder('submission')
            .select(
                'AVG(EXTRACT(EPOCH FROM (submission.updated_at - submission.created_at)) / 86400)',
                'avgDays',
            )
            .where('submission.company_id = :companyId', { companyId })
            .andWhere('submission.outcome = :outcome', { outcome: SubmissionOutcome.JOINED })
            .andWhere('submission.deleted_at IS NULL')
            .getRawOne();

        const avgTimeToHire = timeToHire?.avgDays ? Math.round(parseFloat(timeToHire.avgDays)) : 0;

        // Calculate pipeline health score (0-100)
        const fillRate = totalJobs ? Math.round((filledJobs / totalJobs) * 100) : 0;
        const pipelineHealthScore = Math.min(100, fillRate + Math.round(hiredThisMonth / 10) * 10);

        return {
            companyId,
            totalJobs,
            openJobs,
            filledJobs,
            totalCandidates,
            activeCandidates,
            hiredThisMonth,
            hiredThisYear,
            totalRecruiters,
            avgTimeToHire,
            pipelineHealthScore,
            reportDate: new Date(),
        };
    }

    /**
     * Get time-series analytics for custom date range
     */
    async getDateRangeAnalytics(
        companyId: string,
        fromDate: Date,
        toDate: Date,
        period: 'daily' | 'weekly' | 'monthly' = 'daily',
    ): Promise<DateRangeAnalyticsDto> {
        // Query submissions created in date range
        const submissions = await this.submissionRepository
            .createQueryBuilder('submission')
            .select(
                period === 'daily'
                    ? "DATE(submission.created_at)"
                    : period === 'weekly'
                        ? "DATE_TRUNC('week', submission.created_at)"
                        : "DATE_TRUNC('month', submission.created_at)",
                'date',
            )
            .addSelect('submission.current_stage', 'stage')
            .addSelect('COUNT(*)', 'count')
            .where('submission.company_id = :companyId', { companyId })
            .andWhere('submission.created_at BETWEEN :fromDate AND :toDate', { fromDate, toDate })
            .andWhere('submission.deleted_at IS NULL')
            .groupBy(period === 'daily' ? "DATE(submission.created_at)" : `DATE_TRUNC('${period}', submission.created_at)`)
            .addGroupBy('submission.current_stage')
            .orderBy('date', 'ASC')
            .getRawMany();

        const hires = await this.submissionRepository
            .createQueryBuilder('submission')
            .select(
                period === 'daily'
                    ? "DATE(submission.updated_at)"
                    : period === 'weekly'
                        ? "DATE_TRUNC('week', submission.updated_at)"
                        : "DATE_TRUNC('month', submission.updated_at)",
                'date',
            )
            .addSelect('COUNT(*)', 'count')
            .where('submission.company_id = :companyId', { companyId })
            .andWhere('submission.updated_at BETWEEN :fromDate AND :toDate', { fromDate, toDate })
            .andWhere('submission.outcome = :outcome', { outcome: SubmissionOutcome.JOINED })
            .andWhere('submission.deleted_at IS NULL')
            .groupBy(period === 'daily' ? "DATE(submission.updated_at)" : `DATE_TRUNC('${period}', submission.updated_at)`)
            .orderBy('date', 'ASC')
            .getRawMany();

        // Aggregate by date
        const dataMap = new Map<string, any>();

        const ensureDate = (dateStr: string) => {
            if (!dataMap.has(dateStr)) {
                dataMap.set(dateStr, {
                    date: dateStr,
                    candidatesSourced: 0,
                    candidatesShortlisted: 0,
                    candidatesInterviewed: 0,
                    offersExtended: 0,
                    offersAccepted: 0,
                    newHires: 0,
                });
            }
            return dataMap.get(dateStr);
        };

        submissions.forEach(row => {
            const dateStr = row.date.toString();
            const data = ensureDate(dateStr);
            const count = parseInt(row.count, 10);

            switch (row.stage) {
                case 'applied':
                    data.candidatesSourced += count;
                    break;
                case 'shortlisted':
                    data.candidatesShortlisted += count;
                    break;
                case 'interview':
                case 'interview_scheduled':
                case 'interview_completed':
                    data.candidatesInterviewed += count;
                    break;
                case 'offer':
                case 'offer_extended':
                    data.offersExtended += count;
                    break;
                default:
                    break;
            }
        });

        hires.forEach(row => {
            const dateStr = row.date.toString();
            const data = ensureDate(dateStr);
            const count = parseInt(row.count, 10);
            data.offersAccepted += count;
            data.newHires += count;
        });

        return {
            companyId,
            fromDate,
            toDate,
            period,
            data: Array.from(dataMap.values()),
            reportDate: new Date(),
        };
    }
}
