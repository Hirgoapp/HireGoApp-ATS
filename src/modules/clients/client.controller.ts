import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { FilterClientDto } from './dto/filter-client.dto';
import { ClientResponseDto } from './dto/client-response.dto';
import { CreatePocDto } from './dto/create-poc.dto';
import { UpdatePocDto } from './dto/update-poc.dto';
import { PocResponseDto } from './dto/poc-response.dto';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('api/v1/clients')
@UseGuards(PermissionGuard, TenantGuard)
export class ClientController {
    constructor(private readonly clientService: ClientService) { }

    @Post()
    @RequirePermissions('clients:create')
    @ApiOperation({ summary: 'Create a new client' })
    @ApiResponse({ status: 201, description: 'Client created successfully', type: ClientResponseDto })
    async create(@Body() createClientDto: CreateClientDto, @Request() req): Promise<ClientResponseDto> {
        const companyId = req.tenant.companyId;
        const userId = req.tenant.userId;
        return await this.clientService.create(createClientDto, companyId, userId);
    }

    @Get()
    @RequirePermissions('clients:view')
    @ApiOperation({ summary: 'Get all clients with filters and pagination' })
    @ApiResponse({ status: 200, description: 'Clients retrieved successfully' })
    async findAll(@Request() req, @Query() filterDto: FilterClientDto) {
        const companyId = req.tenant.companyId;
        return await this.clientService.findAll(companyId, filterDto);
    }

    @Get('search')
    @RequirePermissions('clients:view')
    @ApiOperation({ summary: 'Search clients by name, email, or contact person' })
    @ApiResponse({ status: 200, description: 'Search results' })
    async search(@Request() req, @Query('term') searchTerm: string) {
        const companyId = req.tenant.companyId;
        return await this.clientService.searchClients(companyId, searchTerm);
    }

    @Get('stats/count')
    @RequirePermissions('clients:view')
    @ApiOperation({ summary: 'Get total client count' })
    @ApiResponse({ status: 200, description: 'Client count retrieved' })
    async getCount(@Request() req) {
        const companyId = req.tenant.companyId;
        const count = await this.clientService.getCount(companyId);
        return { count };
    }

    @Get('stats/by-status/:status')
    @RequirePermissions('clients:view')
    @ApiOperation({ summary: 'Get client count by status' })
    @ApiResponse({ status: 200, description: 'Client count by status retrieved' })
    async getCountByStatus(@Request() req, @Param('status') status: string) {
        const companyId = req.tenant.companyId;
        const count = await this.clientService.getCountByStatus(companyId, status);
        return { count };
    }

    @Get('stats/summary')
    @RequirePermissions('clients:view')
    @ApiOperation({ summary: 'Dashboard summary for clients list (counts + hiring clients)' })
    @ApiResponse({ status: 200, description: 'Summary retrieved' })
    async getListSummary(@Request() req) {
        const companyId = req.tenant.companyId;
        return await this.clientService.getListSummary(companyId);
    }

    @Get('by-status/:status')
    @RequirePermissions('clients:view')
    @ApiOperation({ summary: 'Get clients by status' })
    @ApiResponse({ status: 200, description: 'Clients retrieved by status' })
    async findByStatus(@Request() req, @Param('status') status: string) {
        const companyId = req.tenant.companyId;
        return await this.clientService.findByStatus(companyId, status);
    }

    @Get('active')
    @RequirePermissions('clients:view')
    @ApiOperation({ summary: 'Get all active clients' })
    @ApiResponse({ status: 200, description: 'Active clients retrieved' })
    async findActive(@Request() req) {
        const companyId = req.tenant.companyId;
        return await this.clientService.findActive(companyId);
    }

    @Get(':clientId/pocs')
    @RequirePermissions('clients:view')
    @ApiOperation({ summary: 'List POCs for a client' })
    @ApiResponse({ status: 200, description: 'POCs retrieved', type: [PocResponseDto] })
    async listPocs(@Request() req, @Param('clientId') clientId: string) {
        const companyId = req.tenant.companyId;
        return await this.clientService.findPocsByClientId(clientId, companyId);
    }

