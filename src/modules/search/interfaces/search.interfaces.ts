export interface EmbeddingVector {
    text: string;
    vector: number[];
    metadata: EmbeddingMetadata;
}

export interface EmbeddingMetadata {
    type: 'resume' | 'job_description' | 'skill' | 'question';
    entityId: string;
    companyId: string;
    createdAt: Date;
    metadata?: Record<string, any>;
}

export interface SimilarityResult {
    entityId: string;
    type: string;
    score: number; // 0-1
    metadata: EmbeddingMetadata;
}

export interface SkillCluster {
    clusterId: string;
    primarySkill: string;
    relatedSkills: string[];
    averageSimilarity: number;
    candidates: {
        candidateId: string;
        relevantSkills: string[];
        proficiencyScore: number;
    }[];
}

export interface SemanticSearchResult {
    candidateId: string;
    resumeId?: string;
    relevanceScore: number;
    matchingSkills: string[];
    summary: string;
}

export interface JobCandidateMatch {
    jobId: string;
    candidates: {
        candidateId: string;
        semanticScore: number;
        skillScore: number;
        experienceScore: number;
        overallScore: number;
        missingSkills: string[];
        matchingSkills: string[];
    }[];
}

export interface AnalyticsInsight {
    type: 'skill_trend' | 'market_gap' | 'candidate_pool' | 'hiring_pattern';
    title: string;
    description: string;
    data: Record<string, any>;
    actionable?: string;
}
