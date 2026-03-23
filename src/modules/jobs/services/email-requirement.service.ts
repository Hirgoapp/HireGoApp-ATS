import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Job } from '../entities/job.entity';
import { JobEmailSource } from '../entities/job-email-source.entity';
import { JobInstruction } from '../entities/job-instruction.entity';
import { JobCandidateTracker } from '../entities/job-candidate-tracker.entity';
import { JobEmailParserService, EmailParsingResult } from './job-email-parser.service';
import {
    ImportEmailRequirementDto,
    ConfirmImportRequirementDto,
    RequirementVersionHistoryQueryDto,
} from '../dto/import-email-requirement.dto';
import {
    EmailImportPreviewResponseDto,
    CreateRequirementResponseDto,
    RequirementVersionHistoryResponseDto,
    RequirementDetailsResponseDto,
} from '../dto/email-requirement-response.dto';

/**
 * EmailRequirementService
 * Handles the complete workflow for email-driven requirement import
 *
 * Workflow:
 * 1. User pastes email → parseEmailPreview() → returns preview with extracted data
 * 2. User reviews and edits fields → confirmImportRequirement() → creates job + related entities
 * 3. User can see version history → getRequirementVersionHistory()
 * 4. User can fetch details → getRequirementDetails()
 *
 * Requirements are versioned by client_req_id (ECMS Req ID):
 * - Same client_req_id arriving again → creates new version
 * - Old version marked as 'replaced' → new version is 'open'
 * - Full history preserved → can view all versions
 */
@Injectable()
export class EmailRequirementService {
    private readonly logger = new Logger(EmailRequirementService.name);

