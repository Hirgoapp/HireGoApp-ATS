import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Entities
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserPermission } from './entities/user-permission.entity';
import { RolePermissionAudit } from './entities/role-permission-audit.entity';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';

// Repositories
import { RoleRepository } from './repositories/role.repository';
import { PermissionRepository } from './repositories/permission.repository';
import { RolePermissionRepository } from './repositories/role-permission.repository';
import { UserPermissionRepository } from './repositories/user-permission.repository';
import { RolePermissionAuditRepository } from './repositories/role-permission-audit.repository';
import { UserRoleRepository } from './repositories/user-role.repository';

// Services
import { AuthService } from './services/auth.service';
import { AuthorizationService } from './services/authorization.service';

// Guards
import { PermissionGuard } from './guards/permission.guard';
import { AnyPermissionGuard } from './guards/any-permission.guard';

// Interceptors
import { SensitiveActionInterceptor } from './interceptors/sensitive-action.interceptor';

// Controllers
import { AuthController } from './controllers/auth.controller';
import { RbacController } from './controllers/rbac.controller';

// Common modules
import { CommonModule } from '../common/common.module';

// SSO Module
// import { SsoModule } from './sso/sso.module'; // TEMP disabled – conflicting AuthService declaration

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([
            Role,
            Permission,
            RolePermission,
            UserPermission,
            RolePermissionAudit,
            User,
            UserRole,
        ]),
        forwardRef(() => CommonModule),
        // SsoModule, // TEMP disabled – conflicting AuthService declaration
    ],
    controllers: [AuthController, RbacController],
    providers: [
        // Repositories
        RoleRepository,
        PermissionRepository,
        RolePermissionRepository,
        UserPermissionRepository,
        RolePermissionAuditRepository,
        UserRoleRepository,

        // Services
        AuthService,
        AuthorizationService,

        // Guards
        PermissionGuard,
        AnyPermissionGuard,

        // Interceptors
        SensitiveActionInterceptor,
    ],
    exports: [
        // Export services and guards for use in other modules
        AuthService,
        AuthorizationService,
        PermissionGuard,
        AnyPermissionGuard,
        SensitiveActionInterceptor,
    ],
})
export class AuthModule { }
