/**
 * Multi-Tenant Enforcement Utilities
 * 
 * Helper functions for common multi-tenant enforcement patterns.
 */

import { BadRequestException, ForbiddenException } from '@nestjs/common';

/**
 * Verify that an entity belongs to the requesting company
 * 
 * Used before returning entity data to user.
 * 
 * @param entity - Entity object with company_id field
 * @param companyId - Tenant identifier from JWT
 * @throws ForbiddenException if entity doesn't belong to company
 */
export function verifyTenantOwnership(
    entity: any,
    companyId: string
): void {
    if (!entity) {
        throw new BadRequestException('Entity not found');
    }

    if (entity.company_id !== companyId) {
        throw new ForbiddenException(
            'You do not have access to this resource'
        );
    }
}

/**
 * Verify all entities belong to the requesting company
 * 
 * Used before bulk operations or responses.
 * 
 * @param entities - Array of entity objects with company_id field
 * @param companyId - Tenant identifier from JWT
 * @throws ForbiddenException if any entity doesn't belong to company
 */
export function verifyTenantOwnershipBulk(
    entities: any[],
    companyId: string
): void {
    for (const entity of entities) {
        if (entity.company_id !== companyId) {
            throw new ForbiddenException(
                'You do not have access to all selected resources'
            );
        }
    }
}

/**
 * Verify request body does not contain company_id field
 * 
 * Prevents users from modifying company_id via request body.
 * 
 * @param body - Request body object
 * @throws BadRequestException if company_id is present
 */
export function sanitizeCompanyIdFromBody(body: any): void {
    if (body && body.company_id) {
        throw new BadRequestException(
            'Cannot modify company_id in request body'
        );
    }
}

/**
 * Verify request body does not contain sensitive fields
 * 
 * Prevents users from modifying system fields via request body.
 * 
 * @param body - Request body object
 * @param forbiddenFields - Array of field names that should not be in body
 * @throws BadRequestException if forbidden field is present
 */
export function sanitizeBody(
    body: any,
    forbiddenFields: string[] = [
        'company_id',
        'created_at',
        'updated_at',
        'deleted_at'
    ]
): void {
    for (const field of forbiddenFields) {
        if (body && field in body) {
            throw new BadRequestException(
                `Cannot modify ${field} in request body`
            );
        }
    }
}

/**
 * Build a safe query filter that includes company_id
 * 
 * Ensures all queries are scoped to the tenant.
 * 
 * @param criteria - Query criteria (may contain company_id)
 * @param companyId - Tenant identifier
 * @returns Merged criteria with company_id enforced
 */
export function buildTenantFilter(
    criteria: Record<string, any> = {},
    companyId: string
): Record<string, any> {
    return {
        ...criteria,
        company_id: companyId
    };
}

/**
 * Verify cross-tenant relationships are within same company
 * 
 * When creating relationships between entities (e.g., application links job + candidate),
 * verify both entities belong to the same company.
 * 
 * @param entity1 - First entity object
 * @param entity2 - Second entity object
 * @param companyId - Tenant identifier
 * @throws BadRequestException if entities belong to different companies
 */
export function verifyRelationshipWithinTenant(
    entity1: any,
    entity2: any,
    companyId: string
): void {
    if (!entity1 || !entity2) {
        throw new BadRequestException('One or both entities not found');
    }

    if (entity1.company_id !== companyId || entity2.company_id !== companyId) {
        throw new BadRequestException(
            'Cannot create relationship between entities in different companies'
        );
    }

    if (entity1.company_id !== entity2.company_id) {
        throw new BadRequestException(
            'Cannot create relationship between entities in different companies'
        );
    }
}

/**
 * Verify multiple entities all belong to the same company
 * 
 * Used when creating relationships involving multiple entities.
 * 
 * @param entities - Array of entity objects
 * @param companyId - Tenant identifier
 * @throws BadRequestException if any entity doesn't belong to company
 */
