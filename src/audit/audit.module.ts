import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './services/audit.service';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { AuditLogController } from './controllers/audit.controller';
import { AuditLog } from '../common/entities/audit-log.entity';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([AuditLog]), AuthModule],
    providers: [AuditService, AuditLogRepository],
    controllers: [AuditLogController],
    exports: [AuditService, AuditLogRepository],
})
export class AuditModule { }
