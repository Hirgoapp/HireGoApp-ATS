import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entities
import { SsoConfiguration } from './entities/sso-configuration.entity';
import { SsoSession } from './entities/sso-session.entity';
import { MfaSecret } from './entities/mfa-secret.entity';
import { User } from '../entities/user.entity';

// Services
import { SsoService } from './services/sso.service';
import { MfaService } from './services/mfa.service';

// Strategies
import { GoogleStrategy } from './strategies/google.strategy';
import { SamlStrategyFactory } from './strategies/saml.strategy';

// Controllers
import { SsoController } from './controllers/sso.controller';
import { MfaController } from './controllers/mfa.controller';

// Import auth module for dependencies
import { AuthService } from '../services/auth.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SsoConfiguration,
            SsoSession,
            MfaSecret,
            User,
        ]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRATION') || '1h',
                },
            }),
            inject: [ConfigService],
        }),
        ConfigModule,
    ],
    providers: [
        SsoService,
        MfaService,
        GoogleStrategy,
        SamlStrategyFactory,
        AuthService, // Needed for JWT generation
    ],
    controllers: [
        SsoController,
        MfaController,
    ],
    exports: [
        SsoService,
        MfaService,
    ],
})
export class SsoModule { }
