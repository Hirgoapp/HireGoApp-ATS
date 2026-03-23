import { Injectable } from '@nestjs/common';

export interface ParsedEmailData {
    rawEmail: string;
    extractedFields: {
        ecmsReqId?: string;
        title?: string;
        clientCode?: string;
        mandatorySkills?: string;
        desiredSkills?: string;
        totalExperience?: string;
        relevantExperience?: string;
        location?: string;
        vendorRate?: string;
        vendorRateValue?: number;
        vendorRateCurrency?: string;
        vendorRateUnit?: string;
        domain?: string;
        numberOfOpenings?: string;
        workMode?: string;
        interviewMode?: string;
        backgroundCheck?: string;
        workLocations?: string[];
        submissionEmail?: string;
    };
    candidateTracker?: {
        columns: string[];
        format: string;
    };
    submissionGuidelines?: {
        email?: string;
        interviewScreenshot?: string;
        platforms?: string[];
        notAllowed?: string[];
        complianceNotes?: string;
    };
    jdMetadata?: {
        pu?: string;
        projectManager?: string;
        deliverySpoc?: string;
        numberOfOpenings?: string;
        country?: string;
        workMode?: string;
        interviewMode?: string;
        bgCheck?: string;
        duration?: string;
        shiftTime?: string;
        clientName?: string;
    };
}

@Injectable()
export class EmailParserService {
    /**
     * Main parse method - handles both .eml files and plain text
     */
    parse(emailContent: string): ParsedEmailData {
        const result: ParsedEmailData = {
            rawEmail: emailContent,
            extractedFields: {},
            jdMetadata: {},
        };

        // Extract from subject line
        this.extractFromSubject(emailContent, result);

        // Extract structured data from email body
        this.extractStructuredData(emailContent, result);

        // Extract candidate tracker format
        this.extractCandidateTracker(emailContent, result);

        // Extract submission guidelines
        this.extractSubmissionGuidelines(emailContent, result);

        // Extract JD metadata
        this.extractJdMetadata(emailContent, result);

        return result;
    }

    /**
     * Extract data from subject line
     * Patterns: "ECMS:545390 - Senior PEGA developer - India - EAIS"
     */
    private extractFromSubject(email: string, result: ParsedEmailData): void {
        // Look for Subject: line
        const subjectMatch = email.match(/Subject:\s*(.+?)(?:\r?\n|\r)/i);
        if (!subjectMatch) return;

        const subject = subjectMatch[1].trim();

        // Extract ECMS ID - multiple patterns
        const ecmsPatterns = [
            /ECMS[:\s]*(\d{6})/i,
            /(\d{6})\s*[-–]\s*\w+/,
            /REQ\s*ID[:\s]*(\d{6})/i,
        ];

        for (const pattern of ecmsPatterns) {
            const match = subject.match(pattern);
            if (match) {
                result.extractedFields.ecmsReqId = match[1];
                break;
            }
        }

        // Extract client code (e.g., EAIS, HILDGTL, INS-ADM)
        const clientMatch = subject.match(/[-–]\s*([A-Z]{2,}(?:-[A-Z]+)?)\s*$/i);
        if (clientMatch) {
            result.extractedFields.clientCode = clientMatch[1];
        }

        // Extract title - remove ECMS ID, client code, location
        let title = subject
            .replace(/ECMS[:\s]*\d{6}\s*[-–]?\s*/i, '')
            .replace(/[-–]\s*India\s*[-–]/i, ' - ')
            .replace(/[-–]\s*[A-Z]{2,}(?:-[A-Z]+)?\s*$/i, '')
            .trim();

        // Clean up extra dashes
        title = title.replace(/\s*[-–]\s*/g, ' ').trim();

        if (title) {
            result.extractedFields.title = this.capitalizeTitle(title);
        }
    }

