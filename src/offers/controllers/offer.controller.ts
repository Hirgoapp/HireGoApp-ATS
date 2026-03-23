import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    Req,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { OfferService } from '../services/offer.service';
import {
    CreateOfferDto,
    UpdateOfferDto,
    IssueOfferDto,
    AcceptOfferDto,
    RejectOfferDto,
    WithdrawOfferDto,
} from '../dtos/offer.dto';

@Controller('api/v1/offers')
@UseGuards(JwtAuthGuard)
export class OfferController {
    constructor(private readonly offerService: OfferService) { }

    /**
     * Create a new offer (draft)
     */
    @Post()
    @RequirePermissions('offers:create')
    async createOffer(
        @Body() createDto: CreateOfferDto,
        @Req() req: any,
    ) {
        const companyId = req.user.company_id;
        const userId = req.user.id;
        return this.offerService.createOffer(createDto, companyId, userId);
    }

    /**
     * Get all offers (paginated)
     */
    @Get()
    @RequirePermissions('offers:read')
    async getOffers(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @Req() req: any,
    ) {
        const companyId = req.user.company_id;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        return this.offerService.getAllOffers(companyId, pageNum, limitNum);
    }

    /**
     * Get offer by ID
     */
    @Get(':id')
    @RequirePermissions('offers:read')
    async getOffer(
        @Param('id') id: string,
        @Req() req: any,
    ) {
        const companyId = req.user.company_id;
        return this.offerService.getOffer(id, companyId);
    }

    /**
     * Get offers by submission
     */
    @Get('submission/:submissionId')
    @RequirePermissions('offers:read')
    async getOffersBySubmission(
        @Param('submissionId') submissionId: string,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @Req() req: any,
    ) {
        const companyId = req.user.company_id;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        return this.offerService.getOffersBySubmission(
            submissionId,
            companyId,
            pageNum,
            limitNum,
        );
    }

    /**
     * Update offer (draft only)
     */
    @Patch(':id')
    @RequirePermissions('offers:update')
    async updateOffer(
        @Param('id') id: string,
        @Body() updateDto: UpdateOfferDto,
        @Req() req: any,
    ) {
        const companyId = req.user.company_id;
        const userId = req.user.id;
        return this.offerService.updateOffer(id, updateDto, companyId, userId);
    }

    /**
     * Issue offer (draft → issued)
     */
    @Post(':id/issue')
    @RequirePermissions('offers:issue')
    async issueOffer(
        @Param('id') id: string,
        @Body() issueDto: IssueOfferDto,
        @Req() req: any,
    ) {
        const companyId = req.user.company_id;
        const userId = req.user.id;
        return this.offerService.issueOffer(
            id,
            companyId,
            userId,
            issueDto.notes,
        );
    }

    /**
     * Accept offer (issued → accepted)
     */
    @Post(':id/accept')
    @RequirePermissions('offers:accept')
    async acceptOffer(
        @Param('id') id: string,
        @Body() acceptDto: AcceptOfferDto,
        @Req() req: any,
    ) {
        const companyId = req.user.company_id;
        const userId = req.user.id;
        return this.offerService.acceptOffer(
            id,
            companyId,
            userId,
            acceptDto.metadata,
        );
    }

    /**
     * Reject offer (issued → rejected)
     */
    @Post(':id/reject')
    @RequirePermissions('offers:reject')
    async rejectOffer(
        @Param('id') id: string,
        @Body() rejectDto: RejectOfferDto,
        @Req() req: any,
    ) {
        const companyId = req.user.company_id;
        const userId = req.user.id;
        return this.offerService.rejectOffer(
            id,
            companyId,
            userId,
            rejectDto.reason,
            rejectDto.metadata,
        );
    }

    /**
     * Withdraw offer (issued → withdrawn)
     */
    @Post(':id/withdraw')
    @RequirePermissions('offers:withdraw')
    async withdrawOffer(
        @Param('id') id: string,
        @Body() withdrawDto: WithdrawOfferDto,
        @Req() req: any,
    ) {
        const companyId = req.user.company_id;
        const userId = req.user.id;
        return this.offerService.withdrawOffer(
            id,
            companyId,
            userId,
            withdrawDto.reason,
        );
    }

    /**
     * Delete offer (soft delete, draft only)
     */
    @Delete(':id')
    @RequirePermissions('offers:update')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteOffer(
        @Param('id') id: string,
        @Req() req: any,
    ) {
        const companyId = req.user.company_id;
        await this.offerService.deleteOffer(id, companyId);
    }

    /**
     * Get offer status history
     */
    @Get(':id/status-history')
    @RequirePermissions('offers:view_history')
    async getStatusHistory(
        @Param('id') id: string,
        @Req() req: any,
    ) {
        const companyId = req.user.company_id;
        return this.offerService.getStatusHistory(id, companyId);
    }

    /**
     * Get offer statistics by status
     */
    @Get('stats/by-status')
    @RequirePermissions('offers:read')
    async getStatistics(@Req() req: any) {
        const companyId = req.user.company_id;
        return this.offerService.getStatistics(companyId);
    }
}
