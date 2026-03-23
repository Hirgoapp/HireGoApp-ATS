import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum EmailFormat {
    TEXT = 'text',
    EML = 'eml',
}

export class ImportEmailDto {
    @ApiProperty({
        description: 'Email content - either pasted text or .eml file content',
        example: 'From: sender@example.com\nSubject: ECMS:545390...',
    })
    @IsString()
    @IsNotEmpty()
    emailContent: string;

    @ApiProperty({
        description: 'Format of the email content',
        enum: EmailFormat,
        example: EmailFormat.TEXT,
    })
    @IsEnum(EmailFormat)
    format: EmailFormat;
}

export class ParsedEmailResponseDto {
    @ApiProperty({ description: 'Complete raw email content' })
    rawEmail: string;

    @ApiProperty({ description: 'Auto-extracted fields from email' })
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
        domain?: string;
        numberOfOpenings?: string;
    };

    @ApiProperty({ description: 'Candidate tracker format' })
    candidateTracker?: {
        columns: string[];
        format: string;
    };

    @ApiProperty({ description: 'Submission guidelines and rules' })
    submissionGuidelines?: {
        email?: string;
        interviewScreenshot?: string;
        platforms?: string[];
        notAllowed?: string[];
        complianceNotes?: string;
    };

    @ApiProperty({ description: 'JD metadata and additional information' })
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

export class CreateJobFromEmailDto {
    @ApiProperty({ description: 'Parsed email data' })
    @IsNotEmpty()
    parsedData: ParsedEmailResponseDto;

    @ApiProperty({ description: 'Optional: Override extracted title' })
    title?: string;

    @ApiProperty({ description: 'Optional: Override extracted ECMS Req ID' })
    ecms_req_id?: string;

    @ApiProperty({ description: 'Optional: Override mandatory skills' })
    mandatory_skills?: string;

    @ApiProperty({ description: 'Optional: Client ID (defaults to 1)' })
    client_id?: number;

    @ApiProperty({ description: 'Optional: Priority level' })
    priority?: string;

    @ApiProperty({ description: 'Optional: Active flag' })
    active_flag?: boolean;
}
