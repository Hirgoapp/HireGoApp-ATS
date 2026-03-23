import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SuperAdminController } from './controllers/super-admin.controller';
import { SuperAdminService } from './services/super-admin.service';
import { SuperAdminInviteService } from './services/super-admin-invite.service';
import { SuperAdminAuthController } from './controllers/super-admin-auth.controller';
import { SuperAdminAuthService } from './services/super-admin-auth.service';
import { EmailConfigController } from './controllers/email-config.controller';
import { EmailConfigService } from './services/email-config.service';
import { User } from '../auth/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { SuperAdminUser } from './entities/super-admin-user.entity';
import { SuperAdminInvite } from './entities/super-admin-invite.entity';
import { CommonModule } from '../common/common.module';
import { EmailModule } from '../modules/email/email.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Company,
            SuperAdminUser,
            SuperAdminInvite
        ]),
        CommonModule,
        EmailModule,
        AuthModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get('SUPER_ADMIN_JWT_SECRET', 'super-admin-secret'),
                signOptions: { expiresIn: '24h' },
            }),
        }),
    ],
    controllers: [SuperAdminController, SuperAdminAuthController, EmailConfigController],
    providers: [SuperAdminService, SuperAdminAuthService, SuperAdminInviteService, EmailConfigService],
    exports: [SuperAdminService, SuperAdminAuthService, SuperAdminInviteService, EmailConfigService],
})
export class SuperAdminModule { }
