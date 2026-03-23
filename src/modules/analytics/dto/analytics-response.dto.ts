import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FunnelStageDto {
    @ApiProperty({ example: 'Applied', description: 'Stage name' })
    stage_name: string;

    @ApiProperty({ example: 150, description: 'Number of applications in this stage' })
    count: number;

    @ApiProperty({ example: 75.0, description: 'Conversion rate from previous stage (%)' })
    conversion_rate: number;

    @ApiProperty({ example: 30.0, description: 'Percentage of total applications' })
    percentage_of_total: number;

    @ApiProperty({ example: 3.5, description: 'Average days spent in this stage' })
    avg_days_in_stage: number;
}

export class FunnelAnalyticsDto {
    @ApiProperty({ example: 500, description: 'Total applications in the funnel' })
    total_applications: number;

    @ApiProperty({ type: [FunnelStageDto], description: 'Funnel breakdown by stage' })
    stages: FunnelStageDto[];

    @ApiProperty({ example: 25, description: 'Number of hires in period' })
    total_hires: number;

    @ApiProperty({ example: 5.0, description: 'Overall conversion rate (%)' })
    overall_conversion_rate: number;

    @ApiProperty({ example: 21.5, description: 'Average time to hire in days' })
    avg_time_to_hire: number;
}

export class TimeToHireDto {
    @ApiProperty({ example: 21.5, description: 'Average time to hire in days' })
    avg_days: number;

    @ApiProperty({ example: 18.0, description: 'Median time to hire in days' })
    median_days: number;

    @ApiProperty({ example: 7.0, description: 'Fastest hire in days' })
    min_days: number;

    @ApiProperty({ example: 45.0, description: 'Slowest hire in days' })
    max_days: number;

    @ApiProperty({ example: 25, description: 'Total hires in period' })
    total_hires: number;

    @ApiPropertyOptional({ example: 'Engineering', description: 'Department if filtered' })
    department?: string;

    @ApiPropertyOptional({ example: 'uuid-of-job', description: 'Job ID if filtered' })
    job_id?: string;

    @ApiPropertyOptional({ example: 'Senior Software Engineer', description: 'Job title if filtered' })
    job_title?: string;
}

export class TimeSeriesDataPointDto {
    @ApiProperty({ example: '2026-01-15', description: 'Date or period label' })
    date: string;

    @ApiProperty({ example: 42, description: 'Value for this period' })
    value: number;
}

export class TimeToHireBreakdownDto {
    @ApiProperty({ description: 'Overall time to hire metrics' })
    overall: TimeToHireDto;

    @ApiProperty({ type: [TimeSeriesDataPointDto], description: 'Time series data' })
    time_series: TimeSeriesDataPointDto[];

    @ApiProperty({
        type: [TimeToHireDto],
        description: 'Breakdown by job (top 10)',
        required: false
    })
    by_job?: TimeToHireDto[];

    @ApiProperty({
        type: [TimeToHireDto],
        description: 'Breakdown by department',
        required: false
    })
    by_department?: TimeToHireDto[];
}

export class SourceEffectivenessDto {
    @ApiProperty({ example: 'LinkedIn', description: 'Source name' })
    source_name: string;

    @ApiProperty({ example: 250, description: 'Total applications from this source' })
    total_applications: number;

    @ApiProperty({ example: 15, description: 'Total hires from this source' })
    total_hires: number;

    @ApiProperty({ example: 6.0, description: 'Conversion rate (%)' })
    conversion_rate: number;

    @ApiProperty({ example: 18.5, description: 'Average time to hire from this source (days)' })
    avg_time_to_hire: number;

    @ApiProperty({ example: 1500.0, description: 'Cost per hire (if tracking costs)' })
    cost_per_hire?: number;

    @ApiProperty({ example: 16.67, description: 'Percentage of total applications' })
    percentage_of_total: number;
}

export class RecruiterPerformanceDto {
    @ApiProperty({ example: 'uuid-of-recruiter', description: 'Recruiter ID' })
    recruiter_id: string;

