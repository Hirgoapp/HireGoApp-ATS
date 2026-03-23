import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    Request,
    UseGuards,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    UploadedFile,
    Res,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { FilterDocumentDto } from './dto/filter-document.dto';
import { DocumentResponseDto } from './dto/document-response.dto';
import { Document } from './entities/document.entity';
import { JwtAuthGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('api/v1/documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
    constructor(private readonly documentService: DocumentService) { }

    @Post('upload')
    @RequirePermissions('documents:create')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload document' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                entity_type: { type: 'string' },
                entity_id: { type: 'string' },
                document_type: { type: 'string' },
                is_public: { type: 'boolean' },
            },
        },
    })
    @ApiResponse({ status: 201, type: DocumentResponseDto })
    async upload(
        @UploadedFile() file: any,
        @Body() dto: CreateDocumentDto,
        @Request() req,
    ): Promise<Document> {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return await this.documentService.upload(file, dto, companyId, userId);
    }

    @Get()
    @RequirePermissions('documents:read')
    @ApiOperation({ summary: 'List documents' })
    async findAll(@Request() req, @Query() filter: FilterDocumentDto) {
        const companyId = req.user.company_id;
        return await this.documentService.findAll(companyId, filter);
    }

    @Get('entity/:entityType/:entityId')
    @RequirePermissions('documents:read')
    @ApiOperation({ summary: 'Get documents by entity' })
    async findByEntity(@Request() req, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
        const companyId = req.user.company_id;
        return await this.documentService.findByEntity(entityType, entityId, companyId);
    }

    @Get(':id')
    @RequirePermissions('documents:read')
    @ApiOperation({ summary: 'Get document by ID' })
    @ApiResponse({ status: 200, type: DocumentResponseDto })
    async findOne(@Request() req, @Param('id') id: string): Promise<Document> {
        const companyId = req.user.company_id;
        return await this.documentService.findOne(id, companyId);
    }

    @Get(':id/presigned-url')
    @RequirePermissions('documents:read')
    @ApiOperation({ summary: 'Get presigned download URL' })
    async getPresignedUrl(@Request() req, @Param('id') id: string) {
        const companyId = req.user.company_id;
        const result = await this.documentService.getPresignedDownloadUrl(id, companyId);
        if (!result?.url) {
            return { url: null, expires_in: 0 };
        }
        return { url: result.url, expires_in: result.expiresIn };
    }

    @Get(':id/download')
    @RequirePermissions('documents:read')
    @ApiOperation({ summary: 'Download document' })
    async download(@Request() req, @Param('id') id: string, @Res() res: Response) {
        const companyId = req.user.company_id;

        const redirectToggle = (process.env.DOCUMENTS_PRESIGNED_REDIRECT || 'true').toLowerCase() !== 'false';
        if (redirectToggle) {
            const presigned = await this.documentService.getPresignedDownloadUrl(id, companyId);
            if (presigned?.url) {
                return res.redirect(presigned.url);
            }
        }

        const { buffer, document } = await this.documentService.download(id, companyId);
        res.setHeader('Content-Type', document.mime_type);
        res.setHeader('Content-Disposition', `attachment; filename="${document.original_name}"`);
        res.setHeader('Content-Length', document.file_size);
        res.send(buffer);
    }

    @Put(':id')
    @RequirePermissions('documents:update')
    @ApiOperation({ summary: 'Update document metadata' })
    async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateDocumentDto) {
        const companyId = req.user.company_id;
        return await this.documentService.update(id, dto, companyId);
    }

    @Delete(':id')
    @RequirePermissions('documents:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Soft delete document' })
    async remove(@Request() req, @Param('id') id: string): Promise<void> {
        const companyId = req.user.company_id;
        await this.documentService.remove(id, companyId);
    }

    @Delete(':id/hard')
    @RequirePermissions('documents:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Hard delete document and file' })
    async hardDelete(@Request() req, @Param('id') id: string): Promise<void> {
        const companyId = req.user.company_id;
        await this.documentService.hardDelete(id, companyId);
    }
}
