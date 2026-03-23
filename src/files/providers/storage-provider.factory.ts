import { Injectable } from '@nestjs/common';
import { StorageProvider } from '../interfaces/storage-provider.interface';
import { LocalStorageProvider } from './local-storage.provider';
import { SettingsService } from '../../settings/services/settings.service';

@Injectable()
export class StorageProviderFactory {
    constructor(
        private readonly localProvider: LocalStorageProvider,
        private readonly settingsService: SettingsService,
    ) {}

    /**
     * Select storage provider based on company settings.
     * For now only 'local' is implemented; others can be added later.
     */
    async getProvider(companyId: string): Promise<StorageProvider> {
        // Future: read from 'storage_provider' setting; default to 'local'
        // const setting = await this.settingsService.getSetting(companyId, 'storage_provider');
        // const provider = setting?.setting_value || 'local';

        const provider = 'local';

        switch (provider) {
            case 'local':
            default:
                return this.localProvider;
        }
    }
}

