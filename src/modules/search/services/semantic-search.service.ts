import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AiService } from '../../ai/services/ai.service';
import { EmbeddingService } from './embedding.service';
import { ParsedResume, CandidateMatch } from '../../ai/interfaces/ai.interfaces';
import { JobCandidateMatch, SemanticSearchResult } from '../interfaces/search.interfaces';

@Injectable()
export class SemanticSearchService {
    private readonly logger = new Logger(SemanticSearchService.name);

    constructor(
        private embeddingService: EmbeddingService,
        private aiService: AiService,
    ) { }

    /**
     * Advanced search combining semantic similarity + AI matching
     */
    async findBestCandidatesForJob(
        jobDescription: string,
        jobRequirements: string[],
        companyId: string,
        limit: number = 20,
    ): Promise<JobCandidateMatch> {
        try {
            this.logger.log(`Searching for candidates for job (company: ${companyId})`);

            // Step 1: Get candidates by semantic similarity
            const semanticResults = await this.embeddingService.findCandidatesForJob(
                jobDescription,
                companyId,
                limit * 2, // Get more to filter
            );

            if (semanticResults.length === 0) {
                return {
                    jobId: 'unknown',
                    candidates: [],
                };
            }

            // Step 2: For each candidate, get detailed AI matching
            const detailedMatches = await Promise.all(
                semanticResults.slice(0, limit).map(async (candidate) => {
                    try {
                        // In production, fetch actual resume from database
                        // For now, we'll use placeholder
                        const mockResume: ParsedResume = {
                            fullName: `Candidate ${candidate.candidateId}`,
                            email: 'candidate@example.com',
                            phone: '',
                            location: '',
                            summary: candidate.summary,
                            skills: candidate.matchingSkills,
                            experience: [],
                            education: [],
                            certifications: [],
                            languages: [],
                            softSkills: [],
                            yearsOfExperience: 5,
                        };

                        const aiMatch = await this.aiService.matchCandidateToJob(
                            mockResume,
                            jobDescription,
                            jobRequirements,
                            candidate.candidateId,
                            companyId,
                        );

                        // Combine semantic score (40%) with AI score (60%)
                        const semanticWeight = 0.4;
                        const aiWeight = 0.6;
                        const combinedScore =
                            candidate.relevanceScore * semanticWeight +
                            (aiMatch.score / 100) * aiWeight;

                        return {
                            candidateId: candidate.candidateId,
                            semanticScore: candidate.relevanceScore,
                            skillScore: aiMatch.skillMatch,
                            experienceScore: aiMatch.experienceMatch,
                            overallScore: Math.round(combinedScore * 100),
                            missingSkills: aiMatch.missingSkills,
                            matchingSkills: aiMatch.matchingSkills,
                        };
                    } catch (error) {
                        this.logger.error(`Failed to match candidate ${candidate.candidateId}`, error);
                        return null;
                    }
                }),
            );

            // Filter out failed matches and sort by score
            const candidates = detailedMatches
                .filter(m => m !== null)
                .sort((a, b) => b!.overallScore - a!.overallScore)
                .slice(0, limit) as any[];

            return {
                jobId: 'unknown',
                candidates,
            };
        } catch (error) {
            this.logger.error('Advanced search failed', error);
            throw new BadRequestException(`Search error: ${error.message}`);
        }
    }

    /**
     * Find similar candidates
     */
    async findSimilarCandidates(
        candidateId: string,
        companyId: string,
        limit: number = 10,
    ): Promise<SemanticSearchResult[]> {
        try {
            this.logger.log(`Finding similar candidates to ${candidateId}`);

            // In production, fetch actual resume text from database
            const mockResumeText = `Similar candidates search for ${candidateId}`;

            const results = await this.embeddingService.findSimilar(
                mockResumeText,
                companyId,
                'resume',
                limit,
            );

            return results.map(result => ({
                candidateId: (result.metadata?.metadata?.candidateId as string) || result.entityId,
                resumeId: result.entityId,
                relevanceScore: result.score,
                matchingSkills: [],
                summary: '',
            }));
        } catch (error) {
            this.logger.error('Similar candidates search failed', error);
            return [];
        }
    }

    /**
     * Search candidates by skill combination
     */
    async findCandidatesBySkills(
        skills: string[],
        companyId: string,
        matchAllSkills: boolean = false,
        limit: number = 20,
    ): Promise<SemanticSearchResult[]> {
        try {
            this.logger.log(`Searching candidates with skills: ${skills.join(', ')}`);

            // Combine multiple skill searches
            const allResults: Map<string, number> = new Map();

            for (const skill of skills) {
                const results = await this.embeddingService.findSimilar(
                    skill,
                    companyId,
                    'resume',
                    limit * 2,
                );

                results.forEach(result => {
                    const current = allResults.get(result.entityId) || 0;
                    allResults.set(result.entityId, current + result.score);
                });
            }

            // Convert to sorted array
            const candidates = Array.from(allResults.entries())
                .map(([candidateId, totalScore]) => ({
                    candidateId,
                    resumeId: candidateId,
                    relevanceScore: totalScore / skills.length, // Average score
                    matchingSkills: skills,
                    summary: '',
                }))
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, limit);

            return candidates;
        } catch (error) {
            this.logger.error('Skill-based search failed', error);
            return [];
        }
    }
}
