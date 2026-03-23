import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { encodingForModel } from 'js-tiktoken';
import { EmbeddingVector, SimilarityResult, SkillCluster, SemanticSearchResult } from '../interfaces/search.interfaces';

@Injectable()
export class EmbeddingService {
    private readonly logger = new Logger(EmbeddingService.name);
    private openai: OpenAI;
    private pinecone: Pinecone;
    private indexName: string;
    private embeddingModel = 'text-embedding-3-small'; // Fast, cost-effective
    private embeddingDimension = 1536;

    constructor(private configService: ConfigService) {
        const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
        const pineconeKey = this.configService.get<string>('PINECONE_API_KEY');
        const pineconeEnv = this.configService.get<string>('PINECONE_ENVIRONMENT') || 'us-east-1-aws';

        if (!openaiKey) {
            this.logger.warn('OPENAI_API_KEY not configured');
        }
        if (!pineconeKey) {
            this.logger.warn('PINECONE_API_KEY not configured - vector search disabled');
        }

        this.openai = new OpenAI({ apiKey: openaiKey });
        this.indexName = this.configService.get<string>('PINECONE_INDEX_NAME') || 'ats-candidates';

        if (pineconeKey) {
            this.pinecone = new Pinecone({
                apiKey: pineconeKey,
            });
        }
    }

    /**
     * Generate embeddings for text
     */
    async generateEmbedding(text: string): Promise<number[]> {
        try {
            // Truncate text if too long (max ~8K tokens)
            const truncatedText = this.truncateText(text, 5000);

            const response = await this.openai.embeddings.create({
                model: this.embeddingModel,
                input: truncatedText,
            });

            return response.data[0].embedding;
        } catch (error) {
            this.logger.error('Embedding generation failed', error);
            throw new BadRequestException(`Embedding error: ${error.message}`);
        }
    }

    /**
     * Store embedding in vector database
     */
    async storeEmbedding(
        embedding: EmbeddingVector,
        companyId: string,
    ): Promise<void> {
        try {
            if (!this.pinecone) {
                this.logger.warn('Pinecone not configured, skipping vector storage');
                return;
            }

            const index = this.pinecone.Index(this.indexName);

            const vectorId = `${companyId}-${embedding.metadata.type}-${embedding.metadata.entityId}`;

            await index.upsert([
                {
                    id: vectorId,
                    values: embedding.vector,
                    metadata: {
                        ...embedding.metadata,
                        entityId: embedding.metadata.entityId,
                        companyId,
                        text: embedding.text.substring(0, 1000), // Store truncated text
                    } as any,
                },
            ]);

            this.logger.log(`Embedding stored: ${vectorId}`);
        } catch (error) {
            this.logger.error('Failed to store embedding', error);
            // Don't throw - allow fallback to keyword search
        }
    }

    /**
     * Search similar items by embedding
     */
    async findSimilar(
        queryText: string,
        companyId: string,
        filterType?: string,
        limit: number = 10,
    ): Promise<SimilarityResult[]> {
        try {
            if (!this.pinecone) {
                this.logger.warn('Pinecone not configured');
                return [];
            }

            // Generate query embedding
            const queryEmbedding = await this.generateEmbedding(queryText);

            // Search in Pinecone
            const index = this.pinecone.Index(this.indexName);
            const results = await index.query({
                vector: queryEmbedding,
                topK: limit,
                filter: {
                    companyId: { $eq: companyId },
                    ...(filterType && { type: { $eq: filterType } }),
                } as any,
            });

            return results.matches.map(match => ({
                entityId: (match.metadata?.entityId as string) || match.id,
                type: (match.metadata?.type as string) || 'unknown',
                score: match.score || 0,
                metadata: match.metadata as any,
            }));
        } catch (error) {
            this.logger.error('Similarity search failed', error);
            return [];
        }
    }

    /**
     * Cluster skills based on similarity
     */
    async clusterSkills(
        skills: string[],
        companyId: string,
        similarityThreshold: number = 0.75,
    ): Promise<SkillCluster[]> {
        try {
            const clusters: SkillCluster[] = [];
            const processed = new Set<string>();

            for (const skill of skills) {
                if (processed.has(skill)) continue;

                const embedding = await this.generateEmbedding(skill);
                const similar = await this.findSimilar(skill, companyId, 'skill', 10);

                const relatedSkills = similar
                    .filter(s => s.score >= similarityThreshold && s.entityId !== skill)
                    .map(s => (s.metadata?.metadata?.skillName || s.entityId) as string);

                relatedSkills.forEach(s => processed.add(s));
                processed.add(skill);

                clusters.push({
                    clusterId: `cluster-${skill.toLowerCase().replace(/\s+/g, '-')}`,
                    primarySkill: skill,
                    relatedSkills,
                    averageSimilarity: relatedSkills.length > 0
                        ? similar.slice(0, relatedSkills.length).reduce((a, b) => a + b.score, 0) /
                        relatedSkills.length
                        : 1,
                    candidates: [], // Will be populated by consumer
                });
            }

            return clusters;
        } catch (error) {
            this.logger.error('Skill clustering failed', error);
            throw new BadRequestException(`Clustering error: ${error.message}`);
        }
    }

    /**
     * Find candidate by semantic similarity to job description
     */
    async findCandidatesForJob(
        jobDescription: string,
        companyId: string,
        limit: number = 20,
    ): Promise<SemanticSearchResult[]> {
        try {
            const results = await this.findSimilar(
                jobDescription,
                companyId,
                'resume',
                limit,
            );

            return results.map(result => ({
                candidateId: result.metadata?.metadata?.candidateId || result.entityId,
                resumeId: result.entityId,
                relevanceScore: result.score,
                matchingSkills: [], // Would be populated from AI matching
                summary: '',
            }));
        } catch (error) {
            this.logger.error('Job candidate search failed', error);
            return [];
        }
    }

    /**
     * Calculate semantic similarity between two texts
     */
    async calculateSimilarity(
        text1: string,
        text2: string,
    ): Promise<number> {
        try {
            const [emb1, emb2] = await Promise.all([
                this.generateEmbedding(text1),
                this.generateEmbedding(text2),
            ]);

            // Cosine similarity
            return this.cosineSimilarity(emb1, emb2);
        } catch (error) {
            this.logger.error('Similarity calculation failed', error);
            return 0;
        }
    }

    /**
     * Cosine similarity between two vectors
     */
    private cosineSimilarity(a: number[], b: number[]): number {
        const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

        if (magnitudeA === 0 || magnitudeB === 0) return 0;
        return dotProduct / (magnitudeA * magnitudeB);
    }

    /**
     * Truncate text to token limit
     */
    private truncateText(text: string, maxTokens: number): string {
        try {
            const encoding = encodingForModel('text-embedding-3-small');
            const tokens = encoding.encode(text);

            if (tokens.length <= maxTokens) {
                return text;
            }

            // Decode truncated tokens back to text
            const truncated = tokens.slice(0, maxTokens);
            const truncatedText = encoding.decode(truncated);
            return truncatedText;
        } catch (error) {
            this.logger.warn('Token truncation failed, using length-based truncation');
            return text.substring(0, maxTokens * 4); // Rough estimate
        }
    }

    /**
     * Health check for embedding service
     */
    async healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
        try {
            // Test embedding generation
            const testEmbed = await this.generateEmbedding('test');
            if (!testEmbed || testEmbed.length === 0) {
                return { status: 'error', message: 'Embedding generation failed' };
            }

            return { status: 'ok', message: 'Embedding service is operational' };
        } catch (error) {
            return { status: 'error', message: `Health check failed: ${error.message}` };
        }
    }
}
