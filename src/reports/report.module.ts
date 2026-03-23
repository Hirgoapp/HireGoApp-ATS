import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from './controllers/report.controller';
import { ReportService } from './services/report.service';
import { CandidateModule } from '../candidate/candidate.module';
import { Candidate } from '../candidate/entities/candidate.entity';
import { JobModule } from '../jobs/job.module';
import { JobRequirement } from '../jobs/entities/job-requirement.entity';
import { SubmissionModule } from '../submissions/submission.module';
import { RequirementSubmission } from '../submissions/entities/requirement-submission.entity';
import { InterviewModule } from '../interviews/interview.module';
import { Interview } from '../interviews/entities/interview.entity';
import { OfferModule } from '../offers/offer.module';
import { Offer } from '../offers/entities/offer.entity';
import { RbacModule } from '../rbac/rbac.module';

/**
 * Reports Module - Read-only analytics and reporting
 *
 * Provides analytics endpoints for:
 * - Pipeline funnel analysis
 * - Job-wise candidate status breakdown
 * - Recruiter performance metrics
 * - Interview statistics
 * - Offer analytics
 * - Job performance metrics
 * - Dashboard summary
 * - Time-series analytics
 *
 * All endpoints are read-only (GET only)
 * All endpoints require reports:read permission
 * All queries are tenant-scoped by company_id
 *
 * Imports data from:
 * - Candidate module: candidate counts
 * - Job module: job details, statuses
 * - Submission module: pipeline stages, recruiter attribution
 * - Interview module: interview rounds, scores
 * - Offer module: offer statuses, CTC values
 * - RBAC module: permission validation
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([Candidate, JobRequirement, RequirementSubmission, Interview, Offer]),
        CandidateModule,
        JobModule,
        SubmissionModule,
        InterviewModule,
        OfferModule,
        RbacModule,
    ],
    controllers: [ReportController],
    providers: [ReportService],
    exports: [ReportService],
})
export class ReportModule { }
