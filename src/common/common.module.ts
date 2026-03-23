import { Module, Global, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './services/audit.service';
import { CacheService } from './services/cache.service';
import { AuditLog } from './entities/audit-log.entity';
import { AuditController } from './controllers/audit.controller';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([AuditLog]), forwardRef(() => AuthModule)],
    controllers: [AuditController],
    providers: [AuditService, CacheService],
    exports: [AuditService, CacheService],
})
export class CommonModule { }
