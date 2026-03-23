/**
 * DTOs for report responses
 * All reports are read-only and tenant-aware
 */

/**
 * Pipeline funnel stage data
 */
export class PipelineFunnelStage {
    stage: string; // 'sourced', 'shortlisted', 'interviewed', 'offered', 'joined'
    count: number;
    percentage: number;
    dropoff?: number; // Candidates lost at this stage
}

/**
 * Pipeline funnel report
 * Shows candidate progression through hiring pipeline
 */
export class PipelineFunnelDto {
    totalCandidates: number;
    stages: PipelineFunnelStage[];
    conversionRate: number; // % of candidates who joined from sourced
    averageDaysToHire: number;
    reportDate: Date;
}

/**
 * Job candidate status breakdown
 */
export class JobCandidateStatus {
    jobId: string;
    jobTitle: string;
    total: number; // Total submissions for this job
    sourced: number;
    shortlisted: number;
    interviewed: number;
    offered: number;
    accepted: number;
    rejected: number;
    onHold: number;
    fillRate?: number; // % of position filled
}

/**
 * Job-wise candidate status report
 * Breakdown of candidates by job and status
 */
export class JobCandidateStatusReportDto {
    companyId: string;
    totalJobs: number;
    totalCandidates: number;
    jobsWithCandidates: JobCandidateStatus[];
    topPerformingJobs: JobCandidateStatus[]; // Jobs with highest conversion
    reportDate: Date;
}

/**
 * Recruiter activity metrics
 */
export class RecruiterMetrics {
    recruiterId: string;
    recruiterName: string;
    totalCandidatesSourced: number;
    candidatesShortlisted: number;
    candidatesInterviewed: number;
    candidatesOffered: number;
    candidatesJoined: number;
    averageDaysToShortlist: number;
    averageDaysToInterview: number;
    avgTimePerCandidate: number;
}

/**
 * Recruiter activity summary report
 * Performance metrics for recruiters
 */
export class RecruiterActivitySummaryDto {
    companyId: string;
    totalRecruiters: number;
    reportPeriod: string; // 'last_30_days', 'last_90_days', 'this_year'
    recruiters: RecruiterMetrics[];
    topPerformers: RecruiterMetrics[]; // Top 5 by candidates joined
    teamProductivity: number; // Avg candidates per recruiter
    reportDate: Date;
}

/**
 * Interview feedback summary
 */
export class InterviewRound {
    round: string; // screening, first, second, technical, hr, final
    count: number;
    averageScore: number;
    passRate: number; // % who passed to next round
}

/**
 * Interview metrics report
 */
export class InterviewMetricsDto {
    companyId: string;
    totalInterviews: number;
    completedInterviews: number;
    pendingInterviews: number;
    avgInterviewScore: number;
    rounds: InterviewRound[];
    mostCommonRound: string;
    averageScoreByRound: Record<string, number>;
    reportDate: Date;
}

/**
 * Offer metrics
 */
export class OfferMetricsDto {
    companyId: string;
    totalOffers: number;
    offersByStatus: {
        draft: number;
        sent: number;
        accepted: number;
        rejected: number;
        withdrawn: number;
    };
    offerAcceptanceRate: number; // % of sent offers accepted
    averageCTC: number;
    averageCTCByRole: Record<string, number>;
    offersToPipelineRatio: number; // Offers made per candidate in pipeline
    reportDate: Date;
}

/**
 * Job performance metrics
 */
export class JobPerformanceMetrics {
    jobId: string;
    jobTitle: string;
    status: string; // open, filled, closed
    daysOpen: number;
    submissionsReceived: number;
    offersExtended: number;
    offersAccepted: number;
    timeToFill?: number; // Days until position filled
    costPerHire?: number;
    qualityScore?: number; // 0-100 based on hires performance
}

/**
 * Job performance report
 */
export class JobPerformanceReportDto {
    companyId: string;
    totalJobs: number;
    openJobs: number;
    filledJobs: number;
    fillRate: number;
    avgTimeToFill: number;
    avgSubmissionsPerJob: number;
    jobs: JobPerformanceMetrics[];
    topPerformingJobs: JobPerformanceMetrics[]; // Fastest to fill
    mostCompetitiveJobs: JobPerformanceMetrics[]; // Most submissions
    reportDate: Date;
}

/**
 * Summary dashboard metrics
 */
export class DashboardSummaryDto {
    companyId: string;
    totalJobs: number;
    openJobs: number;
    filledJobs: number;
    totalCandidates: number;
    activeCandidates: number; // In pipeline
    hiredThisMonth: number;
    hiredThisYear: number;
    totalRecruiters: number;
    avgTimeToHire: number;
    pipelineHealthScore: number; // 0-100
    reportDate: Date;
}

/**
 * Custom date range analytics
 */
export class DateRangeAnalyticsDto {
    companyId: string;
    fromDate: Date;
    toDate: Date;
    period: string; // 'daily', 'weekly', 'monthly'
    data: {
        date: string;
        candidatesSourced: number;
        candidatesShortlisted: number;
        candidatesInterviewed: number;
        offersExtended: number;
        offersAccepted: number;
        newHires: number;
    }[];
    reportDate: Date;
}
