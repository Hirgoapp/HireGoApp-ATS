import { Controller, Post, UseInterceptors, UploadedFile, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/tenant.guard';
import { JdFileService } from '../services/jd-file.service';

@ApiTags('Jobs - JD Upload')
@Controller('api/v1/jobs/:jobId/jd-upload')
@UseGuards(JwtAuthGuard)
export class JdUploadController {
    constructor(private readonly jdFileService: JdFileService) { }

    @Post()
    @ApiOperation({ summary: 'Upload JD file (PDF, DOCX, TXT)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(
        FileInterceptor('file', {
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB limit
            },
            fileFilter: (req, file, cb) => {
                const allowedMimes = [
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/msword',
                    'text/plain',
                    // Email formats
                    'message/rfc822', // .eml
                    'application/vnd.ms-outlook', // .msg (common on Windows)
                ];

                // Some browsers may send generic or missing mime types; also check extension
                const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.eml', '.msg'];
                const filename = (file.originalname || '').toLowerCase();
                const hasAllowedExtension = allowedExtensions.some((ext) => filename.endsWith(ext));

                if (allowedMimes.includes(file.mimetype) || hasAllowedExtension) {
                    cb(null, true);
                } else {
                    cb(new BadRequestException('Only PDF, DOCX, DOC, TXT, EML, and MSG files are allowed'), false);
                }
            },
        })
    )
    async uploadJdFile(@Param('jobId') jobId: string, @UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const result = await this.jdFileService.processAndStoreJdFile(jobId, file);

        return {
            success: true,
            message: 'JD file uploaded and processed successfully',
            data: result,
        };
    }
}