export function verifyAllEntitiesWithinTenant(
    entities: any[],
    companyId: string
): void {
    for (const entity of entities) {
        if (!entity) {
            throw new BadRequestException('One or more entities not found');
        }

        if (entity.company_id !== companyId) {
            throw new BadRequestException(
                'Cannot create relationship involving entities from different companies'
            );
        }
    }
}

/**
 * Extract non-sensitive fields from entity
 * 
 * Prevents accidental exposure of sensitive fields in responses.
 * 
 * @param entity - Entity object
 * @param excludeFields - Fields to exclude from response
 * @returns Sanitized entity object
 */
export function sanitizeEntityResponse(
    entity: any,
    excludeFields: string[] = [
        'password_hash',
        'auth_provider_id',
        'key_hash'
    ]
): any {
    if (!entity) return entity;

    const sanitized = { ...entity };

    for (const field of excludeFields) {
        delete sanitized[field];
    }

    return sanitized;
}

/**
 * Extract non-sensitive fields from multiple entities
 * 
 * @param entities - Array of entity objects
 * @param excludeFields - Fields to exclude from response
 * @returns Array of sanitized entity objects
 */
export function sanitizeEntityResponseBulk(
    entities: any[],
    excludeFields: string[] = [
        'password_hash',
        'auth_provider_id',
        'key_hash'
    ]
): any[] {
    return entities.map(entity => sanitizeEntityResponse(entity, excludeFields));
}

/**
 * Build safe select query fields
 * 
 * Used with TypeORM select() to exclude sensitive fields at query time.
 * More efficient than post-processing.
 * 
 * @param allFields - All available fields
 * @param excludeFields - Fields to exclude
 * @returns Array of safe fields for select()
 */
export function buildSafeSelectFields(
    allFields: string[],
    excludeFields: string[] = []
): string[] {
    return allFields.filter(field => !excludeFields.includes(field));
}

/**
 * Validate pagination parameters
 * 
 * Prevents abuse (requesting millions of records, negative offset, etc).
 * 
 * @param limit - Records per page
 * @param offset - Number to skip
 * @throws BadRequestException if parameters invalid
 * @returns Validated { limit, offset }
 */
export function validatePaginationParams(
    limit: number = 20,
    offset: number = 0,
    maxLimit: number = 100
): { limit: number; offset: number } {
    if (limit < 1 || limit > maxLimit) {
        throw new BadRequestException(
            `Limit must be between 1 and ${maxLimit}`
        );
    }

    if (offset < 0) {
        throw new BadRequestException('Offset cannot be negative');
    }

    return { limit, offset };
}

/**
 * Check if user has permission for action
 * 
 * Used in services for permission enforcement.
 * 
 * @param userPermissions - User's permission array from JWT
 * @param requiredPermission - Permission to check
 * @throws ForbiddenException if user lacks permission
 */
export function checkPermission(
    userPermissions: string[],
    requiredPermission: string
): void {
    if (!userPermissions.includes(requiredPermission)) {
        throw new ForbiddenException(
            `You do not have permission to perform this action (required: ${requiredPermission})`
        );
    }
}

/**
 * Check if user has any of multiple permissions
 * 
 * @param userPermissions - User's permission array from JWT
 * @param requiredPermissions - Permissions to check
 * @throws ForbiddenException if user lacks all permissions
 */
export function checkPermissionAny(
    userPermissions: string[],
    requiredPermissions: string[]
): void {
    const hasPermission = requiredPermissions.some(
        perm => userPermissions.includes(perm)
    );

    if (!hasPermission) {
        throw new ForbiddenException(
            `You do not have permission to perform this action (required one of: ${requiredPermissions.join(', ')})`
        );
    }
}

/**
 * Check if user has all permissions
 * 
 * @param userPermissions - User's permission array from JWT
 * @param requiredPermissions - All permissions to check
 * @throws ForbiddenException if user lacks any permission
 */
export function checkPermissionAll(
    userPermissions: string[],
    requiredPermissions: string[]
): void {
    for (const perm of requiredPermissions) {
        checkPermission(userPermissions, perm);
    }
}
