import { Injectable, Logger } from '@nestjs/common';
import { AIJobParserService } from './ai-job-parser.service';
import { GeminiJobParserService } from './gemini-job-parser.service';
import { AIJobExtractionResult } from '../interfaces/ai-extraction.interface';

@Injectable()
export class HybridAIParserService {
    private readonly logger = new Logger(HybridAIParserService.name);

    constructor(
        private readonly sambaNovaParser: AIJobParserService,
        private readonly geminiParser: GeminiJobParserService,
    ) { }

    /**
     * Extract job details using hybrid AI approach:
     * 1. Try Sambanova first (primary provider)
     * 2. If Sambanova fails or has low confidence, try Gemini (fallback provider)
     * 3. Return the best result based on confidence score
     */
    async extractJobDetails(emailContent: string): Promise<AIJobExtractionResult> {
        const results: AIJobExtractionResult[] = [];

        // Try Sambanova first
        if (this.sambaNovaParser.isAvailable()) {
            this.logger.log('Attempting extraction with Sambanova AI...');
            try {
                const sambaResult = await this.sambaNovaParser.extractJobDetails(emailContent);
                if (sambaResult.confidence > 0) {
                    sambaResult.provider = 'Sambanova';
                    results.push(sambaResult);
                    this.logger.log(`Sambanova extraction: confidence ${sambaResult.confidence}`);

                    // If Sambanova has high confidence (>0.7), use it directly
                    if (sambaResult.confidence > 0.7) {
                        this.logger.log('Using Sambanova result (high confidence)');
                        return sambaResult;
                    }
                }
            } catch (error) {
                this.logger.warn(`Sambanova extraction failed: ${error.message}`);
            }
        } else {
            this.logger.log('Sambanova not available, skipping');
        }

        // Try Gemini as fallback
        if (this.geminiParser.isAvailable()) {
            this.logger.log('Attempting extraction with Gemini AI...');
            try {
                const geminiResult = await this.geminiParser.extractJobDetails(emailContent);
                if (geminiResult.confidence > 0) {
                    geminiResult.provider = 'Gemini';
                    results.push(geminiResult);
                    this.logger.log(`Gemini extraction: confidence ${geminiResult.confidence}`);
                }
            } catch (error) {
                this.logger.warn(`Gemini extraction failed: ${error.message}`);
            }
        } else {
            this.logger.log('Gemini not available, skipping');
        }

        // If no results, return empty
        if (results.length === 0) {
            this.logger.warn('No AI providers available or all failed');
            return { confidence: 0, provider: 'none' };
        }

        // Return the result with highest confidence
        const bestResult = results.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
        );

        this.logger.log(`Using ${bestResult.provider} result with confidence ${bestResult.confidence}`);
        return bestResult;
    }

    /**
     * Try all providers and merge results (advanced mode)
     * Takes the best field from each provider based on confidence
     */
    async extractAndMerge(emailContent: string): Promise<AIJobExtractionResult> {
        const sambaPromise = this.sambaNovaParser.isAvailable()
            ? this.sambaNovaParser.extractJobDetails(emailContent).catch(() => ({ confidence: 0 }))
            : Promise.resolve({ confidence: 0 });

        const geminiPromise = this.geminiParser.isAvailable()
            ? this.geminiParser.extractJobDetails(emailContent).catch(() => ({ confidence: 0 }))
            : Promise.resolve({ confidence: 0 });

        const [sambaResult, geminiResult] = await Promise.all([sambaPromise, geminiPromise]);

        // Merge results, preferring higher confidence provider for each field
        const merged: AIJobExtractionResult = { confidence: 0, provider: 'merged' };

        const allKeys = new Set([
            ...Object.keys(sambaResult),
            ...Object.keys(geminiResult),
        ]);

        for (const key of allKeys) {
            if (key === 'confidence' || key === 'provider') continue;

            const sambaValue = sambaResult[key];
            const geminiValue = geminiResult[key];

            // Use the value from the provider with higher overall confidence
            if (sambaResult.confidence >= geminiResult.confidence && sambaValue !== undefined) {
                merged[key] = sambaValue;
            } else if (geminiValue !== undefined) {
                merged[key] = geminiValue;
            }
        }

        // Set merged confidence as average of available providers
        const avgConfidence = (sambaResult.confidence + geminiResult.confidence) / 2;
        merged.confidence = avgConfidence;

        this.logger.log(`Merged result with average confidence: ${avgConfidence}`);
        return merged;
    }

    /**
     * Check if any AI provider is available
     */
    isAvailable(): boolean {
        return this.sambaNovaParser.isAvailable() || this.geminiParser.isAvailable();
    }

    /**
     * Get status of all providers
     */
    getProvidersStatus(): { sambanova: boolean; gemini: boolean; anyAvailable: boolean } {
        return {
            sambanova: this.sambaNovaParser.isAvailable(),
            gemini: this.geminiParser.isAvailable(),
            anyAvailable: this.isAvailable(),
        };
    }
}
