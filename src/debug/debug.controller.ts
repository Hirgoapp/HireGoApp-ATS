import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/tenant.guard';

@Controller('debug')
export class DebugController {
    @Get('current-user')
    @UseGuards(JwtAuthGuard)
    async getCurrentUser(@Req() req: any) {
        return {
            statusCode: 200,
            message: 'Current user info',
            data: {
                id: req.user?.id,
                email: req.user?.email,
                company_id: req.user?.company_id || req.company_id,
                full_user: req.user,
            },
        };
    }
}
