import { IsString, IsArray, IsOptional, IsEnum } from 'class-validator';

export class ParseResumeDto {
    @IsString()
    resumeText: string;
}

export class GenerateScreeningQuestionsDto {
    @IsString()
    jobDescription: string;

    @IsArray()
    @IsString({ each: true })
    requiredSkills: string[];
}

export class MatchCandidateDto {
    @IsString()
    candidateId: string;

    @IsString()
    resumeText: string; // Can parse inline or reference existing

    @IsString()
    jobDescription: string;

    @IsArray()
    @IsString({ each: true })
    jobRequirements: string[];
}

export class EvaluateResponseDto {
    @IsString()
    question: string;

    @IsString()
    candidateResponse: string;
}

export class GenerateEmailDto {
    @IsEnum(['rejection', 'interview_invitation', 'offer', 'follow_up'])
    type: 'rejection' | 'interview_invitation' | 'offer' | 'follow_up';

    @IsString()
    candidateName: string;

    @IsString()
    position: string;

    @IsOptional()
    @IsString()
    context?: string;
}

export class AnalyzeTranscriptDto {
    @IsString()
    transcript: string;
}
