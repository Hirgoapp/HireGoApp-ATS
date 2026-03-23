import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../entities/job.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EmailParserService, ParsedEmailData } from './email-parser.service';
import { HybridAIParserService } from './hybrid-ai-parser.service';
import mammoth from 'mammoth';

/**
 * Service for handling JD file uploads and text extraction
 * Supports PDF, DOCX, TXT; PDFs use text layer first, then optional OCR for scanned pages.
 */
@Injectable()
export class JdFileService {
    private readonly uploadDir = path.join(process.cwd(), 'uploads', 'jd-files');

    constructor(
        @InjectRepository(Job)
        private readonly jobRepository: Repository<Job>,
        private readonly emailParser: EmailParserService,
        private readonly hybridAIParser: HybridAIParserService,
        private readonly config: ConfigService,
    ) {
        // Ensure upload directory exists
        this.ensureUploadDir();
    }

    private async ensureUploadDir() {
        try {
            await fs.mkdir(this.uploadDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create upload directory:', error);
        }
    }

    /**
     * Process and store uploaded JD file
     * Extracts text content and updates job record
     */
    async processAndStoreJdFile(jobId: string, file: Express.Multer.File) {
        // Find the job
        const job = await this.jobRepository.findOne({
            where: { id: jobId },
        });

        if (!job) {
            throw new NotFoundException(`Job with ID ${jobId} not found`);
        }

        // Generate unique filename
        const fileExtension = path.extname(file.originalname);
        const uniqueFilename = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(this.uploadDir, uniqueFilename);

        // Save file to disk (support both memory and disk storage)
        const anyFile: any = file as any;
        if (file.buffer && file.buffer.length) {
            await fs.writeFile(filePath, file.buffer);
        } else if (anyFile.path) {
            // File already stored by Multer diskStorage; copy/move to our managed path
            try {
                await fs.copyFile(anyFile.path, filePath);
            } catch (copyErr) {
                console.error('Failed to copy uploaded file from temp path:', copyErr);
                throw copyErr;
            }
        } else {
            throw new Error('Uploaded file is missing buffer/path');
        }

        // Extract text based on file type
        let extractedText = '';
        try {
            extractedText = await this.extractTextFromFile(filePath, file.mimetype);
        } catch (error) {
            console.error('Text extraction failed:', error);
            // Continue even if extraction fails - user can still download original file
        }

        // If an email file was uploaded and text was extracted, parse email fields
        const ext = path.extname(file.originalname || '').toLowerCase();
        const isEmailFile = file.mimetype === 'message/rfc822' || ext === '.eml' || ext === '.msg';
        if (isEmailFile && extractedText) {
            try {
                const parsed = this.emailParser.parse(extractedText);
                job.raw_email_content = parsed.rawEmail || extractedText;
                job.extracted_fields = parsed.extractedFields || {};
                job.candidate_tracker_format = parsed.candidateTracker || null;
                // Flatten submission guidelines to a readable string if present
                if (parsed.submissionGuidelines) {
                    const g = parsed.submissionGuidelines;
                    const guidelinesText = [
                        g.email ? `Submission Email: ${g.email}` : null,
                        g.interviewScreenshot ? `Interview Screenshot: ${g.interviewScreenshot}` : null,
                        g.platforms?.length ? `Platforms: ${g.platforms.join(', ')}` : null,
                        g.notAllowed?.length ? `Not Allowed: ${g.notAllowed.join(', ')}` : null,
                        g.complianceNotes ? `Notes: ${g.complianceNotes}` : null,
                    ].filter(Boolean).join('\n');
                    job.submission_guidelines = guidelinesText || null;
                }
                job.jd_metadata = parsed.jdMetadata || null;

                // Hydrate primary job fields when available
                this.applyParsedFields(job, parsed);

                // Use Hybrid AI for enhanced extraction (tries Sambanova → Gemini)
                if (this.hybridAIParser.isAvailable()) {
                    console.log('Using Hybrid AI extraction for enhanced parsing...');
                    const providerStatus = this.hybridAIParser.getProvidersStatus();
                    console.log('AI Providers available:', providerStatus);

                    try {
                        const aiResult = await this.hybridAIParser.extractJobDetails(extractedText);
                        if (aiResult.confidence > 0.5) {
                            console.log(`AI extraction successful with ${aiResult.provider} (confidence: ${aiResult.confidence})`);
                            this.applyAIFields(job, aiResult);
                        } else {
                            console.log(`AI extraction had low confidence (${aiResult.confidence}), using only regex results`);
                        }
                    } catch (aiError) {
                        console.warn('AI extraction failed, falling back to regex parsing:', aiError);
                    }
                } else {
                    console.log('No AI providers available, using only regex parsing');
                }
            } catch (e) {
                console.warn('Email parse failed, continuing with raw content. Error:', e);
            }
        }

        // Update job with file info
        const fileMetadata = {
            filename: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
            uploadedAt: new Date().toISOString(),
            extractedText: extractedText.substring(0, 1000), // Store first 1000 chars as preview
        };

        job.jd_file_url = `/uploads/jd-files/${uniqueFilename}`;
        job.jd_file_metadata = fileMetadata;
        job.jd_content = extractedText || job.jd_content; // Use extracted text if available
        job.jd_format = 'plain';
        job.use_dynamic_jd = true;

        // Populate structured JD sections for nicer UI rendering
        if (extractedText && (!job.jd_sections || job.jd_sections.length === 0)) {
            try {
                const sections = await this.parseJdIntoSections(extractedText);
                job.jd_sections = sections;
            } catch (err) {
                console.warn('JD section parsing failed; continuing without sections:', err);
            }
        }

        await this.jobRepository.save(job);

        return {
            fileUrl: job.jd_file_url,
            metadata: fileMetadata,
            extractedLength: extractedText.length,
        };
    }

    /**
     * Extract text from uploaded file based on type
     */
    private async extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
        if (mimeType === 'text/plain') {
            // Plain text - just read the file
            return await fs.readFile(filePath, 'utf-8');
        } else if (mimeType === 'message/rfc822' || filePath.toLowerCase().endsWith('.eml')) {
            // EML email - treat as plain text and return entire content
            try {
                return await fs.readFile(filePath, 'utf-8');
            } catch (error) {
                console.error('EML read error:', error);
                return '';
            }
        } else if (filePath.toLowerCase().endsWith('.msg')) {
            // Outlook .msg format - proprietary binary; skip extraction for now
            return '[MSG format detected. Text extraction not configured.]';
        } else if (mimeType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) {
            return await this.extractFromPdf(filePath);
        } else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            filePath.toLowerCase().endsWith('.docx')
        ) {
            return await this.extractFromDocx(filePath);
        } else if (mimeType === 'application/msword' || filePath.toLowerCase().endsWith('.doc')) {
            return '[Legacy binary .doc is not supported; save as .docx or PDF and re-upload.]';
        }

