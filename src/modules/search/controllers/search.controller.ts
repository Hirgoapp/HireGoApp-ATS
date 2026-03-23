import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    Req,
    Query,
} from '@nestjs/common';
import { SemanticSearchService } from '../services/semantic-search.service';
import { EmbeddingService } from '../services/embedding.service';
import { AnalyticsService } from '../services/analytics.service';
import {
    SemanticSearchDto,
    FindSimilarCandidatesDto,
    SkillSearchDto,
    GenerateEmbeddingDto,
    CalculateSimilarityDto,
    AnalyticsFilterDto,
} from '../dto/search.dto';
import { PermissionGuard } from '../../../auth/guards/permission.guard';
import { RequirePermissions } from '../../../auth/decorators/require-permissions.decorator';

/** Semantic / embedding search & analytics (nested under v1; global text search lives at GET /api/v1/search). */
@Controller('api/v1/search/semantic')
@UseGuards(PermissionGuard)
export class SearchController {
    constructor(
        private semanticSearchService: SemanticSearchService,
        private embeddingService: EmbeddingService,
        private analyticsService: AnalyticsService,
    ) { }

    /**
     * Advanced semantic search for candidates
     */
    @Post('candidates')
    @RequirePermissions('candidates:read')
    async searchCandidates(
        @Body() dto: SemanticSearchDto,
        @Req() req: any,
    ) {
        const companyId = req.user?.company_id || 'default';
        const results = await this.semanticSearchService.findBestCandidatesForJob(
            dto.jobDescription,
            dto.jobRequirements,
            companyId,
            dto.limit || 20,
        );

        return {
            data: results,
            count: results.candidates.length,
            message: 'Semantic search completed',
        };
    }

    /**
     * Find similar candidates
     */
    @Post('candidates/similar')
    @RequirePermissions('candidates:read')
    async findSimilarCandidates(
        @Body() dto: FindSimilarCandidatesDto,
        @Req() req: any,
    ) {
        const companyId = req.user?.company_id || 'default';
        const results = await this.semanticSearchService.findSimilarCandidates(
            dto.candidateId,
            companyId,
            dto.limit || 10,
        );

        return {
            data: results,
            count: results.length,
            message: 'Similar candidates found',
        };
    }

    /**
     * Search by skills
     */
    @Post('candidates/skills')
    @RequirePermissions('candidates:read')
    async searchBySkills(
        @Body() dto: SkillSearchDto,
        @Req() req: any,
    ) {
        const companyId = req.user?.company_id || 'default';
        const results = await this.semanticSearchService.findCandidatesBySkills(
            dto.skills,
            companyId,
            dto.matchAllSkills || false,
            dto.limit || 20,
        );

        return {
            data: results,
            count: results.length,
            skills: dto.skills,
            message: 'Skill-based search completed',
        };
    }

    /**
     * Generate embeddings
     */
    @Post('embeddings/generate')
    @RequirePermissions('candidates:read')
    async generateEmbedding(@Body() dto: GenerateEmbeddingDto) {
        const embedding = await this.embeddingService.generateEmbedding(dto.text);

        return {
            data: {
                text: dto.text.substring(0, 100) + '...',
                dimensions: embedding.length,
                vector: embedding,
            },
            message: 'Embedding generated',
        };
    }

    /**
     * Calculate similarity between two texts
     */
    @Post('embeddings/similarity')
    @RequirePermissions('candidates:read')
    async calculateSimilarity(@Body() dto: CalculateSimilarityDto) {
        const similarity = await this.embeddingService.calculateSimilarity(
            dto.text1,
            dto.text2,
        );

        return {
            data: {
                text1: dto.text1.substring(0, 50),
                text2: dto.text2.substring(0, 50),
                similarity: Math.round(similarity * 100) / 100,
            },
            message: 'Similarity calculated',
        };
    }

    /**
     * Get skill trends
     */
    @Get('analytics/trends')
    @RequirePermissions('analytics:read')
    async getSkillTrends(
        @Query() filter: AnalyticsFilterDto,
        @Req() req: any,
    ) {
        const companyId = req.user?.company_id || 'default';
        const insight = await this.analyticsService.analyzeSkillTrends(
            companyId,
            filter.skills || [],
            filter.timeWindow || 'month',
        );

        return {
            data: insight,
            message: 'Skill trends analyzed',
        };
    }

    /**
     * Get market gaps
     */
    @Get('analytics/market-gaps')
    @RequirePermissions('analytics:read')
    async getMarketGaps(@Req() req: any) {
        const companyId = req.user?.company_id || 'default';
        const insight = await this.analyticsService.identifyMarketGaps(companyId);

        return {
            data: insight,
            message: 'Market gaps identified',
        };
    }

    /**
     * Get candidate pool analysis
     */
    @Get('analytics/candidate-pool')
    @RequirePermissions('analytics:read')
    async getCandidatePool(@Req() req: any) {
        const companyId = req.user?.company_id || 'default';
        const insight = await this.analyticsService.analyzeCandidatePool(companyId);

        return {
            data: insight,
            message: 'Candidate pool analyzed',
        };
    }

    /**
     * Get hiring patterns
     */
    @Get('analytics/hiring-patterns')
    @RequirePermissions('analytics:read')
    async getHiringPatterns(@Req() req: any) {
        const companyId = req.user?.company_id || 'default';
        const insight = await this.analyticsService.analyzeHiringPatterns(companyId);

        return {
            data: insight,
            message: 'Hiring patterns analyzed',
        };
    }

    /**
     * Get comprehensive insights dashboard
     */
    @Get('analytics/dashboard')
    @RequirePermissions('analytics:read')
    async getInsightsDashboard(@Req() req: any) {
        const companyId = req.user?.company_id || 'default';
        const insights = await this.analyticsService.getInsightsDashboard(companyId);

        return {
            data: insights,
            count: insights.length,
            message: 'Insights dashboard generated',
        };
    }

    /**
     * Health check
     */
    @Get('health')
    async healthCheck() {
        const embeddingHealth = await this.embeddingService.healthCheck();

        return {
            service: 'Search Engine',
            embedding: embeddingHealth,
            status: embeddingHealth.status,
        };
    }
}
