import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
    Req,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CandidateService } from './candidate.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { FilterCandidateDto } from './dto/filter-candidate.dto';
import { AdvancedCandidateSearchDto, AdvancedCandidateSearchResponseDto } from './dto/advanced-search-candidate.dto';
import { BulkImportCandidateDto, BulkImportResultDto } from './dto/bulk-import-candidate.dto';
import { BulkUpdateCandidateDto, BulkUpdateResultDto } from './dto/bulk-update-candidate.dto';
import { CandidateResponseDto, CandidateListResponseDto } from './dto/candidate-response.dto';
import { JwtAuthGuard } from '../common/guards/tenant.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { parseCandidateCsv, generateCandidateCsvTemplate } from './utils/csv-parser.util';
import { AsyncJobsService } from '../modules/async-jobs/async-jobs.service';
import { EnqueueBulkImportDto } from '../modules/async-jobs/dto/bulk-import.dto';
import { StorageService } from '../common/services/storage.service';

@ApiTags('Candidates')
@Controller('api/v1/candidates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CandidateController {
    constructor(
        private readonly candidateService: CandidateService,
        private readonly jobsService: AsyncJobsService,
        private readonly storageService: StorageService,
    ) { }

    @Post()
    @RequirePermissions('candidates:create')
    @ApiOperation({ summary: 'Create a new candidate' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Candidate created successfully',
        type: CandidateResponseDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input or duplicate email' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
    async create(@Body() createCandidateDto: CreateCandidateDto, @Req() req: any): Promise<CandidateResponseDto> {
        const companyId = req.tenant.companyId;
        const userId = req.tenant.userId;
        return this.candidateService.create(createCandidateDto, companyId, userId);
    }

    @Get()
    @RequirePermissions('candidates:read')
    @ApiOperation({ summary: 'Get all candidates (paginated, filtered)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Candidates retrieved successfully',
        type: CandidateListResponseDto,
    })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
    async findAll(@Query() filterDto: FilterCandidateDto, @Req() req: any): Promise<CandidateListResponseDto> {
        const companyId = req.tenant.companyId;
        return this.candidateService.findAll(companyId, filterDto);
    }

    @Get('stats')
    @RequirePermissions('candidates:read')
    @ApiOperation({ summary: 'Get candidate statistics' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Statistics retrieved successfully',
    })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
    async getStats(@Req() req: any): Promise<any> {
        const companyId = req.tenant.companyId;
        return this.candidateService.getStats(companyId);
    }

    @Get('search/skills')
    @RequirePermissions('candidates:read')
    @ApiOperation({ summary: 'Search candidates by skills' })
    @ApiQuery({ name: 'skills', required: true, description: 'Skills to search for (comma-separated or text)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Candidates found',
        type: [CandidateResponseDto],
    })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
    async searchBySkills(@Query('skills') skills: string, @Req() req: any): Promise<CandidateResponseDto[]> {
        const companyId = req.tenant.companyId;
        return this.candidateService.searchBySkills(companyId, skills);
    }

    @Get(':id')
    @RequirePermissions('candidates:read')
    @ApiOperation({ summary: 'Get candidate by ID' })
    @ApiParam({ name: 'id', description: 'Candidate UUID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Candidate retrieved successfully',
        type: CandidateResponseDto,
    })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Candidate not found' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
    async findOne(@Param('id') id: string, @Req() req: any): Promise<CandidateResponseDto> {
        const companyId = req.tenant.companyId;
        return this.candidateService.findOne(id, companyId);
    }

    @Patch(':id')
    @RequirePermissions('candidates:update')
    @ApiOperation({ summary: 'Update candidate' })
    @ApiParam({ name: 'id', description: 'Candidate UUID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Candidate updated successfully',
        type: CandidateResponseDto,
    })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Candidate not found' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
    async update(
        @Param('id') id: string,
        @Body() updateCandidateDto: UpdateCandidateDto,
        @Req() req: any,
    ): Promise<CandidateResponseDto> {
        const companyId = req.tenant.companyId;
        const userId = req.tenant.userId;
        return this.candidateService.update(id, updateCandidateDto, companyId, userId);
    }

    @Delete(':id')
    @RequirePermissions('candidates:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Soft delete candidate (set status to Inactive)' })
    @ApiParam({ name: 'id', description: 'Candidate UUID' })
    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'Candidate deleted successfully',
    })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Candidate not found' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
    async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
        const companyId = req.tenant.companyId;
        return this.candidateService.remove(id, companyId);
    }

    @Delete(':id/hard')
    @RequirePermissions('candidates:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Hard delete candidate (permanent, admin only)' })
    @ApiParam({ name: 'id', description: 'Candidate UUID' })
    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'Candidate permanently deleted',
    })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Candidate not found' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
    async hardDelete(@Param('id') id: string, @Req() req: any): Promise<void> {
        const companyId = req.tenant.companyId;
        return this.candidateService.hardDelete(id, companyId);
    }

    @Post('search/advanced')
    @RequirePermissions('candidates:read')
    @ApiOperation({ summary: 'Advanced candidate search with filters, full-text, and custom fields' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Search results',
        type: AdvancedCandidateSearchResponseDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid query' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
    async advancedSearch(
        @Body() searchDto: AdvancedCandidateSearchDto,
        @Req() req: any,
    ): Promise<AdvancedCandidateSearchResponseDto> {
        const companyId = req.tenant.companyId;
        return this.candidateService.advancedSearch(companyId, searchDto);
    }

    @Post('bulk/import')
    @RequirePermissions('candidates:create')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Bulk import candidates from JSON array' })
    @ApiQuery({ name: 'async', required: false, description: 'If true, enqueue the import as a background job' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Bulk import completed',
        type: BulkImportResultDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
    async bulkImport(
        @Body() bulkImportDto: BulkImportCandidateDto,
        @Req() req?: any,
        @Query('async') asyncFlag?: string | boolean,
    ): Promise<BulkImportResultDto> {
        const companyId = req.tenant.companyId;
        const userId = req.tenant.userId;

        const isAsync = asyncFlag === true || (typeof asyncFlag === 'string' && asyncFlag.toLowerCase() === 'true');
        if (isAsync) {
            const key = `${companyId}/imports/candidates/${Date.now()}-bulk.json`;
            const buffer = Buffer.from(JSON.stringify(bulkImportDto));
            const upload = await this.storageService.upload(buffer, key, 'application/json');
            const dto: EnqueueBulkImportDto = {
                company_id: companyId,
                file_path: upload.location,
                label: `json-import-${new Date().toISOString()}`,
                dry_run: false,
                format: 'json',
            };
            await this.jobsService.enqueueBulkImport(dto);
            return {
                total: 0,
                success: 0,
                failed: 0,
                skipped: 0,
                errors: [],
                imported_ids: [],
            } as any;
        }

        return this.candidateService.bulkImport(bulkImportDto, companyId, userId);
    }

    @Post('bulk/import/csv')
    @RequirePermissions('candidates:create')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Bulk import candidates from CSV file' })
    @ApiQuery({ name: 'async', required: false, description: 'If true, enqueue the import as a background job' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                skip_duplicates: {
                    type: 'boolean',
                    default: false,
                },
                send_welcome_email: {
                    type: 'boolean',
                    default: false,
                },
                assign_to_recruiter_id: {
                    type: 'string',
                    format: 'uuid',
                },
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Bulk import from CSV completed',
        type: BulkImportResultDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid CSV file or format' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
    async bulkImportCsv(
        @UploadedFile() file: Express.Multer.File,
        @Body('skip_duplicates') skip_duplicates?: boolean,
        @Body('send_welcome_email') send_welcome_email?: boolean,
        @Body('assign_to_recruiter_id') assign_to_recruiter_id?: string,
        @Req() req?: any,
        @Query('async') asyncFlag?: string | boolean,
    ): Promise<BulkImportResultDto> {
        if (!file) {
            throw new BadRequestException('CSV file is required');
        }

        if (!file.originalname.toLowerCase().endsWith('.csv')) {
            throw new BadRequestException('Only CSV files are allowed');
        }
        const companyId = req.tenant.companyId;
        const isAsync = asyncFlag === true || (typeof asyncFlag === 'string' && asyncFlag.toLowerCase() === 'true');

        if (isAsync) {
            const key = `${companyId}/imports/candidates/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '')}`;
            const upload = await this.storageService.upload(file.buffer, key, 'text/csv');
            const dto: EnqueueBulkImportDto = {
                company_id: companyId,
                file_path: upload.location,
                label: `csv-import-${new Date().toISOString()}`,
                dry_run: false,
            };
            const job = await this.jobsService.enqueueBulkImport(dto);
            // Return lightweight acknowledgement; frontend can poll /jobs/bulk-import/:id
            return {
                total: 0,
                success: 0,
                failed: 0,
                skipped: 0,
                errors: [],
                imported_ids: [],
            } as any;
        }

        // Synchronous path (existing behavior)
        const csvContent = file.buffer.toString('utf-8');
        const parseResult = parseCandidateCsv(csvContent);
        if (parseResult.errors.length > 0) {
            throw new BadRequestException({ message: 'CSV parsing failed', errors: parseResult.errors });
        }
        const bulkImportDto: BulkImportCandidateDto = {
            candidates: parseResult.data,
            skip_duplicates: skip_duplicates === true || (skip_duplicates as any) === 'true',
            send_welcome_email: send_welcome_email === true || (send_welcome_email as any) === 'true',
            assign_to_recruiter_id,
        };
        const userId = req.tenant.userId;
        return this.candidateService.bulkImport(bulkImportDto, companyId, userId);
    }

    @Get('bulk/csv-template')
    @RequirePermissions('candidates:read')
    @ApiOperation({ summary: 'Download CSV template for bulk import' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'CSV template downloaded',
        content: {
            'text/csv': {
                schema: {
                    type: 'string',
                },
            },
        },
    })
    async getCsvTemplate(@Req() req: any): Promise<string> {
        return generateCandidateCsvTemplate();
    }

    @Post('bulk/update')
    @RequirePermissions('candidates:update')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Bulk update multiple candidates' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Bulk update completed',
        type: BulkUpdateResultDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
    async bulkUpdate(
        @Body() bulkUpdateDto: BulkUpdateCandidateDto,
        @Req() req: any,
    ): Promise<BulkUpdateResultDto> {
        const companyId = req.tenant.companyId;
        const userId = req.tenant.userId;
        return this.candidateService.bulkUpdate(bulkUpdateDto, companyId, userId);
    }
}

