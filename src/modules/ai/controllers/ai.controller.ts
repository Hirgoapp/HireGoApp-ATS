import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    Req,
    HttpStatus,
} from '@nestjs/common';
import { AiService } from '../services/ai.service';
import {
    ParseResumeDto,
    GenerateScreeningQuestionsDto,
    MatchCandidateDto,
    EvaluateResponseDto,
    GenerateEmailDto,
    AnalyzeTranscriptDto,
} from '../dto/ai.dto';
import { PermissionGuard } from '../../../auth/guards/permission.guard';
import { RequirePermissions } from '../../../auth/decorators/require-permissions.decorator';

@Controller('ai')
@UseGuards(PermissionGuard)
export class AiController {
    constructor(private aiService: AiService) { }

    /**
     * Parse resume and extract structured data
     */
    @Post('parse-resume')
    @RequirePermissions('candidates:create', 'candidates:update')
    async parseResume(@Body() dto: ParseResumeDto, @Req() req: any) {
        const companyId = req.user?.company_id || 'default';
        const result = await this.aiService.parseResume(dto.resumeText, companyId);

        return {
            data: result,
            message: 'Resume parsed successfully',
        };
    }

    /**
     * Generate screening questions for a job
     */
    @Post('screening-questions')
    @RequirePermissions('jobs:manage', 'jobs:create')
    async generateScreeningQuestions(@Body() dto: GenerateScreeningQuestionsDto, @Req() req: any) {
        const companyId = req.user?.company_id || 'default';
        const questions = await this.aiService.generateScreeningQuestions(
            dto.jobDescription,
            dto.requiredSkills,
            companyId,
        );

        return {
            data: questions,
            count: questions.length,
            message: 'Screening questions generated',
        };
    }

    /**
     * Match candidate to job
     */
    @Post('match-candidate')
    @RequirePermissions('candidates:read')
    async matchCandidate(@Body() dto: MatchCandidateDto, @Req() req: any) {
        const companyId = req.user?.company_id || 'default';

        // Parse resume
        const parsedResume = await this.aiService.parseResume(dto.resumeText, companyId);

        // Match to job
        const match = await this.aiService.matchCandidateToJob(
            parsedResume,
            dto.jobDescription,
            dto.jobRequirements,
            dto.candidateId,
            companyId,
        );

        return {
            data: match,
            message: 'Candidate matched to job',
        };
    }

    /**
     * Evaluate candidate response to screening question
     */
    @Post('evaluate-response')
    @RequirePermissions('interviews:manage')
    async evaluateResponse(@Body() dto: EvaluateResponseDto, @Req() req: any) {
        const companyId = req.user?.company_id || 'default';
        const evaluation = await this.aiService.evaluateResponse(
            dto.question,
            dto.candidateResponse,
            companyId,
        );

        return {
            data: evaluation,
            message: 'Response evaluated',
        };
    }

    /**
     * Generate personalized email
     */
    @Post('generate-email')
    @RequirePermissions('emails:send')
    async generateEmail(@Body() dto: GenerateEmailDto, @Req() req: any) {
        const companyId = req.user?.company_id || 'default';
        const email = await this.aiService.generateEmail(
            dto.type,
            dto.candidateName,
            dto.position,
            dto.context,
            companyId,
        );

        return {
            data: email,
            message: 'Email generated',
        };
    }

    /**
     * Analyze interview transcript
     */
    @Post('analyze-transcript')
    @RequirePermissions('interviews:manage')
    async analyzeTranscript(@Body() dto: AnalyzeTranscriptDto, @Req() req: any) {
        const companyId = req.user?.company_id || 'default';
        const analysis = await this.aiService.analyzeInterviewTranscript(
            dto.transcript,
            companyId,
        );

        return {
            data: analysis,
            message: 'Transcript analyzed',
        };
    }

    /**
     * Health check for AI service
     */
    @Get('health')
    async healthCheck() {
        const status = await this.aiService.healthCheck();
        return {
            service: 'AI Engine',
            ...status,
        };
    }
}
