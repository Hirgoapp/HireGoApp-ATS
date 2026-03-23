import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BetaUser, BetaStatus, BetaTier } from './entities/beta-user.entity';
import { Feedback, FeedbackStatus, FeedbackPriority, FeedbackType } from './entities/feedback.entity';
import { CreateBetaUserDto, UpdateBetaUserDto, CreateFeedbackDto, UpdateFeedbackDto, FeedbackStatsDto } from './dto/feedback.dto';

@Injectable()
export class FeedbackService {
    constructor(
        @InjectRepository(BetaUser)
        private readonly betaUserRepository: Repository<BetaUser>,
        @InjectRepository(Feedback)
        private readonly feedbackRepository: Repository<Feedback>,
    ) { }

    // ===== Beta User Management =====

    /**
     * Create a new beta user invitation
     */
    async createBetaUser(createDto: CreateBetaUserDto, invitedBy: string): Promise<BetaUser> {
        // Check if user is already a beta user
        const existing = await this.betaUserRepository.findOne({
            where: {
                user_id: createDto.user_id,
                company_id: createDto.company_id,
            },
        });

        if (existing && existing.status !== BetaStatus.COMPLETED) {
            throw new ConflictException('User is already enrolled in beta program');
        }

        const betaUser = this.betaUserRepository.create({
            ...createDto,
            status: BetaStatus.INVITED,
            invited_at: new Date(),
            invited_by: invitedBy,
        });

        return this.betaUserRepository.save(betaUser);
    }

    /**
     * Get all beta users with filters
     */
    async findAllBetaUsers(filters?: { status?: BetaStatus; tier?: BetaTier; company_id?: string }): Promise<BetaUser[]> {
        const query = this.betaUserRepository.createQueryBuilder('beta_user').leftJoinAndSelect('beta_user.user', 'user').leftJoinAndSelect('beta_user.company', 'company');

        if (filters?.status) {
            query.andWhere('beta_user.status = :status', { status: filters.status });
        }

        if (filters?.tier) {
            query.andWhere('beta_user.tier = :tier', { tier: filters.tier });
        }

        if (filters?.company_id) {
            query.andWhere('beta_user.company_id = :company_id', { company_id: filters.company_id });
        }

        query.orderBy('beta_user.created_at', 'DESC');

        return query.getMany();
    }

    /**
     * Get a single beta user
     */
    async findOneBetaUser(id: string): Promise<BetaUser> {
        const betaUser = await this.betaUserRepository.findOne({
            where: { id },
            relations: ['user', 'company'],
        });

        if (!betaUser) {
            throw new NotFoundException(`Beta user with ID "${id}" not found`);
        }

        return betaUser;
    }

    /**
     * Update beta user status or settings
     */
    async updateBetaUser(id: string, updateDto: UpdateBetaUserDto): Promise<BetaUser> {
        const betaUser = await this.findOneBetaUser(id);

        Object.assign(betaUser, updateDto);

        // Set timestamps based on status changes
        if (updateDto.status === BetaStatus.ACTIVE && !betaUser.accepted_at) {
            betaUser.accepted_at = new Date();
        }

        if (updateDto.status === BetaStatus.COMPLETED && !betaUser.completed_at) {
            betaUser.completed_at = new Date();
        }

        return this.betaUserRepository.save(betaUser);
    }

    /**
     * Accept beta invitation (user action)
     */
    async acceptBetaInvitation(userId: string, companyId: string): Promise<BetaUser> {
        const betaUser = await this.betaUserRepository.findOne({
            where: {
                user_id: userId,
                company_id: companyId,
                status: BetaStatus.INVITED,
            },
        });

        if (!betaUser) {
            throw new NotFoundException('Beta invitation not found or already accepted');
        }

        betaUser.status = BetaStatus.ACTIVE;
        betaUser.accepted_at = new Date();

        return this.betaUserRepository.save(betaUser);
    }

    /**
     * Remove beta user
     */
    async removeBetaUser(id: string): Promise<void> {
        const betaUser = await this.findOneBetaUser(id);
        await this.betaUserRepository.remove(betaUser);
    }

    /**
     * Check if user is an active beta user
     */
    async isBetaUser(userId: string, companyId: string): Promise<boolean> {
        const count = await this.betaUserRepository.count({
            where: {
                user_id: userId,
                company_id: companyId,
                status: BetaStatus.ACTIVE,
            },
        });

        return count > 0;
    }

    // ===== Feedback Management =====

    /**
     * Submit new feedback
     */
    async createFeedback(userId: string, companyId: string, createDto: CreateFeedbackDto): Promise<Feedback> {
        // Check if user is beta user to mark feedback accordingly
        const isBeta = await this.isBetaUser(userId, companyId);

        const feedback = this.feedbackRepository.create({
            ...createDto,
            user_id: userId,
            company_id: companyId,
            status: FeedbackStatus.NEW,
            is_beta_feedback: isBeta || createDto.is_beta_feedback,
        });

        return this.feedbackRepository.save(feedback);
    }

