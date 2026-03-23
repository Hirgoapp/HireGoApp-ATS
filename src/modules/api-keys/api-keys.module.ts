import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from './entities/api-key.entity';
import { ApiKeyUsage } from './entities/api-key-usage.entity';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';

@Module({
    imports: [TypeOrmModule.forFeature([ApiKey, ApiKeyUsage])],
    controllers: [ApiKeysController],
    providers: [ApiKeysService],
    exports: [ApiKeysService],
})
export class ApiKeysModule { }
