import { Injectable } from '@nestjs/common';
import { AuditContext } from '../interfaces/audit-context.interface';

@Injectable()
export class AuditService {
    async log(companyId: string, userId: string, context: AuditContext): Promise<void> {
        console.log('[AUDIT]', {
            companyId,
            userId,
            ...context,
            timestamp: new Date().toISOString()
        });
    }
}