    /**
     * Get all feedback with filters
     */
    async findAllFeedback(filters?: {
        type?: FeedbackType;
        status?: FeedbackStatus;
        priority?: FeedbackPriority;
        company_id?: string;
        user_id?: string;
        is_beta?: boolean;
    }): Promise<Feedback[]> {
        const query = this.feedbackRepository.createQueryBuilder('feedback').leftJoinAndSelect('feedback.user', 'user').leftJoinAndSelect('feedback.company', 'company');

        if (filters?.type) {
            query.andWhere('feedback.type = :type', { type: filters.type });
        }

        if (filters?.status) {
            query.andWhere('feedback.status = :status', { status: filters.status });
        }

        if (filters?.priority) {
            query.andWhere('feedback.priority = :priority', { priority: filters.priority });
        }

        if (filters?.company_id) {
            query.andWhere('feedback.company_id = :company_id', { company_id: filters.company_id });
        }

        if (filters?.user_id) {
            query.andWhere('feedback.user_id = :user_id', { user_id: filters.user_id });
        }

        if (filters?.is_beta !== undefined) {
            query.andWhere('feedback.is_beta_feedback = :is_beta', { is_beta: filters.is_beta });
        }

        query.orderBy('feedback.created_at', 'DESC');

        return query.getMany();
    }

    /**
     * Get a single feedback item
     */
    async findOneFeedback(id: string): Promise<Feedback> {
        const feedback = await this.feedbackRepository.findOne({
            where: { id },
            relations: ['user', 'company'],
        });

        if (!feedback) {
            throw new NotFoundException(`Feedback with ID "${id}" not found`);
        }

        return feedback;
    }

    /**
     * Update feedback (admin only)
     */
    async updateFeedback(id: string, updateDto: UpdateFeedbackDto, adminUserId: string): Promise<Feedback> {
        const feedback = await this.findOneFeedback(id);

        Object.assign(feedback, updateDto);

        // Set resolution timestamp if marking as resolved
        if (updateDto.status === FeedbackStatus.RESOLVED && !feedback.resolved_at) {
            feedback.resolved_at = new Date();
            feedback.resolved_by = adminUserId;
        }

        return this.feedbackRepository.save(feedback);
    }

    /**
     * Delete feedback
     */
    async removeFeedback(id: string): Promise<void> {
        const feedback = await this.findOneFeedback(id);
        await this.feedbackRepository.remove(feedback);
    }

    /**
     * Upvote feedback
     */
    async upvoteFeedback(feedbackId: string): Promise<Feedback> {
        const feedback = await this.findOneFeedback(feedbackId);
        feedback.upvotes += 1;
        return this.feedbackRepository.save(feedback);
    }

    /**
     * Get feedback statistics
     */
    async getFeedbackStats(companyId?: string): Promise<FeedbackStatsDto> {
        const query = this.feedbackRepository.createQueryBuilder('feedback');

        if (companyId) {
            query.where('feedback.company_id = :company_id', { company_id: companyId });
        }

        const allFeedback = await query.getMany();

        // Count by type
        const byType: Record<string, number> = {};
        Object.values(FeedbackType).forEach(type => {
            byType[type] = allFeedback.filter(f => f.type === type).length;
        });

        // Count by status
        const byStatus: Record<string, number> = {};
        Object.values(FeedbackStatus).forEach(status => {
            byStatus[status] = allFeedback.filter(f => f.status === status).length;
        });

        // Count by priority
        const byPriority: Record<string, number> = {};
        Object.values(FeedbackPriority).forEach(priority => {
            byPriority[priority] = allFeedback.filter(f => f.priority === priority).length;
        });

        // Calculate average resolution time
        const resolvedFeedback = allFeedback.filter(f => f.status === FeedbackStatus.RESOLVED && f.resolved_at);
        const avgResolutionTime = resolvedFeedback.length > 0
            ? resolvedFeedback.reduce((sum, f) => {
                const diff = f.resolved_at.getTime() - f.created_at.getTime();
                return sum + diff;
            }, 0) / resolvedFeedback.length
            : 0;

        const avgResolutionTimeHours = avgResolutionTime / (1000 * 60 * 60);

        // Top requested features (feature requests sorted by upvotes)
        const topRequestedFeatures = allFeedback
            .filter(f => f.type === FeedbackType.FEATURE_REQUEST)
            .sort((a, b) => b.upvotes - a.upvotes)
            .slice(0, 10)
            .map(f => ({
                title: f.title,
                upvotes: f.upvotes,
            }));

        return {
            total_feedback: allFeedback.length,
            by_type: byType as Record<FeedbackType, number>,
            by_status: byStatus as Record<FeedbackStatus, number>,
            by_priority: byPriority as Record<FeedbackPriority, number>,
            avg_resolution_time_hours: Math.round(avgResolutionTimeHours * 100) / 100,
            top_requested_features: topRequestedFeatures,
        };
    }

    /**
     * Get beta program statistics
     */
    async getBetaStats(): Promise<{
        total_beta_users: number;
        by_status: Record<BetaStatus, number>;
        by_tier: Record<BetaTier, number>;
        acceptance_rate: number;
    }> {
        const allBetaUsers = await this.betaUserRepository.find();

        // Count by status
        const byStatus: Record<string, number> = {};
        Object.values(BetaStatus).forEach(status => {
            byStatus[status] = allBetaUsers.filter(u => u.status === status).length;
        });

        // Count by tier
        const byTier: Record<string, number> = {};
        Object.values(BetaTier).forEach(tier => {
            byTier[tier] = allBetaUsers.filter(u => u.tier === tier).length;
        });

        // Calculate acceptance rate
        const invited = allBetaUsers.filter(u => u.status === BetaStatus.INVITED).length;
        const active = allBetaUsers.filter(u => u.status === BetaStatus.ACTIVE).length;
        const acceptanceRate = (invited + active) > 0 ? (active / (invited + active)) * 100 : 0;

        return {
            total_beta_users: allBetaUsers.length,
            by_status: byStatus as Record<BetaStatus, number>,
            by_tier: byTier as Record<BetaTier, number>,
            acceptance_rate: Math.round(acceptanceRate * 100) / 100,
        };
    }
}
