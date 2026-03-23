import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Integration } from './entities/integration.entity';
import { IntegrationAccount } from './entities/integration-account.entity';
import { IntegrationRepository } from './repositories/integration.repository';
import { IntegrationService } from './services/integration.service';
import { IntegrationController } from './controllers/integration.controller';
import { IntegrationOAuthController } from './controllers/integration-oauth.controller';
import { AuthModule } from '../auth/auth.module';
import { NaukriModule } from '../modules/integrations/naukri/naukri.module';
import { IntegrationCryptoService } from './services/integration-crypto.service';
import { IntegrationAccountRepository } from './repositories/integration-account.repository';
import { IntegrationAccountService } from './services/integration-account.service';
import { IntegrationAccountsController } from './controllers/integration-accounts.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Integration, IntegrationAccount]), AuthModule, NaukriModule],
    controllers: [IntegrationController, IntegrationOAuthController, IntegrationAccountsController],
    providers: [
        IntegrationRepository,
        IntegrationService,
        IntegrationCryptoService,
        IntegrationAccountRepository,
        IntegrationAccountService,
    ],
    exports: [IntegrationService, IntegrationAccountService, NaukriModule],
})
export class IntegrationsModule {}
