import { Injectable, Logger } from '@nestjs/common';

export interface EmailParsingResult {
    confidence: number;
    fields: Record<string, any>;
    instructions: Array<{
        type: string;
        title: string;
        content: string;
    }>;
    candidateTracker: {
        fields: Array<{
            field: string;
            type: string;
            required: boolean;
        }>;
        template: string;
    } | null;
    errors: string[];
}

/**
 * JobEmailParserService
 * Parses raw email content to extract job details, instructions, and candidate tracker
 * Uses pattern matching and heuristics for flexible extraction
 *
 * IMPORTANT: This is best-effort extraction, NEVER canonical.
 * - Parsed data is for UI convenience and searchability
 * - Raw email content in job_email_sources is the authoritative source
 * - Users can always edit extracted fields
 * - Parsing errors are tracked but never block job creation
 * - Confidence score helps users understand extraction quality
 */
@Injectable()
export class JobEmailParserService {
    private readonly logger = new Logger(JobEmailParserService.name);

    /**
     * Parse complete email content
     */
    async parseEmail(rawContent: string, emailSubject?: string): Promise<EmailParsingResult> {
        const result: EmailParsingResult = {
            confidence: 0,
            fields: {},
            instructions: [],
            candidateTracker: null,
            errors: [],
        };

        try {
            // Extract client req ID from subject if available
            if (emailSubject) {
                const reqIdFromSubject = this.extractReqIdFromSubject(emailSubject);
                if (reqIdFromSubject) {
                    result.fields.client_req_id = reqIdFromSubject;
                }
            }

            // Extract JD format section (the main job details table)
            const jdSection = this.extractSection(rawContent, 'JD format:', ['Regards', 'Note:', 'Dear', '---']);
            if (jdSection) {
                const jdFields = this.parseJDTable(jdSection);
                Object.assign(result.fields, jdFields);
            }

            // Extract submission guidelines
            const submissionGuidelines = this.extractSubmissionGuidelines(rawContent);
            if (submissionGuidelines.length > 0) {
                result.instructions.push(...submissionGuidelines);
            }

            // Extract candidate tracker
            const tracker = this.extractCandidateTracker(rawContent);
            if (tracker) {
                result.candidateTracker = tracker;
            }

            // Calculate confidence based on how many key fields were extracted
            result.confidence = this.calculateConfidence(result.fields);

            this.logger.log(`Email parsed with confidence: ${result.confidence}`);
        } catch (error) {
            this.logger.error(`Error parsing email: ${error.message}`);
            result.errors.push(error.message);
        }

        return result;
    }

    /**
     * Extract requirement ID from email subject
     * Example: "545390 - Senior PEGA developer - India - EAIS" → "545390"
     */
    private extractReqIdFromSubject(subject: string): string | null {
        const match = subject.match(/^\s*(\d{5,})\s*[-–]/);
        return match ? match[1] : null;
    }

    /**
     * Extract a section between start marker and end markers
     */
    private extractSection(content: string, startMarker: string, endMarkers: string[]): string | null {
        const startIndex = content.indexOf(startMarker);
        if (startIndex === -1) return null;

        let endIndex = content.length;
        for (const endMarker of endMarkers) {
            const idx = content.indexOf(endMarker, startIndex + startMarker.length);
            if (idx !== -1 && idx < endIndex) {
                endIndex = idx;
            }
        }

        return content.substring(startIndex, endIndex);
    }

    /**
     * Parse JD format table (key-value pairs)
     */
    private parseJDTable(jdSection: string): Record<string, any> {
        const fields: Record<string, any> = {};

        // Patterns for common fields
        const patterns = [
            { regex: /Date\s+Of\s+Requisition[:\s]+(.+?)$/im, key: 'date_of_requisition' },
            { regex: /ECMS\s+REQ\s+ID\s*\/\s*Unique\s+ID[:\s]+(.+?)$/im, key: 'client_req_id' },
            { regex: /PU[:\s]+(.+?)$/im, key: 'pu_unit' },
            { regex: /Project\s+Manager[:\s]+(.+?)$/im, key: 'client_project_manager' },
            { regex: /Delivery\s+SPOC[:\s]+(.+?)$/im, key: 'delivery_spoc' },
            { regex: /Number\s+of\s+Openings[:\s]+(.+?)$/im, key: 'openings' },
            { regex: /Country[:\s]+(.+?)$/im, key: 'country' },
            { regex: /Total\s+Experience[:\s]+(.+?)$/im, key: 'years_required' },
            { regex: /Relevant\s+Experience[:\s]+(.+?)$/im, key: 'relevant_experience' },
            { regex: /Mandatory\s+skills[:\s]+(.+?)$/im, key: 'required_skills' },
            { regex: /Desired\s+skills[:\s]+(.+?)$/im, key: 'desired_skills' },
            { regex: /Domain\s+\(Industry\)[:\s]+(.+?)$/im, key: 'domain_industry' },
            { regex: /Work\s+Location[:\s]+(.+?)$/im, key: 'work_locations' },
            { regex: /Background\s+check[:\s]+(.+?)$/im, key: 'background_check_timing' },
            { regex: /Mode\s+of\s+Interview[:\s]+(.+?)$/im, key: 'interview_mode' },
            { regex: /WFO\s*\/\s*WFH\s*\/\s*Hybrid[:\s]+(.+?)$/im, key: 'work_mode' },
            { regex: /Vendor\s+Rate[:\s]+(.+?)$/im, key: 'vendor_rate_text' },
        ];

        for (const pattern of patterns) {
            const match = jdSection.match(pattern.regex);
            if (match) {
                let value = match[1].trim();

                // Clean up value
                value = value.replace(/\s+/g, ' ').trim();

                // Special handling for specific fields
                if (pattern.key === 'openings') {
                    fields[pattern.key] = parseInt(value, 10) || 1;
                } else if (pattern.key === 'required_skills' || pattern.key === 'desired_skills') {
                    // Keep as string for now, can be split later
                    fields[pattern.key] = value;
                } else if (pattern.key === 'work_locations') {
                    // Split multiple locations
                    fields[pattern.key] = value.split(/[,/]/).map(l => l.trim()).filter(l => l);
                } else if (pattern.key === 'vendor_rate_text') {
                    fields[pattern.key] = value;
                    // Try to extract structured rate
                    const rateMatch = value.match(/([\d,]+)\s*\/\s*(Day|Hour|Month)/i);
                    if (rateMatch) {
                        fields.vendor_rate_value = parseFloat(rateMatch[1].replace(/,/g, ''));
                        fields.vendor_rate_unit = rateMatch[2].toLowerCase();
                    }
                    // Extract currency
                    const currencyMatch = value.match(/(INR|USD|EUR|GBP)/i);
                    if (currencyMatch) {
                        fields.vendor_rate_currency = currencyMatch[1].toUpperCase();
                    }
                } else {
                    fields[pattern.key] = value;
                }
            }
        }

        // Extract detailed JD content
        const detailedJDMatch = jdSection.match(/Detailed\s+JD\s+\(Roles\s+and\s+Responsibilities\)[:\s]+([\s\S]+?)(?=Total\s+Experience|$)/i);
        if (detailedJDMatch) {
            fields.detailed_jd = detailedJDMatch[1].trim();
        }

        return fields;
    }

