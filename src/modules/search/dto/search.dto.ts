import { IsString, IsArray, IsOptional, IsEnum, IsNumber } from 'class-validator';

export class SemanticSearchDto {
    @IsString()
    jobDescription: string;

    @IsArray()
    @IsString({ each: true })
    jobRequirements: string[];

    @IsOptional()
    @IsNumber()
    limit?: number;
}

export class FindSimilarCandidatesDto {
    @IsString()
    candidateId: string;

    @IsOptional()
    @IsNumber()
    limit?: number;
}

export class SkillSearchDto {
    @IsArray()
    @IsString({ each: true })
    skills: string[];

    @IsOptional()
    matchAllSkills?: boolean;

    @IsOptional()
    @IsNumber()
    limit?: number;
}

export class GenerateEmbeddingDto {
    @IsString()
    text: string;
}

export class CalculateSimilarityDto {
    @IsString()
    text1: string;

    @IsString()
    text2: string;
}

export class AnalyticsFilterDto {
    @IsOptional()
    @IsEnum(['week', 'month', 'quarter'])
    timeWindow?: 'week' | 'month' | 'quarter';

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skills?: string[];
}
