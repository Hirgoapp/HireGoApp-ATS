import { IsString, IsOptional, IsEnum, IsArray, IsObject, IsBoolean, IsUUID, IsUrl, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BetaStatus, BetaTier } from '../entities/beta-user.entity';
import { FeedbackType, FeedbackPriority, FeedbackStatus } from '../entities/feedback.entity';

// Beta User DTOs
export class CreateBetaUserDto {
    @ApiProperty({ example: 'uuid-of-user' })
    @IsUUID()
    user_id: string;

    @ApiProperty({ example: 'uuid-of-company' })
    @IsUUID()
    company_id: string;

    @ApiProperty({ enum: BetaTier, default: BetaTier.CLOSED_BETA })
    @IsEnum(BetaTier)
    tier: BetaTier;

    @ApiPropertyOptional({ example: 'We would love your feedback on our new analytics dashboard' })
    @IsOptional()
    @IsString()
    invitation_note?: string;

    @ApiPropertyOptional({ example: ['advanced-analytics', 'bulk-operations-v2'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    features_enabled?: string[];

    @ApiPropertyOptional({
        example: {
            company_size: '50-200',
            industry: 'Technology',
            use_case: 'Tech recruiting',
        },
    })
    @IsOptional()
    @IsObject()
    metadata?: any;
}

export class UpdateBetaUserDto {
    @ApiPropertyOptional({ enum: BetaStatus })
    @IsOptional()
    @IsEnum(BetaStatus)
    status?: BetaStatus;

    @ApiPropertyOptional({ enum: BetaTier })
    @IsOptional()
    @IsEnum(BetaTier)
    tier?: BetaTier;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    features_enabled?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    metadata?: any;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    invitation_note?: string;
}

export class BetaUserResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    user_id: string;

    @ApiProperty()
    company_id: string;

    @ApiProperty({ enum: BetaStatus })
    status: BetaStatus;

    @ApiProperty({ enum: BetaTier })
    tier: BetaTier;

    @ApiPropertyOptional()
    invitation_note?: string;

    @ApiPropertyOptional()
    invited_at?: Date;

    @ApiPropertyOptional()
    invited_by?: string;

    @ApiPropertyOptional()
    accepted_at?: Date;

    @ApiPropertyOptional()
    completed_at?: Date;

    @ApiPropertyOptional()
    features_enabled?: string[];

    @ApiPropertyOptional()
    metadata?: any;

    @ApiProperty()
    created_at: Date;

    @ApiProperty()
    updated_at: Date;
}

// Feedback DTOs
export class CreateFeedbackDto {
    @ApiProperty({ enum: FeedbackType })
    @IsEnum(FeedbackType)
    type: FeedbackType;

    @ApiProperty({ example: 'Application page is slow to load' })
    @IsString()
    title: string;

    @ApiProperty({ example: 'When I click on the Applications tab, it takes 5-10 seconds to load the list of applications.' })
    @IsString()
    description: string;

    @ApiPropertyOptional({ example: '1. Go to Applications tab\n2. Wait for page to load\n3. Observe slow loading time' })
    @IsOptional()
    @IsString()
    reproduction_steps?: string;

    @ApiPropertyOptional({ example: 'Page should load within 1-2 seconds' })
    @IsOptional()
    @IsString()
    expected_behavior?: string;

    @ApiPropertyOptional({ example: 'Page takes 5-10 seconds to load' })
    @IsOptional()
    @IsString()
    actual_behavior?: string;

    @ApiPropertyOptional({ example: 'https://app.example.com/applications' })
    @IsOptional()
    @IsUrl()
    page_url?: string;

    @ApiPropertyOptional({ example: 'Chrome 120.0' })
    @IsOptional()
    @IsString()
    browser?: string;

    @ApiPropertyOptional({ example: 'Windows 11' })
    @IsOptional()
    @IsString()
    os?: string;

    @ApiPropertyOptional({ example: '1.2.0' })
    @IsOptional()
    @IsString()
    app_version?: string;

    @ApiPropertyOptional({
        example: [
            { url: 'https://s3.../screenshot.png', type: 'image/png', name: 'screenshot.png' },
        ],
    })
    @IsOptional()
    @IsArray()
    attachments?: Array<{
        url: string;
        type: string;
        name: string;
    }>;

    @ApiPropertyOptional({
        example: {
            feature_flag: 'advanced-analytics',
            module: 'applications',
            session_id: 'abc123',
        },
    })
    @IsOptional()
    @IsObject()
    metadata?: any;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @IsBoolean()
    is_beta_feedback?: boolean;
}

export class UpdateFeedbackDto {
    @ApiPropertyOptional({ enum: FeedbackPriority })
    @IsOptional()
    @IsEnum(FeedbackPriority)
    priority?: FeedbackPriority;

    @ApiPropertyOptional({ enum: FeedbackStatus })
    @IsOptional()
    @IsEnum(FeedbackStatus)
    status?: FeedbackStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    admin_notes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    resolution_notes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    assigned_to?: string;
}

export class FeedbackResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    user_id: string;

    @ApiProperty()
    company_id: string;

    @ApiProperty({ enum: FeedbackType })
    type: FeedbackType;

    @ApiProperty({ enum: FeedbackPriority })
    priority: FeedbackPriority;

    @ApiProperty({ enum: FeedbackStatus })
    status: FeedbackStatus;

    @ApiProperty()
    title: string;

    @ApiProperty()
    description: string;

    @ApiPropertyOptional()
    reproduction_steps?: string;

    @ApiPropertyOptional()
    expected_behavior?: string;

    @ApiPropertyOptional()
    actual_behavior?: string;

    @ApiPropertyOptional()
    page_url?: string;

    @ApiPropertyOptional()
    browser?: string;

    @ApiPropertyOptional()
    os?: string;

    @ApiPropertyOptional()
    app_version?: string;

    @ApiPropertyOptional()
    attachments?: Array<{
        url: string;
        type: string;
        name: string;
    }>;

    @ApiPropertyOptional()
    metadata?: any;

    @ApiPropertyOptional()
    admin_notes?: string;

    @ApiPropertyOptional()
    resolution_notes?: string;

    @ApiPropertyOptional()
    assigned_to?: string;

    @ApiPropertyOptional()
    resolved_at?: Date;

    @ApiPropertyOptional()
    resolved_by?: string;

    @ApiProperty()
    upvotes: number;

    @ApiProperty()
    is_beta_feedback: boolean;

    @ApiProperty()
    created_at: Date;

    @ApiProperty()
    updated_at: Date;
}

export class UpvoteFeedbackDto {
    @ApiProperty({ example: 'uuid-of-feedback' })
    @IsUUID()
    feedback_id: string;
}

export class FeedbackStatsDto {
    @ApiProperty()
    total_feedback: number;

    @ApiProperty()
    by_type: Record<FeedbackType, number>;

    @ApiProperty()
    by_status: Record<FeedbackStatus, number>;

    @ApiProperty()
    by_priority: Record<FeedbackPriority, number>;

    @ApiProperty()
    avg_resolution_time_hours: number;

    @ApiProperty()
    top_requested_features: Array<{ title: string; upvotes: number }>;
}
