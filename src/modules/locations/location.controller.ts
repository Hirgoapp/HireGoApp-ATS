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
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { FilterLocationDto } from './dto/filter-location.dto';
import { LocationResponseDto } from './dto/location-response.dto';
import { JwtAuthGuard } from '../../common/guards/tenant.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@ApiTags('locations')
@ApiBearerAuth()
@Controller('api/v1/locations')
@UseGuards(JwtAuthGuard)
export class LocationController {
    constructor(private readonly locationService: LocationService) { }

    @Post()
    @RequirePermissions('locations:create')
    @ApiOperation({ summary: 'Create a new location' })
    @ApiResponse({ status: 201, description: 'Location created successfully', type: LocationResponseDto })
    async create(@Body() createLocationDto: CreateLocationDto, @Request() req): Promise<LocationResponseDto> {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return await this.locationService.create(createLocationDto, companyId, userId);
    }

    @Get()
    @RequirePermissions('locations:read')
    @ApiOperation({ summary: 'Get all locations with filters and pagination' })
    @ApiResponse({ status: 200, description: 'Locations retrieved successfully' })
    async findAll(@Request() req, @Query() filterDto: FilterLocationDto) {
        const companyId = req.user.company_id;
        return await this.locationService.findAll(companyId, filterDto);
    }

    @Get('search')
    @RequirePermissions('locations:read')
    @ApiOperation({ summary: 'Search locations by name, city, or country' })
    @ApiResponse({ status: 200, description: 'Search results' })
    async search(@Request() req, @Query('term') searchTerm: string) {
        const companyId = req.user.company_id;
        return await this.locationService.searchLocations(companyId, searchTerm);
    }

    @Get('stats/count')
    @RequirePermissions('locations:read')
    @ApiOperation({ summary: 'Get total location count' })
    @ApiResponse({ status: 200, description: 'Location count retrieved' })
    async getCount(@Request() req) {
        const companyId = req.user.company_id;
        const count = await this.locationService.getCount(companyId);
        return { count };
    }

    @Get('headquarters')
    @RequirePermissions('locations:read')
    @ApiOperation({ summary: 'Get headquarters location' })
    @ApiResponse({ status: 200, description: 'Headquarters location retrieved' })
    async findHeadquarters(@Request() req) {
        const companyId = req.user.company_id;
        return await this.locationService.findHeadquarters(companyId);
    }

    @Get('active')
    @RequirePermissions('locations:read')
    @ApiOperation({ summary: 'Get all active locations' })
    @ApiResponse({ status: 200, description: 'Active locations retrieved' })
    async findActive(@Request() req) {
        const companyId = req.user.company_id;
        return await this.locationService.findActive(companyId);
    }

    @Get('by-city/:city')
    @RequirePermissions('locations:read')
    @ApiOperation({ summary: 'Get locations by city' })
    @ApiResponse({ status: 200, description: 'Locations retrieved by city' })
    async findByCity(@Request() req, @Param('city') city: string) {
        const companyId = req.user.company_id;
        return await this.locationService.findByCity(companyId, city);
    }

    @Get(':id')
    @RequirePermissions('locations:read')
    @ApiOperation({ summary: 'Get location by ID' })
    @ApiResponse({ status: 200, description: 'Location retrieved successfully', type: LocationResponseDto })
    @ApiResponse({ status: 404, description: 'Location not found' })
    async findOne(@Request() req, @Param('id') id: string): Promise<LocationResponseDto> {
        const companyId = req.user.company_id;
        return await this.locationService.findOne(id, companyId);
    }

    @Put(':id')
    @RequirePermissions('locations:update')
    @ApiOperation({ summary: 'Update location' })
    @ApiResponse({ status: 200, description: 'Location updated successfully', type: LocationResponseDto })
    @ApiResponse({ status: 404, description: 'Location not found' })
    async update(@Request() req, @Param('id') id: string, @Body() updateLocationDto: UpdateLocationDto): Promise<LocationResponseDto> {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return await this.locationService.update(id, updateLocationDto, companyId, userId);
    }

    @Put(':id/set-headquarters')
    @RequirePermissions('locations:update')
    @ApiOperation({ summary: 'Set location as headquarters' })
    @ApiResponse({ status: 200, description: 'Headquarters set successfully', type: LocationResponseDto })
    @ApiResponse({ status: 404, description: 'Location not found' })
    async setHeadquarters(@Request() req, @Param('id') id: string): Promise<LocationResponseDto> {
        const companyId = req.user.company_id;
        const userId = req.user.userId;
        return await this.locationService.setHeadquarters(id, companyId, userId);
    }

    @Delete(':id')
    @RequirePermissions('locations:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete location (soft delete)' })
    @ApiResponse({ status: 204, description: 'Location deleted successfully' })
    @ApiResponse({ status: 404, description: 'Location not found' })
    async remove(@Request() req, @Param('id') id: string): Promise<void> {
        const companyId = req.user.company_id;
        await this.locationService.remove(id, companyId);
    }

    @Delete(':id/hard')
    @RequirePermissions('locations:delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Permanently delete location' })
    @ApiResponse({ status: 204, description: 'Location permanently deleted' })
    @ApiResponse({ status: 404, description: 'Location not found' })
    async hardDelete(@Request() req, @Param('id') id: string): Promise<void> {
        const companyId = req.user.company_id;
        await this.locationService.hardDelete(id, companyId);
    }
}