        return '';
    }

    /**
     * Extract text from PDF: text layer via pdf-parse, then optional Tesseract OCR for scans.
     */
    private async extractFromPdf(filePath: string): Promise<string> {
        try {
            const dataBuffer = await fs.readFile(filePath);
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const pdfParseMod = require('pdf-parse');
            const pdfParse = pdfParseMod.default ?? pdfParseMod;
            const data = await pdfParse(dataBuffer);
            const text = (data.text || '').trim();

            const minChars = this.pdfOcrMinChars();
            if (text.length >= minChars) {
                return text;
            }

            if (!this.isPdfOcrEnabled()) {
                return (
                    text ||
                    '[PDF has little or no text layer (often a scan). Enable JD_PDF_OCR_ENABLED=true to run OCR.]'
                );
            }

            const ocrText = await this.tryOcrScannedPdf(filePath);
            if (ocrText.length > 0) {
                return ocrText;
            }

            return (
                text ||
                '[PDF: no text layer and OCR produced no usable text (try a clearer scan or a text-based PDF).]'
            );
        } catch (error) {
            console.error('PDF extraction error:', error);
            return '';
        }
    }

    private isPdfOcrEnabled(): boolean {
        return String(this.config.get<string>('JD_PDF_OCR_ENABLED', 'true')).toLowerCase() !== 'false';
    }

    private pdfOcrMinChars(): number {
        const n = parseInt(String(this.config.get<string>('JD_PDF_OCR_MIN_CHARS', '80')), 10);
        return Number.isFinite(n) && n >= 0 ? n : 80;
    }

    private pdfOcrMaxPages(): number {
        const n = parseInt(String(this.config.get<string>('JD_PDF_OCR_MAX_PAGES', '8')), 10);
        return Math.min(25, Math.max(1, Number.isFinite(n) ? n : 8));
    }

    private pdfOcrLang(): string {
        return (this.config.get<string>('JD_PDF_OCR_LANG', 'eng') || 'eng').trim() || 'eng';
    }

    /**
     * Rasterize PDF pages (pdf.js via pdf-to-img) and OCR with tesseract.js.
     * Best-effort: slower on first run (downloads language data); capped pages for safety.
     */
    private async tryOcrScannedPdf(filePath: string): Promise<string> {
        try {
            const { pdf } = await import('pdf-to-img');
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { recognize } = require('tesseract.js') as {
                recognize: (
                    image: Buffer,
                    lang: string,
                    opts?: { logger?: (m: unknown) => void },
                ) => Promise<{ data: { text?: string } }>;
            };

            const doc = await pdf(filePath, { scale: 2 });
            const maxPages = this.pdfOcrMaxPages();
            const lang = this.pdfOcrLang();
            const parts: string[] = [];
            let page = 0;

            for await (const image of doc) {
                page += 1;
                if (page > maxPages) {
                    parts.push(`\n[OCR truncated after ${maxPages} pages.]`);
                    break;
                }
                const { data } = await recognize(image, lang, {
                    logger: () => undefined,
                });
                const chunk = (data?.text || '').replace(/\f/g, '\n').trim();
                if (chunk) {
                    parts.push(chunk);
                }
            }

            return parts.join('\n\n').trim();
        } catch (err) {
            console.warn('PDF OCR fallback failed:', (err as Error)?.message || err);
            return '';
        }
    }

    /**
     * Extract text from DOCX (Office Open XML) via mammoth.
     */
    private async extractFromDocx(filePath: string): Promise<string> {
        try {
            const result = await mammoth.extractRawText({ path: filePath });
            const text = (result.value || '').trim();
            if (result.messages?.length) {
                const warns = result.messages.filter((m) => m.type === 'warning').map((m) => m.message);
                if (warns.length) {
                    console.warn('DOCX extraction warnings:', warns.slice(0, 3).join('; '));
                }
            }
            return text || '[DOCX contained no readable text.]';
        } catch (error) {
            console.error('DOCX extraction error:', error);
            return '';
        }
    }

    /**
     * Apply parsed email fields onto the Job entity when missing
     */
    private applyParsedFields(job: Job, parsed: ParsedEmailData): void {
        const fields = parsed.extractedFields || {};
        const metadata = parsed.jdMetadata || {};
        const guidelines = parsed.submissionGuidelines || {};

        if (!job.client_req_id && fields.ecmsReqId) job.client_req_id = fields.ecmsReqId;
        if (!job.client_code && fields.clientCode) job.client_code = fields.clientCode;
        if (!job.title && fields.title) job.title = fields.title;

        const requiredSkillsCandidate = this.pickArray(job.required_skills, this.splitList(fields.mandatorySkills));
        if (requiredSkillsCandidate.length > 0) job.required_skills = requiredSkillsCandidate;

        const desiredSkillsCandidate = this.pickArray(job.desired_skills, this.splitList(fields.desiredSkills));
        if (desiredSkillsCandidate.length > 0) job.desired_skills = desiredSkillsCandidate;

        const yearsRequired = this.parseNumber(fields.totalExperience);
        if (!job.years_required && yearsRequired !== undefined) job.years_required = yearsRequired;

        if (!job.relevant_experience && fields.relevantExperience) {
            job.relevant_experience = fields.relevantExperience;
        }

        const workLocationsCandidate = this.pickArray(
            job.work_locations,
            fields.workLocations?.length ? fields.workLocations : this.splitList(fields.location),
        );
        if (workLocationsCandidate.length > 0) job.work_locations = workLocationsCandidate;

        if (!job.work_mode && (fields.workMode || metadata.workMode)) {
            job.work_mode = fields.workMode || metadata.workMode;
        }

        if (!job.interview_mode && (fields.interviewMode || metadata.interviewMode)) {
            job.interview_mode = fields.interviewMode || metadata.interviewMode;
        }

        if (!job.background_check_timing && (fields.backgroundCheck || metadata.bgCheck)) {
            job.background_check_timing = fields.backgroundCheck || metadata.bgCheck;
        }

        if (!job.vendor_rate_text && fields.vendorRate) {
            job.vendor_rate_text = fields.vendorRate;
        }

        if (!job.vendor_rate_value && fields.vendorRateValue !== undefined) {
            job.vendor_rate_value = fields.vendorRateValue;
        }

        if (!job.vendor_rate_currency && fields.vendorRateCurrency) {
            job.vendor_rate_currency = fields.vendorRateCurrency;
        }

        if (!job.vendor_rate_unit && fields.vendorRateUnit) {
            job.vendor_rate_unit = fields.vendorRateUnit;
        }

        const openings = this.parseNumber(fields.numberOfOpenings || metadata.numberOfOpenings);
        if (openings !== undefined && (!job.openings || job.openings === 1)) {
            job.openings = openings;
        }

        if (!job.pu_unit && metadata.pu) job.pu_unit = metadata.pu;
        if (!job.client_project_manager && metadata.projectManager) job.client_project_manager = metadata.projectManager;
        if (!job.delivery_spoc && metadata.deliverySpoc) job.delivery_spoc = metadata.deliverySpoc;

        if (!job.submission_email && (guidelines.email || fields.submissionEmail)) {
            job.submission_email = guidelines.email || fields.submissionEmail;
        }

        if (!job.domain_industry && fields.domain) {
            job.domain_industry = fields.domain;
        }
    }

    /**
     * Apply AI-extracted fields to job entity
     */
    private applyAIFields(job: Job, aiResult: any): void {
        // Only apply if not already set
        if (!job.client_req_id && aiResult.client_req_id) job.client_req_id = aiResult.client_req_id;
        if (!job.client_code && aiResult.client_code) job.client_code = aiResult.client_code;
        if (!job.title && aiResult.title) job.title = aiResult.title;
        if (!job.domain_industry && aiResult.domain_industry) job.domain_industry = aiResult.domain_industry;
        if (!job.pu_unit && aiResult.pu_unit) job.pu_unit = aiResult.pu_unit;

        const openings = typeof aiResult.openings === 'number' ? aiResult.openings : this.parseNumber(aiResult.openings);
        if (openings && (!job.openings || job.openings === 1)) job.openings = openings;

        const requiredSkills = this.pickArray(job.required_skills, aiResult.required_skills);
        if (requiredSkills.length > 0) job.required_skills = requiredSkills;

        const desiredSkills = this.pickArray(job.desired_skills, aiResult.desired_skills);
        if (desiredSkills.length > 0) job.desired_skills = desiredSkills;

        if (!job.relevant_experience && aiResult.relevant_experience) job.relevant_experience = aiResult.relevant_experience;

        const workLocations = this.pickArray(job.work_locations, aiResult.work_locations);
        if (workLocations.length > 0) job.work_locations = workLocations;

        if (!job.work_mode && aiResult.work_mode) job.work_mode = aiResult.work_mode;
        if (!job.interview_mode && aiResult.interview_mode) job.interview_mode = aiResult.interview_mode;
        if (!job.background_check_timing && aiResult.background_check_timing) job.background_check_timing = aiResult.background_check_timing;
        if (!job.vendor_rate_text && aiResult.vendor_rate_text) job.vendor_rate_text = aiResult.vendor_rate_text;

        if (!job.vendor_rate_value && aiResult.vendor_rate_value) job.vendor_rate_value = aiResult.vendor_rate_value;
        if (!job.vendor_rate_currency && aiResult.vendor_rate_currency) job.vendor_rate_currency = aiResult.vendor_rate_currency;
        if (!job.vendor_rate_unit && aiResult.vendor_rate_unit) job.vendor_rate_unit = aiResult.vendor_rate_unit;

        if (!job.submission_email && aiResult.submission_email) job.submission_email = aiResult.submission_email;
        if (!job.client_project_manager && aiResult.client_project_manager) job.client_project_manager = aiResult.client_project_manager;
        if (!job.delivery_spoc && aiResult.delivery_spoc) job.delivery_spoc = aiResult.delivery_spoc;

        console.log('AI fields applied to job successfully');
    }

    private splitList(value?: string): string[] {
        if (!value) return [];
        return value
            .split(/[\/|,;]+/)
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    }

    private parseNumber(value?: string): number | undefined {
        if (!value) return undefined;
        const match = value.match(/\d+/);
        return match ? parseInt(match[0], 10) : undefined;
    }

    private pickArray(current?: string[], candidate?: string[]): string[] {
        if (current && current.length > 0) return current;
        return candidate && candidate.length > 0 ? candidate : [];
    }

    /**
     * Auto-parse JD content into structured sections
     * Uses simple heuristics to identify common JD sections
     */
    async parseJdIntoSections(content: string): Promise<Array<{ heading: string; content: string; order: number; type?: string }>> {
        const sections: Array<{ heading: string; content: string; order: number; type?: string }> = [];

        // Common JD section headings
        const sectionPatterns = [
            { pattern: /(?:^|\n)(About (?:the )?(?:Role|Position|Job)|Job Description)[\s:]*\n/gi, type: 'about' },
            { pattern: /(?:^|\n)((?:Key )?Responsibilities|What (?:you'll|you will) do)[\s:]*\n/gi, type: 'responsibilities' },
            { pattern: /(?:^|\n)((?:Required )?Qualifications?|Requirements?|What (?:you'll|you will) need)[\s:]*\n/gi, type: 'qualifications' },
            { pattern: /(?:^|\n)(Preferred (?:Skills|Qualifications)|Nice to Have)[\s:]*\n/gi, type: 'preferred' },
            { pattern: /(?:^|\n)(Benefits?|What [Ww]e [Oo]ffer|Perks)[\s:]*\n/gi, type: 'benefits' },
            { pattern: /(?:^|\n)(About (?:Us|the Company)|Company Overview)[\s:]*\n/gi, type: 'company' },
        ];

        let remainingContent = content;
        let order = 0;

        for (const { pattern, type } of sectionPatterns) {
            const matches = Array.from(remainingContent.matchAll(pattern));
            for (const match of matches) {
                const heading = match[1].trim();
                const startIndex = match.index! + match[0].length;

                // Find content until next heading or end
                const nextHeadingMatch = remainingContent.slice(startIndex).match(/\n(?:[A-Z][^:\n]{2,50}:|\n)/);
                const endIndex = nextHeadingMatch ? startIndex + nextHeadingMatch.index! : remainingContent.length;

                const sectionContent = remainingContent.slice(startIndex, endIndex).trim();

                if (sectionContent.length > 10) {
                    sections.push({
                        heading,
                        content: sectionContent,
                        order: order++,
                        type,
                    });
                }
            }
        }

        // If no sections found, treat entire content as one section
        if (sections.length === 0 && content.trim().length > 0) {
            sections.push({
                heading: 'Job Description',
                content: content.trim(),
                order: 0,
                type: 'description',
            });
        }

        return sections;
    }
}
