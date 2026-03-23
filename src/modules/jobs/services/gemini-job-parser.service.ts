import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIJobExtractionResult } from '../interfaces/ai-extraction.interface';

@Injectable()
export class GeminiJobParserService {
    private readonly logger = new Logger(GeminiJobParserService.name);
    private readonly genAI: GoogleGenerativeAI;
    private readonly model: string;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        this.model = this.configService.get<string>('GEMINI_MODEL') || 'gemini-1.5-flash';

        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
    }

    /**
     * Extract job details from email/JD using Gemini AI
     */
    async extractJobDetails(emailContent: string): Promise<AIJobExtractionResult> {
        if (!this.genAI) {
            this.logger.warn('Gemini API key not configured, skipping Gemini extraction');
            return { confidence: 0 };
        }

        try {
            const prompt = this.buildExtractionPrompt(emailContent);
            const model = this.genAI.getGenerativeModel({ model: this.model });

            const result = await model.generateContent({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }],
                    },
                ],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 2000,
                },
            });

            const response = await result.response;
            const content = response.text();

            if (!content) {
                this.logger.warn('No content in Gemini response');
                return { confidence: 0 };
            }

            // Parse the JSON response
            const extracted = this.parseAIResponse(content);

            this.logger.log(`Gemini extraction completed with confidence: ${extracted.confidence}`);
            return extracted;

        } catch (error) {
            this.logger.error(`Gemini extraction failed: ${error.message}`);
            return { confidence: 0 };
        }
    }

    /**
     * Build extraction prompt
     */
    private buildExtractionPrompt(emailContent: string): string {
        return `You are a specialized AI assistant for extracting structured job requirement data from emails and job descriptions. 

Extract structured job requirement data from the following email/JD. Return ONLY valid JSON with these fields:

{
  "client_req_id": "ECMS or requirement ID (string)",
  "title": "Job title (string)",
  "client_code": "Client code like EAIS, HILDGTL (string)",
  "domain_industry": "Industry/domain (string)",
  "pu_unit": "PU/Business unit (string)",
  "openings": "Number of positions (number)",
  "required_skills": ["skill1", "skill2"],
  "desired_skills": ["skill1", "skill2"],
  "total_experience": "Years required (string)",
  "relevant_experience": "Relevant experience (string)",
  "work_locations": ["location1", "location2"],
  "work_mode": "WFO/WFH/Hybrid (string)",
  "interview_mode": "Interview type (string)",
  "background_check_timing": "Before/After onboarding (string)",
  "vendor_rate_text": "Full rate text (string)",
  "vendor_rate_value": "Numeric rate (number)",
  "vendor_rate_currency": "INR/USD (string)",
  "vendor_rate_unit": "day/hour/month (string)",
  "submission_email": "Email for submissions (string)",
  "client_project_manager": "PM name (string)",
  "delivery_spoc": "Delivery SPOC name (string)",
  "confidence": "Confidence 0-1 (number)"
}

Email/JD Content:
${emailContent.substring(0, 8000)}

Return ONLY the JSON object, no markdown formatting or explanations.`;
    }

    /**
     * Parse AI response to structured result
     */
    private parseAIResponse(content: string): AIJobExtractionResult {
        try {
            // Remove markdown code blocks if present
            let cleanContent = content.trim();
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/```\n?/g, '');
            }

            const parsed = JSON.parse(cleanContent);

            // Ensure confidence is set
            if (typeof parsed.confidence !== 'number') {
                parsed.confidence = 0.75; // Default good confidence for Gemini
            }

            return parsed;
        } catch (error) {
            this.logger.error(`Failed to parse Gemini response: ${error.message}`);
            this.logger.debug(`Raw content: ${content}`);
            return { confidence: 0 };
        }
    }

    /**
     * Check if Gemini service is available
     */
    isAvailable(): boolean {
        return !!this.genAI;
    }
}