    constructor(
        @InjectRepository(Job)
        private readonly jobRepository: Repository<Job>,

        @InjectRepository(JobEmailSource)
        private readonly emailSourceRepository: Repository<JobEmailSource>,

        @InjectRepository(JobInstruction)
        private readonly instructionRepository: Repository<JobInstruction>,

        @InjectRepository(JobCandidateTracker)
        private readonly candidateTrackerRepository: Repository<JobCandidateTracker>,

        private readonly parserService: JobEmailParserService,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Step 1: Parse email and return preview
     * Does NOT create anything yet - just shows what was extracted
     */
    async parseEmailPreview(
        importDto: ImportEmailRequirementDto,
        companyId: string,
        userId: string,
    ): Promise<EmailImportPreviewResponseDto> {
        if (!importDto.rawEmailContent || importDto.rawEmailContent.trim().length === 0) {
            throw new BadRequestException('Raw email content cannot be empty');
        }

        // Parse the email using the parser service
        const parseResult: EmailParsingResult = await this.parserService.parseEmail(
            importDto.rawEmailContent,
            importDto.emailSubject,
        );

        // Extract client_req_id for duplicate checking
        const clientReqId =
            parseResult.fields.client_req_id ||
            this.extractClientReqIdFromContent(importDto.rawEmailContent);

        let potentialDuplicateMatch = null;

        // Check if this client_req_id already exists
        if (clientReqId) {
            const existingJob = await this.jobRepository.findOne({
                where: {
                    company_id: companyId,
                    client_req_id: clientReqId,
                    requirement_status: 'open',
                },
            });

            if (existingJob) {
                potentialDuplicateMatch = {
                    previousJobId: existingJob.id,
                    clientReqId: existingJob.client_req_id,
                    previousVersion: existingJob.version || 1,
                    lastVersionDate: existingJob.created_at?.toISOString(),
                    versioningAction: 'replace',
                };
            }
        }

        // Build preview response
        const preview: EmailImportPreviewResponseDto = {
            jobId: uuidv4(), // Temporary ID for preview
            rawEmailContent: importDto.rawEmailContent,
            extractedFields: parseResult.fields,
            parsingConfidence: parseResult.confidence,
            parsingErrors: parseResult.errors,
            instructions: parseResult.instructions.map((instr, idx) => ({
                id: uuidv4(),
                type: (instr.type as any) || 'general',
                title: instr.title || 'Instruction',
                content: instr.content || '',
                highlight_level: 'normal',
                is_mandatory: false,
            })),
            candidateTracker: parseResult.candidateTracker
                ? {
                    id: uuidv4(),
                    required_fields:
                        parseResult.candidateTracker.fields?.map((f) => ({
                            field: f.field,
                            type: f.type,
                            required: f.required,
                            description: '',
                        })) || [],
                    field_order: [],
                    validation_rules: {},
                    template_content: parseResult.candidateTracker.template || '',
                }
                : null,
            attachmentsMetadata: this.extractAttachmentsMetadata(importDto.rawEmailContent),
            potentialDuplicateMatch,
        };

        return preview;
    }

    /**
     * Step 2: Confirm import and create job (with versioning)
     * Creates Job + JobEmailSource + JobInstructions + JobCandidateTracker
     * If client_req_id matches existing, marks old as 'replaced'
     */
    async confirmImportRequirement(
        confirmDto: ConfirmImportRequirementDto,
        companyId: string,
        userId: string,
    ): Promise<CreateRequirementResponseDto> {
        if (!confirmDto.rawEmailContent || confirmDto.rawEmailContent.trim().length === 0) {
            throw new BadRequestException('Raw email content is required');
        }

        // Parse again to get baseline fields
        const parseResult = await this.parserService.parseEmail(
            confirmDto.rawEmailContent,
            // Try to extract subject from email content
        );

        const clientReqId =
            parseResult.fields.client_req_id ||
            this.extractClientReqIdFromContent(confirmDto.rawEmailContent);

        if (!clientReqId) {
            throw new BadRequestException(
                'Could not determine client requirement ID. Please provide email subject or explicit ID.',
            );
        }

        // Use transaction to ensure atomicity
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Check for existing versions
            const existingVersions = await queryRunner.manager.find(Job, {
                where: {
                    company_id: companyId,
                    client_req_id: clientReqId,
                },
                order: { version: 'DESC' },
            });

            let newVersion = 1;
            let previousJobId: string | null = null;

            // If versions exist, mark current open version as 'replaced'
            if (existingVersions.length > 0) {
                const currentOpenJob = existingVersions.find((j) => j.requirement_status === 'open');
                if (currentOpenJob) {
                    currentOpenJob.requirement_status = 'replaced';
                    currentOpenJob.is_latest_version = false;
                    await queryRunner.manager.save(currentOpenJob);
                    previousJobId = currentOpenJob.id;
                    newVersion = (currentOpenJob.version || 1) + 1;
                }
            }

            // 2. Create JobEmailSource record (raw email storage)
            const emailSource = queryRunner.manager.create(JobEmailSource, {
                company_id: companyId,
                client_req_id: clientReqId,
                raw_email_content: confirmDto.rawEmailContent,
                parsed_data: parseResult.fields,
                parsing_confidence: parseResult.confidence,
                version: newVersion,
                is_latest: true,
                created_by_id: userId,
            });
            const savedEmailSource = await queryRunner.manager.save(emailSource);

            // 3. Create Job record
            const finalFields = {
                ...parseResult.fields,
                ...confirmDto.editedFields,
            };

            const job = queryRunner.manager.create(Job, {
                company_id: companyId,
                client_req_id: clientReqId,
                title: finalFields.title || parseResult.fields.job_title || 'Untitled Requirement',
                requirement_status: 'open',
                version: newVersion,
                is_latest_version: true,
                original_job_id: previousJobId || null,
                email_source_id: savedEmailSource.id,
                created_by_id: userId,
                // Map parsed fields to job entity fields
                description: finalFields.description || finalFields.job_description,
                client_id: confirmDto.clientId,
                skills: finalFields.skills,
                experience_years: finalFields.experience_years,
                work_locations: finalFields.work_locations || [],
                interview_mode: finalFields.interview_mode,
                work_mode: finalFields.work_mode,
                vendor_rate_text: finalFields.vendor_rate_text,
                background_check_timing: finalFields.background_check_timing,
                // ... map other fields as needed
            });
            const savedJob = await queryRunner.manager.save(job);

            // 4. Create JobInstructions
            const instructionsToCreate = confirmDto.editedInstructions || [];
            if (instructionsToCreate.length > 0) {
                const instructions = instructionsToCreate.map((instr, idx) =>
                    queryRunner.manager.create(JobInstruction, {
                        job_id: savedJob.id,
                        company_id: companyId,
                        instruction_type: instr.type || 'general',
                        content: instr.content,
                        highlight_level: instr.highlight_level || 'normal',
                        is_mandatory: instr.is_mandatory || false,
                        display_order: idx,
                        created_by_id: userId,
                    }),
                );
                await queryRunner.manager.save(instructions);
            }

            // 5. Create JobCandidateTracker
            let candidateTracker = null;
            if (confirmDto.editedCandidateTracker) {
                candidateTracker = queryRunner.manager.create(JobCandidateTracker, {
                    job_id: savedJob.id,
                    company_id: companyId,
                    required_fields: confirmDto.editedCandidateTracker.required_fields,
                    field_order: confirmDto.editedCandidateTracker.field_order,
                    validation_rules: confirmDto.editedCandidateTracker.validation_rules,
                    template_content: confirmDto.editedCandidateTracker.template_content,
                    created_by_id: userId,
                });
                await queryRunner.manager.save(candidateTracker);
            }

            await queryRunner.commitTransaction();

            // Build response
            const response: CreateRequirementResponseDto = {
                jobId: savedJob.id,
                clientReqId: clientReqId,
                title: savedJob.title,
                requirementStatus: savedJob.requirement_status,
                version: savedJob.version || 1,
                isLatestVersion: savedJob.is_latest_version || true,
                replacedPreviousJobId: previousJobId,
                emailSourceId: savedEmailSource.id,
                instructionCount: instructionsToCreate.length,
                hasCandidateTracker: !!candidateTracker,
                createdAt: new Date().toISOString(),
                detailsUrl: `/api/v1/requirements/${savedJob.id}`,
            };

            this.logger.log(
                `Requirement imported: ${clientReqId} (version ${newVersion}, job ${savedJob.id})`,
            );

            return response;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Error confirming import: ${error.message}`);
            throw new BadRequestException(`Failed to create requirement: ${error.message}`);
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Fetch version history for a requirement (by client_req_id)
     */
    async getRequirementVersionHistory(
        clientReqId: string,
        companyId: string,
        queryDto: RequirementVersionHistoryQueryDto,
    ): Promise<RequirementVersionHistoryResponseDto> {
        const jobs = await this.jobRepository.find({
            where: {
                company_id: companyId,
                client_req_id: clientReqId,
            },
            order: { version: 'ASC' },
        });

        if (jobs.length === 0) {
            throw new Error(`No requirements found with client_req_id: ${clientReqId}`);
        }

        // Filter by status if provided
        let filteredJobs = jobs;
        if (queryDto.status) {
            filteredJobs = jobs.filter((j) => j.requirement_status === queryDto.status);
        }

        // Exclude replaced versions if requested
        if (!queryDto.includeReplaced) {
            filteredJobs = filteredJobs.filter((j) => j.requirement_status !== 'replaced');
        }

        const currentLatest = jobs.find((j) => j.is_latest_version) || jobs[jobs.length - 1];

        const versions = jobs.map((job) => ({
            jobId: job.id,
            version: job.version || 1,
            status: (job.requirement_status as 'open' | 'on_hold' | 'closed' | 'cancelled' | 'replaced'),
            createdAt: job.created_at?.toISOString(),
            title: job.title,
            replacedByJobId: job.requirement_status === 'replaced' ? currentLatest.id : undefined,
            replacedByVersion:
                job.requirement_status === 'replaced' ? currentLatest.version : undefined,
        }));

        return {
            clientReqId,
            totalVersions: jobs.length,
            currentVersion: {
                jobId: currentLatest.id,
                version: currentLatest.version || 1,
                status: currentLatest.requirement_status,
                createdAt: currentLatest.created_at?.toISOString(),
                title: currentLatest.title,
            },
            versions,
        };
    }

    /**
     * Fetch complete requirement details (raw email + instructions + tracker)
     */
    async getRequirementDetails(
        jobId: string,
        companyId: string,
    ): Promise<RequirementDetailsResponseDto> {
        const job = await this.jobRepository.findOne({
            where: { id: jobId, company_id: companyId },
        });

        if (!job) {
            throw new Error(`Job not found: ${jobId}`);
        }

        const emailSource = await this.emailSourceRepository.findOne({
            where: { id: job.email_source_id },
        });

        const instructions = await this.instructionRepository.find({
            where: { job_id: jobId },
            order: { display_order: 'ASC' },
        });

        const tracker = await this.candidateTrackerRepository.findOne({
            where: { job_id: jobId },
        });

        return {
            jobId: job.id,
            clientReqId: job.client_req_id,
            title: job.title,
            status: job.requirement_status,
            version: job.version || 1,
            rawEmail: {
                emailSourceId: emailSource?.id,
                rawEmailContent: emailSource?.raw_email_content,
                emailSubject: emailSource?.email_subject,
                emailFrom: emailSource?.sender_email,
                emailReceivedAt: emailSource?.received_date?.toISOString(),
            },
            instructions: instructions.map((i) => ({
                id: i.id,
                type: i.instruction_type as any,
                title: i.content?.split('\n')[0] || 'Instruction',
                content: i.content,
                highlight_level: i.highlight_level as any,
                is_mandatory: i.is_mandatory,
                display_order: i.display_order,
            })),
            candidateTracker: tracker
                ? {
                    id: tracker.id,
                    required_fields: (tracker.required_fields || []).map((f: any) => ({
                        field: f.field,
                        type: f.type,
                        required: f.required,
                        description: f.description || '',
                    })),
                    field_order: tracker.field_order || [],
                    validation_rules: tracker.validation_rules || {},
                    template_content: tracker.template_content,
                }
                : null,
            attachmentsMetadata: (emailSource?.attachments_metadata || []).map((a: any) => ({
                filename: a.filename,
                mimeType: a.mimeType || '',
                size: a.size || 0,
            })),
            previousVersionJobId: job.original_job_id,
        };
    }

    /**
     * Helper: Extract client req ID from email content
     * Looks for patterns like "545390" at the start or "ECMS: 545390"
     */
    private extractClientReqIdFromContent(content: string): string | null {
        // Try pattern: "545390 - Senior PEGA developer"
        const match = content.match(/^\s*(\d{5,})\s*[-–]/m);
        if (match) return match[1];

        // Try pattern: "ECMS: 545390"
        const ecmsMatch = content.match(/ECMS[:\s]+(\d{5,})/i);
        if (ecmsMatch) return ecmsMatch[1];

        return null;
    }

    /**
     * Helper: Extract attachment metadata from email
     * Looks for common attachment indicators
     */
    private extractAttachmentsMetadata(
        content: string,
    ): Array<{ filename: string; mimeType: string; size: number }> {
        // For now, return empty array - Phase 2 will handle actual file parsing
        // In Phase 2: parse email MIME to extract actual attachments
        return [];
    }
}
