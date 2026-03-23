import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIJobExtractionResult } from '../interfaces/ai-extraction.interface';

@Injectable()
export class AIJobParserService {
    private readonly logger = new Logger(AIJobParserService.name);
    private readonly apiKey: string;
    private readonly baseUrl: string;
    private readonly model: string;

    constructor(private readonly configService: ConfigService) {
        this.apiKey = this.configService.get<string>('SAMBANOVA_API_KEY');
        this.baseUrl = this.configService.get<string>('SAMBANOVA_BASE_URL') || 'https://api.sambanova.ai/v1';
        this.model = this.configService.get<string>('SAMBANOVA_MODEL') || 'Meta-Llama-3.1-70B-Instruct';
    }

    /**
     * Extract job details from email/JD using AI
     */
    async extractJobDetails(emailContent: string): Promise<AIJobExtractionResult> {
        if (!this.apiKey) {
            this.logger.warn('Sambanova API key not configured, skipping AI extraction');
            return { confidence: 0 };
        }

        try {
            const prompt = this.buildExtractionPrompt(emailContent);

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a specialized AI assistant for extracting structured job requirement data from emails and job descriptions. Always respond with valid JSON only, no markdown or explanations.',
                        },
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                    temperature: 0.1,
                    max_tokens: 2000,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                this.logger.error(`Sambanova API error: ${response.status} - ${error}`);
                return { confidence: 0 };
            }

            const data: any = await response.json();
            const content = data.choices?.[0]?.message?.content;

            if (!content) {
                this.logger.warn('No content in AI response');
                return { confidence: 0 };
            }

            // Parse the JSON response
            const extracted = this.parseAIResponse(content);

            this.logger.log(`AI extraction completed with confidence: ${extracted.confidence}`);
            return extracted;

        } catch (error) {
            this.logger.error(`AI extraction failed: ${error.message}`);
            return { confidence: 0 };
        }
    }

    /**
     * Build extraction prompt
     */
    private buildExtractionPrompt(emailContent: string): string {
        return `Extract structured job requirement data from the following email/JD. Return ONLY valid JSON with these fields:

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

Return ONLY the JSON object, no markdown formatting.`;
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
                parsed.confidence = 0.8; // Default high confidence if AI didn't provide
            }

            return parsed;
        } catch (error) {
            this.logger.error(`Failed to parse AI response: ${error.message}`);
            this.logger.debug(`Raw content: ${content}`);
            return { confidence: 0 };
        }
    }

    /**
     * Check if AI service is available
     */
    isAvailable(): boolean {
        return !!this.apiKey;
    }
}
