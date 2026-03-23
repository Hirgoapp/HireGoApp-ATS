import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OfferService } from './services/offer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { UpdateOfferStatusDto } from './dto/update-status.dto';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { Offer, OfferStatus } from './entities/offer.entity';

@ApiTags('Offers')
@ApiBearerAuth('access-token')
@UseGuards(PermissionGuard, TenantGuard)
@Controller('api/v1/offers')
export class OffersController {
    constructor(private readonly offerService: OfferService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @RequirePermissions('offers:create')
    @ApiOperation({ summary: 'Create offer' })
    @ApiResponse({ status: 201, type: Offer })
    async createOffer(
        @Body() dto: CreateOfferDto,
        @Req() req: any,
    ): Promise<Offer> {
        const { companyId, userId } = req.tenant;
        return this.offerService.createOffer(String(companyId), String(userId), dto);
    }

    @Get()
    @RequirePermissions('offers:view')
    @ApiOperation({ summary: 'List offers' })
    async listOffers(
        @Query('submission_id') submissionId?: string,
        @Query('status') status?: string,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('skip') skip: number = 0,
        @Query('take') take: number = 20,
        @Req() req?: any,
    ) {
        const { companyId } = req.tenant;
        return this.offerService.listOffers(String(companyId), skip, take, {
            submission_id: submissionId,
            status: status as OfferStatus | undefined,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
        });
    }

    @Get(':id')
    @RequirePermissions('offers:view')
    @ApiOperation({ summary: 'Get offer' })
    async getOffer(
        @Param('id') id: string,
        @Req() req: any,
    ): Promise<Offer> {
        const { companyId } = req.tenant;
        return this.offerService.getOfferById(String(companyId), id);
    }

    @Patch(':id')
    @RequirePermissions('offers:update')
    @ApiOperation({ summary: 'Update offer' })
    async updateOffer(
        @Param('id') id: string,
        @Body() dto: UpdateOfferDto,
        @Req() req: any,
    ): Promise<Offer> {
        const { companyId, userId } = req.tenant;
        return this.offerService.updateOffer(
            String(companyId),
            String(userId),
            id,
            dto,
        );
    }

    @Patch(':id/status')
    @RequirePermissions('offers:update')
    @ApiOperation({ summary: 'Update offer status' })
    async updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateOfferStatusDto,
        @Req() req: any,
    ): Promise<Offer> {
        const { companyId, userId } = req.tenant;
        return this.offerService.updateOfferStatus(
            String(companyId),
            String(userId),
            id,
            dto,
        );
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @RequirePermissions('offers:delete')
    @ApiOperation({ summary: 'Delete offer' })
    async deleteOffer(
        @Param('id') id: string,
        @Req() req: any,
    ): Promise<void> {
        const { companyId, userId } = req.tenant;
        await this.offerService.deleteOffer(
            String(companyId),
            String(userId),
            id,
        );
    }
}

