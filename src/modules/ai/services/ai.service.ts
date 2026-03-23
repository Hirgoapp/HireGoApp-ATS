import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ParsedResume, ScreeningQuestion, CandidateMatch, EmailTemplate } from '../interfaces/ai.interfaces';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Placeholder for usage tracking
interface AiUsageEntry {
    company_id: string;
    operation_type: string;
    tokens_used: number;
    cost: number;
    created_at: Date;
}

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private openai: OpenAI;
    private readonly gpt4Model = 'gpt-4-turbo-preview';
    private readonly gpt35Model = 'gpt-3.5-turbo';

    // Pricing (as of Jan 2026)
    private readonly gpt4Pricing = { input: 0.03, output: 0.06 }; // per 1K tokens
    private readonly gpt35Pricing = { input: 0.0015, output: 0.002 }; // per 1K tokens

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) {
            this.logger.warn('OPENAI_API_KEY not configured - AI features will be limited');
        }
        this.openai = new OpenAI({ apiKey });
    }

    /**
     * Parse resume using GPT-4 Vision and structured extraction
     */
    async parseResume(resumeText: string, companyId?: string): Promise<ParsedResume> {
        try {
            this.logger.log(`Parsing resume for company ${companyId}`);

            const systemPrompt = `You are an expert resume parser. Extract all relevant information from the resume and return it as a structured JSON object with the following fields:
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "summary": "string",
  "skills": ["array of skills"],
  "experience": [{"company": "string", "position": "string", "startDate": "YYYY-MM", "endDate": "YYYY-MM or 'Present'", "description": "string", "keyAchievements": ["array of achievements"]}],
  "education": [{"school": "string", "degree": "string", "field": "string", "graduationDate": "YYYY-MM"}],
  "certifications": ["array of certifications"],
  "languages": ["array of languages"],
  "softSkills": ["array of soft skills"],
  "yearsOfExperience": number
}

Be thorough and accurate. If information is not found, use null or empty arrays.`;

            const response = await this.openai.chat.completions.create({
                model: this.gpt4Model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: `Parse this resume:\n\n${resumeText}`,
                    },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.3, // Lower temp for consistency
                max_tokens: 2000,
            });

            const content = response.choices[0].message.content;
            if (!content) {
                throw new BadRequestException('Failed to parse resume');
            }

            const parsed: ParsedResume = JSON.parse(content);

            // Track usage
            if (companyId) {
                this.trackUsage(companyId, 'resume_parsing', response.usage?.total_tokens || 0);
            }

            return parsed;
        } catch (error) {
            this.logger.error('Resume parsing failed', error);
            throw new BadRequestException(`Resume parsing error: ${error.message}`);
        }
    }

    /**
     * Generate screening questions for a job
     */
    async generateScreeningQuestions(
        jobDescription: string,
        requiredSkills: string[],
        companyId?: string,
    ): Promise<ScreeningQuestion[]> {
        try {
            this.logger.log(`Generating screening questions for job`);

            const skillsText = requiredSkills.join(', ');
            const systemPrompt = `You are an expert recruiter who creates insightful screening questions. Generate screening questions as a JSON array with this structure:
[
  {
    "question": "string",
    "category": "technical" | "behavioral" | "experience" | "culture_fit",
    "difficulty": "basic" | "intermediate" | "advanced",
    "weight": number (1-10)
  }
]

Create 5-8 questions that effectively screen candidates. Make them thoughtful and revealing.`;

            const response = await this.openai.chat.completions.create({
                model: this.gpt35Model, // Cheaper model for this
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: `Job Description:\n${jobDescription}\n\nRequired Skills: ${skillsText}`,
                    },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.7, // Higher for creativity
                max_tokens: 2000,
            });

            const content = response.choices[0].message.content;
            if (!content) {
                throw new BadRequestException('Failed to generate questions');
            }

            const result = JSON.parse(content);
            const questions: ScreeningQuestion[] = Array.isArray(result) ? result : result.questions;

            // Track usage
            if (companyId) {
                this.trackUsage(companyId, 'screening_questions', response.usage?.total_tokens || 0);
            }

            return questions;
        } catch (error) {
            this.logger.error('Question generation failed', error);
            throw new BadRequestException(`Question generation error: ${error.message}`);
        }
    }

    /**
     * Match candidate resume to job description
     */
    async matchCandidateToJob(
        candidateResume: ParsedResume,
        jobDescription: string,
        jobRequirements: string[],
        candidateId: string,
        companyId?: string,
    ): Promise<CandidateMatch> {
        try {
            this.logger.log(`Matching candidate ${candidateId} to job`);

            const systemPrompt = `You are an expert talent matcher. Analyze candidate skills against job requirements and return a JSON object:
{
  "skillMatch": number (0-100),
  "experienceMatch": number (0-100),
  "cultureFitScore": number (0-100),
  "missingSkills": ["array of missing skills"],
  "matchingSkills": ["array of matched skills"],
  "recommendation": "strong_fit" | "good_fit" | "fair_fit" | "poor_fit",
  "analysis": "brief explanation"
}`;

            const requiredSkillsText = jobRequirements.join(', ');
            const candidateSkillsText = candidateResume.skills.join(', ');

            const response = await this.openai.chat.completions.create({
                model: this.gpt35Model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: `Job Description: ${jobDescription}\n\nRequired Skills: ${requiredSkillsText}\n\nCandidate Skills: ${candidateSkillsText}\n\nCandidate Experience (years): ${candidateResume.yearsOfExperience}\n\nCandidate Background: ${candidateResume.summary}`,
                    },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.4,
                max_tokens: 1500,
            });

            const content = response.choices[0].message.content;
            if (!content) {
                throw new BadRequestException('Failed to match candidate');
            }

            const matchData = JSON.parse(content);
            const overallScore =
                (matchData.skillMatch * 0.4 +
                    matchData.experienceMatch * 0.35 +
                    matchData.cultureFitScore * 0.25) /
                100;

            // Track usage
            if (companyId) {
                this.trackUsage(companyId, 'candidate_matching', response.usage?.total_tokens || 0);
            }

            return {
                candidateId,
                score: Math.round(overallScore * 100),
                skillMatch: matchData.skillMatch,
                experienceMatch: matchData.experienceMatch,
                cultureFitScore: matchData.cultureFitScore,
                missingSkills: matchData.missingSkills,
                matchingSkills: matchData.matchingSkills,
                recommendation: matchData.recommendation,
            };
        } catch (error) {
            this.logger.error('Candidate matching failed', error);
            throw new BadRequestException(`Matching error: ${error.message}`);
        }
    }

    /**
     * Evaluate candidate response to screening question
     */
    async evaluateResponse(
        question: string,
        candidateResponse: string,
        companyId?: string,
    ): Promise<{
        score: number;
        feedback: string;
        strengths: string[];
        improvements: string[];
        redFlags: string[];
    }> {
        try {
            this.logger.log('Evaluating candidate response');

            const systemPrompt = `You are an expert interviewer. Evaluate the candidate's response and return JSON:
{
  "score": number (0-100),
  "feedback": "constructive feedback",
  "strengths": ["array of strengths shown"],
  "improvements": ["areas to improve"],
  "redFlags": ["any concerning behaviors or knowledge gaps"]
}`;

            const response = await this.openai.chat.completions.create({
                model: this.gpt35Model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: `Question: ${question}\n\nCandidate Response: ${candidateResponse}`,
                    },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.5,
                max_tokens: 1000,
            });

            const content = response.choices[0].message.content;
            if (!content) {
                throw new BadRequestException('Failed to evaluate response');
            }

            const evaluation = JSON.parse(content);

            // Track usage
            if (companyId) {
                this.trackUsage(companyId, 'response_evaluation', response.usage?.total_tokens || 0);
            }

            return evaluation;
        } catch (error) {
            this.logger.error('Response evaluation failed', error);
            throw new BadRequestException(`Evaluation error: ${error.message}`);
        }
    }

    /**
     * Generate personalized email
     */
    async generateEmail(
        emailType: 'rejection' | 'interview_invitation' | 'offer' | 'follow_up',
        candidateName: string,
        position: string,
        context?: string,
        companyId?: string,
    ): Promise<EmailTemplate> {
        try {
            this.logger.log(`Generating ${emailType} email for ${candidateName}`);

            const systemPrompt = `You are an expert recruiter writing professional emails. Generate a warm, professional, and personalized email. Return JSON:
{
  "content": "the full email body (not including subject or greeting)",
  "personalizationNotes": "suggestions for personalizing further"
}`;

            const contextText = context ? `\n\nAdditional Context: ${context}` : '';

            const response = await this.openai.chat.completions.create({
                model: this.gpt35Model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: `Write a ${emailType} email for ${candidateName} for the ${position} position.${contextText}`,
                    },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.8,
                max_tokens: 1500,
            });

            const content = response.choices[0].message.content;
            if (!content) {
                throw new BadRequestException('Failed to generate email');
            }

            const emailData = JSON.parse(content);

            // Track usage
            if (companyId) {
                this.trackUsage(companyId, 'email_generation', response.usage?.total_tokens || 0);
            }

            return {
                type: emailType,
                candidateName,
                position,
                content: emailData.content,
                personalizationNotes: emailData.personalizationNotes,
            };
        } catch (error) {
            this.logger.error('Email generation failed', error);
            throw new BadRequestException(`Email generation error: ${error.message}`);
        }
    }

    /**
     * Analyze interview transcript
     */
    async analyzeInterviewTranscript(
        transcript: string,
        companyId?: string,
    ): Promise<{
        keyInsights: string[];
        sentiment: 'positive' | 'neutral' | 'negative';
        technicalScore?: number;
        communicationScore?: number;
        overallImpression: string;
        recommendedNextSteps: string[];
    }> {
        try {
            this.logger.log('Analyzing interview transcript');

            const systemPrompt = `You are an expert interview analyst. Analyze the transcript and return JSON:
{
  "keyInsights": ["array of key insights from interview"],
  "sentiment": "positive" | "neutral" | "negative",
  "technicalScore": number (0-100, if applicable),
  "communicationScore": number (0-100),
  "overallImpression": "brief summary of candidate impression",
  "recommendedNextSteps": ["array of recommendations"]
}`;

            const response = await this.openai.chat.completions.create({
                model: this.gpt4Model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: `Analyze this interview transcript:\n\n${transcript}`,
                    },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.4,
                max_tokens: 2000,
            });

            const content = response.choices[0].message.content;
            if (!content) {
                throw new BadRequestException('Failed to analyze transcript');
            }

            const analysis = JSON.parse(content);

            // Track usage
            if (companyId) {
                this.trackUsage(companyId, 'transcript_analysis', response.usage?.total_tokens || 0);
            }

            return analysis;
        } catch (error) {
            this.logger.error('Transcript analysis failed', error);
            throw new BadRequestException(`Analysis error: ${error.message}`);
        }
    }

    /**
     * Track AI API usage for billing
     */
    private trackUsage(companyId: string, operationType: string, tokensUsed: number): void {
        // Calculate cost based on tokens
        const isPricey = operationType.includes('resume_parsing') || operationType.includes('transcript');
        const pricingModel = isPricey ? this.gpt4Pricing : this.gpt35Pricing;
        const estimatedCost = (tokensUsed / 1000) * (pricingModel.input + pricingModel.output) / 2; // Average

        this.logger.log(
            `Usage tracked: company=${companyId}, operation=${operationType}, tokens=${tokensUsed}, cost=$${estimatedCost.toFixed(4)}`
        );

        // In production, save this to database for billing
        // This would be: await this.usageRepository.save({ ... })
    }

    /**
     * Health check for AI service
     */
    async healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
        try {
            const apiKey = this.configService.get<string>('OPENAI_API_KEY');
            if (!apiKey) {
                return { status: 'error', message: 'OPENAI_API_KEY not configured' };
            }

            // Make a small test call
            await this.openai.models.list();
            return { status: 'ok', message: 'OpenAI API is accessible' };
        } catch (error) {
            return { status: 'error', message: `OpenAI API error: ${error.message}` };
        }
    }
}
