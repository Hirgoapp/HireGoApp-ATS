import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    Req,
    HttpCode,
} from '@nestjs/common';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CustomFieldsService } from '../services/custom-fields.service';
import { CustomFieldFeatureGuard } from '../guards/custom-field-feature.guard';
import { RequireCustomFields } from '../decorators/require-custom-fields.decorator';
import { CreateCustomFieldDto } from '../dtos/create-custom-field.dto';
import { UpdateCustomFieldDto } from '../dtos/update-custom-field.dto';
import { SetCustomFieldValueDto } from '../dtos/set-custom-field-value.dto';
import { BulkSetCustomFieldValuesDto } from '../dtos/bulk-set-custom-field-values.dto';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@Controller('api/v1/custom-fields')
@UseGuards(PermissionGuard, TenantGuard, CustomFieldFeatureGuard)
@RequireCustomFields()
export class CustomFieldsController {
    constructor(private readonly customFieldsService: CustomFieldsService) { }

    /**
     * Create custom field
     */
    @Post()
    @RequirePermissions('custom_fields:create')
    async createField(
        @Body() dto: CreateCustomFieldDto,
        @Req() req: any
    ) {
        const { companyId, userId } = req.tenant;

        const field = await this.customFieldsService.createField(
            companyId,
            userId,
            dto
        );

        return {
            success: true,
            data: field,
        };
    }

    /**
     * Get all custom fields for entity type
     */
    @Get()
    @RequirePermissions('custom_fields:view')
    async getFields(
        @Query('entityType') entityType: string,
        @Req() req: any
    ) {
        const { companyId } = req.tenant;

        const fields = await this.customFieldsService.getFieldsByEntity(
            companyId,
            entityType
        );

        return {
            success: true,
            data: fields,
            count: fields.length,
        };
    }

    /**
     * Get single custom field
     */
    @Get(':fieldId')
    @RequirePermissions('custom_fields:view')
    async getField(
        @Param('fieldId') fieldId: string,
        @Req() req: any
    ) {
        const { companyId } = req.tenant;

        const field = await this.customFieldsService.getField(
            companyId,
            fieldId
        );

        return {
            success: true,
            data: field,
        };
    }

    /**
     * Update custom field
     */
    @Put(':fieldId')
    @RequirePermissions('custom_fields:update')
    async updateField(
        @Param('fieldId') fieldId: string,
        @Body() dto: UpdateCustomFieldDto,
        @Req() req: any
    ) {
        const { companyId, userId } = req.tenant;

        const field = await this.customFieldsService.updateField(
            companyId,
            fieldId,
            userId,
            dto
        );

        return {
            success: true,
            data: field,
        };
    }

    /**
     * Delete custom field
     */
    @Delete(':fieldId')
    @RequirePermissions('custom_fields:delete')
    @HttpCode(204)
    async deleteField(
        @Param('fieldId') fieldId: string,
        @Req() req: any
    ) {
        const { companyId, userId } = req.tenant;

        await this.customFieldsService.deleteField(
            companyId,
            fieldId,
            userId
        );
    }

    /**
     * Set value for custom field on entity
     */
    @Post(':fieldId/:entityType/:entityId/values')
    @RequirePermissions('custom_fields:update')
    async setFieldValue(
        @Param('fieldId') fieldId: string,
        @Param('entityType') entityType: string,
        @Param('entityId') entityId: string,
        @Body() dto: SetCustomFieldValueDto,
        @Req() req: any
    ) {
        const { companyId, userId } = req.tenant;

        const fieldValue = await this.customFieldsService.setFieldValue(
            companyId,
            userId,
            fieldId,
            entityType,
            entityId,
            dto.value
        );

        return {
            success: true,
            data: fieldValue,
        };
    }

    /**
     * Get value for custom field on entity
     */
    @Get(':fieldId/:entityType/:entityId/value')
    @RequirePermissions('custom_fields:view')
    async getFieldValue(
        @Param('fieldId') fieldId: string,
        @Param('entityType') entityType: string,
        @Param('entityId') entityId: string,
        @Req() req: any
    ) {
        const { companyId } = req.tenant;

        const value = await this.customFieldsService.getFieldValue(
            companyId,
            fieldId,
            entityType,
            entityId
        );

        return {
            success: true,
            data: { value },
        };
    }

    /**
     * Get all custom field values for entity
     */
    @Get(':entityType/:entityId/values')
    @RequirePermissions('custom_fields:view')
    async getEntityValues(
        @Param('entityType') entityType: string,
        @Param('entityId') entityId: string,
        @Req() req: any
    ) {
        const { companyId } = req.tenant;

        const values = await this.customFieldsService.getEntityValues(
            companyId,
            entityType,
            entityId
        );

        return {
            success: true,
            data: values,
        };
    }

    /**
     * Bulk set values for multiple entities
     */
    @Post(':fieldId/:entityType/bulk-values')
    async bulkSetValues(
        @Param('fieldId') fieldId: string,
        @Param('entityType') entityType: string,
        @Body() dto: BulkSetCustomFieldValuesDto,
        @Req() req: any
    ) {
        const companyId = req.user.company_id;
        const userId = req.user.id;

        const result = await this.customFieldsService.bulkSetValues(
            companyId,
            userId,
            fieldId,
            entityType,
            dto.entityIds,
            dto.value
        );

        return {
            success: true,
            data: result,
        };
    }
}