    @ApiProperty({ example: 'Jane Smith', description: 'Recruiter name' })
    recruiter_name: string;

    @ApiProperty({ example: 85, description: 'Total applications handled' })
    total_applications: number;

    @ApiProperty({ example: 12, description: 'Total hires' })
    total_hires: number;

    @ApiProperty({ example: 14.12, description: 'Conversion rate (%)' })
    conversion_rate: number;

    @ApiProperty({ example: 19.5, description: 'Average time to hire (days)' })
    avg_time_to_hire: number;

    @ApiProperty({ example: 32, description: 'Active jobs assigned' })
    active_jobs: number;

    @ApiProperty({ example: 45, description: 'Pending applications' })
    pending_applications: number;

    @ApiProperty({ example: 4.2, description: 'Average candidate rating (if tracked)' })
    avg_candidate_rating?: number;
}

export class JobPerformanceDto {
    @ApiProperty({ example: 'uuid-of-job', description: 'Job ID' })
    job_id: string;

    @ApiProperty({ example: 'Senior Software Engineer', description: 'Job title' })
    job_title: string;

    @ApiProperty({ example: 'Engineering', description: 'Department' })
    department: string;

    @ApiProperty({ example: 120, description: 'Total applications' })
    total_applications: number;

    @ApiProperty({ example: 8, description: 'Total hires' })
    total_hires: number;

    @ApiProperty({ example: 6.67, description: 'Conversion rate (%)' })
    conversion_rate: number;

    @ApiProperty({ example: 22.5, description: 'Average time to hire (days)' })
    avg_time_to_hire: number;

    @ApiProperty({ example: 'Active', description: 'Job status' })
    status: string;

    @ApiProperty({ example: 15, description: 'Days since job posted' })
    days_open: number;

    @ApiProperty({ example: 3, description: 'Positions filled' })
    positions_filled: number;

    @ApiProperty({ example: 5, description: 'Total positions' })
    total_positions: number;
}

export class DashboardOverviewDto {
    @ApiProperty({ example: 1250, description: 'Total active candidates' })
    total_candidates: number;

    @ApiProperty({ example: 45, description: 'Total active jobs' })
    total_jobs: number;

    @ApiProperty({ example: 350, description: 'Total active applications' })
    total_applications: number;

    @ApiProperty({ example: 12, description: 'Hires this month' })
    hires_this_month: number;

    @ApiProperty({ example: 85, description: 'New applications this week' })
    new_applications_this_week: number;

    @ApiProperty({ example: 23, description: 'Interviews scheduled' })
    interviews_scheduled: number;

    @ApiProperty({ example: 21.5, description: 'Average time to hire (days)' })
    avg_time_to_hire: number;

    @ApiProperty({ example: 5.8, description: 'Overall conversion rate (%)' })
    overall_conversion_rate: number;

    @ApiProperty({ type: [TimeSeriesDataPointDto], description: 'Applications trend (last 30 days)' })
    applications_trend: TimeSeriesDataPointDto[];

    @ApiProperty({ type: [SourceEffectivenessDto], description: 'Top 5 sources' })
    top_sources: SourceEffectivenessDto[];
}

export class PipelineAnalyticsDto {
    @ApiProperty({ example: 'uuid-of-pipeline', description: 'Pipeline ID' })
    pipeline_id: string;

    @ApiProperty({ example: 'Standard Hiring Pipeline', description: 'Pipeline name' })
    pipeline_name: string;

    @ApiProperty({ example: 250, description: 'Total applications in this pipeline' })
    total_applications: number;

    @ApiProperty({ type: [FunnelStageDto], description: 'Breakdown by stage' })
    stages: FunnelStageDto[];

    @ApiProperty({ example: 18.5, description: 'Average time through entire pipeline (days)' })
    avg_pipeline_duration: number;

    @ApiProperty({ example: 35, description: 'Applications stuck (>30 days in one stage)' })
    bottleneck_count: number;

    @ApiProperty({ example: 'Screening', description: 'Stage with most bottlenecks' })
    bottleneck_stage: string;
}