    /**
     * Extract submission guidelines/instructions
     */
    private extractSubmissionGuidelines(content: string): Array<{ type: string; title: string; content: string }> {
        const instructions = [];

        // Resume submission guidelines
        const resumeSection = this.extractSection(content, 'Resume submission Guidelines:', ['Candidate details', 'JD format']);
        if (resumeSection) {
            instructions.push({
                type: 'submission',
                title: 'Resume Submission Guidelines',
                content: resumeSection.replace('Resume submission Guidelines:', '').trim(),
            });
        }

        // Interview guidelines
        const interviewMatch = content.match(/interview\s+guidelines.*?:([\s\S]{100,500})/i);
        if (interviewMatch) {
            instructions.push({
                type: 'interview',
                title: 'Interview Guidelines',
                content: interviewMatch[1].trim(),
            });
        }

        // Compliance notes
        const complianceMatch = content.match(/compliance[:\s]+([\s\S]{50,300})/i);
        if (complianceMatch) {
            instructions.push({
                type: 'compliance',
                title: 'Compliance Requirements',
                content: complianceMatch[1].trim(),
            });
        }

        return instructions;
    }

    /**
     * Extract candidate tracker table structure
     */
    private extractCandidateTracker(content: string): {
        fields: Array<{ field: string; type: string; required: boolean }>;
        template: string;
    } | null {
        const trackerSection = this.extractSection(content, 'Candidate Tracker', ['JD format', 'Regards']);
        if (!trackerSection) return null;

        const fields = [];
        const commonFields = [
            { field: 'ECMS REQ ID/ Unique ID', type: 'text', required: true },
            { field: 'Profile submission date', type: 'date', required: true },
            { field: 'Vendor email ID', type: 'email', required: true },
            { field: 'Title', type: 'text', required: false },
            { field: 'Candidate Name', type: 'text', required: true },
            { field: 'Phone No', type: 'phone', required: true },
            { field: 'Email', type: 'email', required: true },
            { field: 'Notice Period', type: 'text', required: false },
            { field: 'Current Location', type: 'text', required: false },
            { field: 'Location applying for', type: 'text', required: false },
            { field: 'Total Experience', type: 'text', required: true },
            { field: 'Relevant Experience', type: 'text', required: true },
            { field: 'Skills', type: 'text', required: true },
            { field: 'Vendor Quoted Rate', type: 'text', required: true },
            { field: 'Interview screenshot', type: 'file', required: true },
            { field: 'Visa Type', type: 'text', required: false },
            { field: 'Agreed for Full time/Subcon', type: 'text', required: false },
            { field: 'If ex-Infy (provide the Employee ID)', type: 'text', required: false },
        ];

        // Check which fields are mentioned in the tracker section
        for (const field of commonFields) {
            if (trackerSection.includes(field.field)) {
                fields.push(field);
            }
        }

        return {
            fields,
            template: trackerSection,
        };
    }

    /**
     * Calculate parsing confidence based on extracted fields
     */
    private calculateConfidence(fields: Record<string, any>): number {
        const criticalFields = ['client_req_id', 'openings', 'required_skills', 'work_locations'];
        const importantFields = ['years_required', 'vendor_rate_text', 'interview_mode', 'delivery_spoc'];

        let score = 0;
        let maxScore = 0;

        // Critical fields worth 40 points each
        for (const field of criticalFields) {
            maxScore += 40;
            if (fields[field]) score += 40;
        }

        // Important fields worth 20 points each
        for (const field of importantFields) {
            maxScore += 20;
            if (fields[field]) score += 20;
        }

        return Math.min(Math.round((score / maxScore) * 100) / 100, 1.0);
    }
}
