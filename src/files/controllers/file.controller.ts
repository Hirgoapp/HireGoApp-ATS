import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { FileService } from '../services/file.service';

@Controller('api/v1/files')
@UseGuards(PermissionGuard, TenantGuard)
export class FileController {
    constructor(private readonly fileService: FileService) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @RequirePermissions('files:upload')
    async upload(
        @Body() body: { entityType: string; entityId: string },
        @UploadedFile() file: Express.Multer.File,
        @Req() req: any,
    ) {
        const { companyId, userId } = req.tenant;
        const saved = await this.fileService.upload(
            String(companyId),
            String(userId),
            body.entityType,
            body.entityId,
            file,
        );

        return {
            success: true,
            data: saved,
        };
    }

    @Get(':entityType/:entityId')
    @RequirePermissions('files:view')
    async getFiles(
        @Param('entityType') entityType: string,
        @Param('entityId') entityId: string,
        @Req() req: any,
    ) {
        const { companyId } = req.tenant;
        const files = await this.fileService.getFiles(String(companyId), entityType, entityId);
        return {
            success: true,
            data: files,
        };
    }

    @Delete(':fileId')
    @RequirePermissions('files:delete')
    async delete(
        @Param('fileId') fileId: string,
        @Req() req: any,
    ) {
        const { companyId, userId } = req.tenant;
        await this.fileService.deleteFile(String(companyId), String(userId), fileId);

        return {
            success: true,
        };
    }
}

