import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';

@Injectable()
export class SettingsRepository {
    constructor(
        @InjectRepository(Setting)
        private readonly repository: Repository<Setting>,
    ) {}

    async getSetting(companyId: string, key: string): Promise<Setting | null> {
        return this.repository.findOne({
            where: { company_id: companyId, setting_key: key },
        });
    }

    async setSetting(companyId: string, key: string, value: any): Promise<Setting> {
        let setting = await this.getSetting(companyId, key);
        if (!setting) {
            setting = this.repository.create({
                company_id: companyId,
                setting_key: key,
                setting_value: value,
            });
        } else {
            setting.setting_value = value;
        }
        return this.repository.save(setting);
    }

    async deleteSetting(companyId: string, key: string): Promise<void> {
        await this.repository.delete({ company_id: companyId, setting_key: key });
    }

    async getAllSettings(companyId: string): Promise<Setting[]> {
        return this.repository.find({
            where: { company_id: companyId },
            order: { setting_key: 'ASC' },
        });
    }
}