    /**
     * Extract structured data from JD table
     */
    private extractStructuredData(email: string, result: ParsedEmailData): void {
        // Extract ECMS REQ ID from body
        if (!result.extractedFields.ecmsReqId) {
            const ecmsMatch = email.match(/ECMS\s*REQ\s*(?:ID|#)[:\s]*(\d{6})/i);
            if (ecmsMatch) {
                result.extractedFields.ecmsReqId = ecmsMatch[1];
            }
        }

        // Extract mandatory skills
        const mandatoryMatch = email.match(
            /Mandatory\s*[Ss]kills[:\s]*(.+?)(?=\n\s*(?:Desired|Domain|Work|Client|Vendor|Mode|WFO|Background|$))/is,
        );
        if (mandatoryMatch) {
            result.extractedFields.mandatorySkills = this.cleanText(
                mandatoryMatch[1],
            );
        }

        // Extract desired skills
        const desiredMatch = email.match(
            /Desired\s*[Ss]kills[:\s]*(.+?)(?=\n\s*(?:Domain|Work|Client|Vendor|Mode|WFO|Background|$))/is,
        );
        if (desiredMatch) {
            result.extractedFields.desiredSkills = this.cleanText(desiredMatch[1]);
        }

        // Extract total experience
        const totalExpMatch = email.match(
            /Total\s*(?:Experience|Exp)[:\s]*(.+?)(?:\n|yrs|years)/i,
        );
        if (totalExpMatch) {
            result.extractedFields.totalExperience = this.cleanText(
                totalExpMatch[1],
            );
        }

        // Extract relevant experience
        const relevantExpMatch = email.match(
            /Relevant\s*(?:Experience|Exp)[:\s]*(.+?)(?:\n|yrs|years)/i,
        );
        if (relevantExpMatch) {
            result.extractedFields.relevantExperience = this.cleanText(
                relevantExpMatch[1],
            );
        }

        // Extract work location
        const locationMatch = email.match(
            /Work\s*Location[:\s]*(.+?)(?:\n\s*(?:Background|Mode|Vendor|Shift|Client|$))/i,
        );
        if (locationMatch) {
            result.extractedFields.location = this.cleanText(locationMatch[1]);
            result.extractedFields.workLocations = this.cleanText(locationMatch[1])
                .split(/[\/|,]/)
                .map((loc) => loc.trim())
                .filter(Boolean);
        }

        // Extract vendor rate
        const rateMatch = email.match(
            /Vendor\s*(?:Rate|Billing)[:\s]*[^\n]*?(\d{3,}[,\d]*)\s*(?:INR|per|\/)/i,
        );
        if (rateMatch) {
            result.extractedFields.vendorRate = `${rateMatch[1]}/Day`;
            const { value, currency, unit } = this.parseVendorRate(rateMatch[0]);
            if (value) result.extractedFields.vendorRateValue = value;
            if (currency) result.extractedFields.vendorRateCurrency = currency;
            if (unit) result.extractedFields.vendorRateUnit = unit;
        }

        // Extract domain
        const domainMatch = email.match(/Domain[:\s]*(.+?)(?:\n|$)/i);
        if (domainMatch) {
            result.extractedFields.domain = this.cleanText(domainMatch[1]);
        }

        // Extract number of openings
        const openingsMatch = email.match(
            /Number\s*of\s*Openings[:\s]*(\d+)/i,
        );
        if (openingsMatch) {
            result.extractedFields.numberOfOpenings = openingsMatch[1];
        }

        // Extract work mode
        const workModeMatch =
            email.match(/WFO\s*\/\s*WFH\s*\/\s*Hybrid[:\s]*(.+?)(?:\n|$)/i) ||
            email.match(/Work\s*Mode[:\s]*(.+?)(?:\n|$)/i);
        if (workModeMatch) {
            result.extractedFields.workMode = this.cleanText(workModeMatch[1]);
        }

        // Extract interview mode
        const interviewModeMatch = email.match(
            /Mode\s*of\s*Interview[:\s]*(.+?)(?:\n|$)/i,
        );
        if (interviewModeMatch) {
            result.extractedFields.interviewMode = this.cleanText(
                interviewModeMatch[1],
            );
        }

        // Extract background check timing
        const bgMatch = email.match(/Background\s*check[:\s]*(.+?)(?:\n|$)/i);
        if (bgMatch) {
            result.extractedFields.backgroundCheck = this.cleanText(bgMatch[1]);
        }

        // Extract submission email anywhere in text (fallback)
        if (!result.extractedFields.submissionEmail) {
            const genericEmailMatch = email.match(
                /(?:share|send|submit|forward).*?([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
            );
            if (genericEmailMatch) {
                result.extractedFields.submissionEmail = genericEmailMatch[1];
            }
        }
    }

    /**
     * Extract candidate tracker format
     */
    private extractCandidateTracker(
        email: string,
        result: ParsedEmailData,
    ): void {
        const trackerMatch = email.match(
            /Candidate\s*(?:details\s*submission\s*)?[Tt]racker[:\s]*(.+?)(?=\n\s*(?:JD|ECMS|Date|Number|$))/is,
        );

        if (trackerMatch) {
            const trackerText = trackerMatch[1];
            const columns: string[] = [];

            // Common tracker fields
            const commonFields = [
                'ECMS REQ ID',
                'Unique ID',
                'Profile Submission Date',
                'Vendor Email ID',
                'Title',
                'Candidate Name',
                'Phone No',
                'Email',
                'Notice Period',
                'Current Location',
                'Location applying for',
                'Total Experience',
                'Relevant Experience',
                'Skills',
                'Vendor Quoted Rate',
                'Interview screenshot',
                'Visa Type',
                'Agreed for Full time/Subcon',
                'If ex-Infy',
            ];

            // Check which fields are mentioned
            for (const field of commonFields) {
                if (new RegExp(field, 'i').test(trackerText)) {
                    columns.push(field);
                }
            }

            if (columns.length > 0) {
                result.candidateTracker = {
                    columns,
                    format: 'table',
                };
            }
        }
    }

    /**
     * Extract submission guidelines
     */
    private extractSubmissionGuidelines(
        email: string,
        result: ParsedEmailData,
    ): void {
        const guidelines: ParsedEmailData['submissionGuidelines'] = {};

        // Extract submission email
        const emailMatch = email.match(
            /(?:Share|Submit).*?(?:to|mailbox:)\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
        );
        if (emailMatch) {
            guidelines.email = emailMatch[1];
        }

        // Extract screenshot timing
        const screenshotMatch = email.match(
            /screenshot.*?(?:at least|after|minimum)\s*(\d+)\s*minutes/i,
        );
        if (screenshotMatch) {
            guidelines.interviewScreenshot = `${screenshotMatch[1]} minutes minimum`;
        }

        // Extract preferred platforms
        const platformsMatch = email.match(
            /Preferred\s*platforms.*?(?:are|:)\s*(.+?)(?:\n|$)/i,
        );
        if (platformsMatch) {
            const platformText = platformsMatch[1];
            const platforms = [];
            if (/Teams/i.test(platformText)) platforms.push('Microsoft Teams');
            if (/Webex/i.test(platformText)) platforms.push('Webex');
            if (/Google\s*Meet/i.test(platformText)) platforms.push('Google Meet');
            if (/Zoom/i.test(platformText)) platforms.push('Zoom');

            if (platforms.length > 0) {
                guidelines.platforms = platforms;
            }
        }

        // Extract not allowed platforms
        const notAllowedMatch = email.match(
            /(?:will not be accepted|not allowed).*?(?:WhatsApp|FaceTime)/i,
        );
        if (notAllowedMatch) {
            guidelines.notAllowed = ['WhatsApp', 'FaceTime'];
        }

        // Extract compliance notes
        const complianceMatch = email.match(
            /Do not mark.*?(?:TA|Talent Acquisition).*?(?:teams|due to Compliance)/i,
        );
        if (complianceMatch) {
            guidelines.complianceNotes =
                'Do not mark Talent Acquisition (TA) or Delivery teams due to Compliance';
        }

        if (Object.keys(guidelines).length > 0) {
            result.submissionGuidelines = guidelines;
        }
    }

    /**
     * Extract JD metadata
     */
    private extractJdMetadata(email: string, result: ParsedEmailData): void {
        const metadata: ParsedEmailData['jdMetadata'] = {};

        // PU
        const puMatch = email.match(/PU[:\s]*([A-Z0-9-]+)/i);
        if (puMatch) metadata.pu = puMatch[1];

        // Project Manager
        const pmMatch = email.match(/Project\s*Manager[:\s]*(.+?)(?:\n|$)/i);
        if (pmMatch) metadata.projectManager = this.cleanText(pmMatch[1]);

        // Delivery SPOC
        const spocMatch = email.match(/Delivery\s*SPOC[:\s]*(.+?)(?:\n|$)/i);
        if (spocMatch) metadata.deliverySpoc = this.cleanText(spocMatch[1]);

        // Country
        const countryMatch = email.match(/Country[:\s]*(.+?)(?:\n|$)/i);
        if (countryMatch) metadata.country = this.cleanText(countryMatch[1]);

        // Work mode
        const workModeMatch = email.match(
            /WF[OH].*?(?:WFH|Hybrid)[:\s]*(.+?)(?:\n|$)/i,
        );
        if (workModeMatch) metadata.workMode = this.cleanText(workModeMatch[1]);

        // Interview mode
        const interviewMatch = email.match(
            /Mode\s*of\s*Interview[:\s]*(.+?)(?:\n|$)/i,
        );
        if (interviewMatch)
            metadata.interviewMode = this.cleanText(interviewMatch[1]);

        // Background check
        const bgMatch = email.match(/Background\s*[Cc]heck[:\s]*(.+?)(?:\n|$)/i);
        if (bgMatch) metadata.bgCheck = this.cleanText(bgMatch[1]);

        // Duration
        const durationMatch = email.match(/Duration[:\s]*(.+?)(?:\n|$)/i);
        if (durationMatch) metadata.duration = this.cleanText(durationMatch[1]);

        // Shift time
        const shiftMatch = email.match(/Shift[:\s]*(.+?)(?:\n|$)/i);
        if (shiftMatch) metadata.shiftTime = this.cleanText(shiftMatch[1]);

        // Client name
        const clientMatch = email.match(/Client\s*[Nn]ame[:\s]*(.+?)(?:\n|$)/i);
        if (clientMatch) metadata.clientName = this.cleanText(clientMatch[1]);

        if (Object.keys(metadata).length > 0) {
            result.jdMetadata = metadata;
        }
    }

    /**
     * Clean text - remove extra whitespace, HTML, etc.
     */
    private cleanText(text: string): string {
        return text
            .replace(/<[^>]+>/g, '') // Remove HTML tags
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[=*]/g, '') // Remove special characters
            .trim();
    }

    /**
     * Parse vendor rate text into numeric pieces when possible
     */
    private parseVendorRate(rateText: string): {
        value?: number;
        currency?: string;
        unit?: string;
    } {
        const valueMatch = rateText.match(/([\d,]+(?:\.\d+)?)/);
        const unitMatch = rateText.match(/\/\s*(Day|Hour|Month|Annum|Year)/i);
        const currencyMatch = rateText.match(/(INR|USD|EUR|GBP)/i);

        return {
            value: valueMatch ? parseFloat(valueMatch[1].replace(/,/g, '')) : undefined,
            currency: currencyMatch ? currencyMatch[1].toUpperCase() : undefined,
            unit: unitMatch ? unitMatch[1].toLowerCase() : undefined,
        };
    }

    /**
     * Capitalize title properly
     */
    private capitalizeTitle(title: string): string {
        const words = title.toLowerCase().split(/\s+/);
        const capitalized = words.map((word) => {
            // Don't capitalize common words unless they're first
            const lowerWords = ['and', 'or', 'the', 'a', 'an', 'in', 'on', 'at'];
            if (lowerWords.includes(word) && words.indexOf(word) !== 0) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        });
        return capitalized.join(' ');
    }
}
