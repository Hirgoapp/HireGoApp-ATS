import { Injectable, BadRequestException } from '@nestjs/common';
import { SettingsRepository } from '../repositories/settings.repository';
import { Setting } from '../entities/setting.entity';
import { AuditService } from '../../common/services/audit.service';
import { SETTINGS_KEYS, SETTINGS_REGISTRY, type SettingDefinition } from '../settings.registry';

@Injectable()
export class SettingsService {
    constructor(
        private readonly settingsRepository: SettingsRepository,
        private readonly auditService: AuditService,
    ) {}

    private validateKey(key: string) {
        if (!SETTINGS_KEYS.has(key)) {
            throw new BadRequestException(
                `Unsupported setting key: ${key}. Allowed keys: ${Array.from(SETTINGS_KEYS).join(', ')}`,
            );
        }
    }

    getSchema(): SettingDefinition[] {
        return SETTINGS_REGISTRY;
    }

    async getAllSettings(companyId: string): Promise<Setting[]> {
        return this.settingsRepository.getAllSettings(companyId);
    }

    async getSetting(companyId: string, key: string): Promise<Setting | null> {
        this.validateKey(key);
        return this.settingsRepository.getSetting(companyId, key);
    }

    async setSetting(companyId: string, userId: string, key: string, value: any): Promise<Setting> {
        this.validateKey(key);

        const setting = await this.settingsRepository.setSetting(companyId, key, value);

        // Log change
        await this.auditService.log(companyId, userId, {
            entityType: 'Setting',
            entityId: setting.id,
            action: 'SETTING_UPDATED',
            newValues: {
                key,
                value,
            },
        });

        return setting;
    }

    async deleteSetting(companyId: string, userId: string, key: string): Promise<void> {
        this.validateKey(key);

        await this.settingsRepository.deleteSetting(companyId, key);

        await this.auditService.log(companyId, userId, {
            entityType: 'Setting',
            entityId: key,
            action: 'SETTING_DELETED',
            newValues: { key },
        });
    }
}