    @Post(':clientId/pocs')
    @RequirePermissions('clients:update')
    @ApiOperation({ summary: 'Create a POC for a client' })
    @ApiResponse({ status: 201, description: 'POC created', type: PocResponseDto })
    async createPoc(
        @Request() req,
        @Param('clientId') clientId: string,
        @Body() createPocDto: CreatePocDto,
    ): Promise<PocResponseDto> {
        const companyId = req.tenant.companyId;
        return await this.clientService.createPoc(clientId, createPocDto, companyId);
    }

    @Get(':clientId/pocs/:pocId')
    @RequirePermissions('clients:view')
    @ApiOperation({ summary: 'Get a POC by ID' })
    @ApiResponse({ status: 200, description: 'POC retrieved', type: PocResponseDto })
    async getPoc(
        @Request() req,
        @Param('clientId') clientId: string,
        @Param('pocId') pocId: string,
    ): Promise<PocResponseDto> {
        const companyId = req.tenant.companyId;
        return await this.clientService.findPocById(pocId, companyId, clientId);
    }

    @Put(':clientId/pocs/:pocId')
    @RequirePermissions('clients:update')
    @ApiOperation({ summary: 'Update a POC' })
    @ApiResponse({ status: 200, description: 'POC updated', type: PocResponseDto })
    async updatePoc(
        @Request() req,
        @Param('clientId') clientId: string,
        @Param('pocId') pocId: string,
        @Body() updatePocDto: UpdatePocDto,
    ): Promise<PocResponseDto> {
        const companyId = req.tenant.companyId;
        return await this.clientService.updatePoc(pocId, updatePocDto, companyId);
    }

    @Delete(':clientId/pocs/:pocId')
    @RequirePermissions('clients:update')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a POC' })
    @ApiResponse({ status: 204, description: 'POC deleted' })
    async deletePoc(
        @Request() req,
        @Param('clientId') clientId: string,
        @Param('pocId') pocId: string,
    ): Promise<void> {
        const companyId = req.tenant.companyId;
        await this.clientService.removePoc(pocId, companyId);
    }

    @Get(':id')
    @RequirePermissions('clients:view')
    @ApiOperation({ summary: 'Get client by ID' })
    @ApiResponse({ status: 200, description: 'Client retrieved successfully', type: ClientResponseDto })
    @ApiResponse({ status: 404, description: 'Client not found' })
    async findOne(@Request() req, @Param('id') id: string): Promise<ClientResponseDto> {
        const companyId = req.tenant.companyId;
        return await this.clientService.findOne(id, companyId);
    }

    @Put(':id')
    @RequirePermissions('clients:update')
    @ApiOperation({ summary: 'Update client' })
    @ApiResponse({ status: 200, description: 'Client updated successfully', type: ClientResponseDto })
    @ApiResponse({ status: 404, description: 'Client not found' })
    async update(@Request() req, @Param('id') id: string, @Body() updateClientDto: UpdateClientDto): Promise<ClientResponseDto> {
        const companyId = req.tenant.companyId;
        const userId = req.tenant.userId;
        return await this.clientService.update(id, updateClientDto, companyId, userId);
    }

    @Delete(':id')
    @RequirePermissions('clients:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete client (soft delete)' })
    @ApiResponse({ status: 204, description: 'Client deleted successfully' })
    @ApiResponse({ status: 404, description: 'Client not found' })
    async remove(@Request() req, @Param('id') id: string): Promise<void> {
        const companyId = req.tenant.companyId;
        await this.clientService.remove(id, companyId);
    }

    @Delete(':id/hard')
    @RequirePermissions('clients:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Permanently delete client' })
    @ApiResponse({ status: 204, description: 'Client permanently deleted' })
    @ApiResponse({ status: 404, description: 'Client not found' })
    async hardDelete(@Request() req, @Param('id') id: string): Promise<void> {
        const companyId = req.tenant.companyId;
        await this.clientService.hardDelete(id, companyId);
    }
}
