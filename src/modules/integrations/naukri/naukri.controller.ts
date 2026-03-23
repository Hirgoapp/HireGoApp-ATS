import {
    Controller,
    Post,
    Body,
    UseGuards,
    Req,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { NaukriService } from './naukri.service';
import { CaptureProfileDto } from './dto/capture-profile.dto';
import { PermissionGuard } from '../../../auth/guards/permission.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { RequirePermissions } from '../../../auth/decorators/require-permissions.decorator';

@Controller('portal/api/naukri')
@UseGuards(PermissionGuard, TenantGuard)
export class NaukriController {
    constructor(private readonly naukriService: NaukriService) {}

    @Post('capture-profile')
    @RequirePermissions('candidates:create')
    async captureProfile(@Body() body: CaptureProfileDto, @Req() req: any) {
        const { companyId, userId } = req.tenant;
        const result = await this.naukriService.captureProfile(
            String(companyId),
            String(userId),
            body,
        );
        return result;
    }

    @Post('upload-cv')
    @UseInterceptors(FileInterceptor('file'))
    @RequirePermissions('files:upload')
    async uploadCv(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { naukri_profile_id?: string; candidate_name?: string; recruiter_id?: string },
        @Req() req: any,
    ) {
        const { companyId, userId } = req.tenant;
        const result = await this.naukriService.uploadCv(
            String(companyId),
            String(userId),
            file,
            {
                naukri_profile_id: body.naukri_profile_id,
                candidate_name: body.candidate_name,
            },
        );
        return result;
    }
}

