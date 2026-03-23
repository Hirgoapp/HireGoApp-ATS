import { Repository, IsNull } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { License, LicenseTier, LicenseStatus } from '../entities/license.entity';

@Injectable()
export class LicenseRepository {
    constructor(
        @InjectRepository(License)
        private readonly repository: Repository<License>
    ) { }

    /**
     * Find license by company ID
     */
    async findByCompanyId(companyId: string): Promise<License | null> {
        return this.repository.findOne({
            where: { company_id: companyId, deleted_at: IsNull() },
            relations: ['license_features'],
        });
    }

    /**
     * Find active license by company ID
     */
    async findActiveByCompanyId(companyId: string): Promise<License | null> {
        return this.repository.findOne({
            where: {
                company_id: companyId,
                status: LicenseStatus.ACTIVE,
                deleted_at: IsNull(),
            },
            relations: ['license_features'],
        });
    }

    /**
     * Find all licenses by tier
     */
    async findByTier(tier: LicenseTier): Promise<License[]> {
        return this.repository.find({
            where: { tier, deleted_at: IsNull() },
            relations: ['license_features'],
        });
    }

    /**
     * Find expiring licenses
     */
    async findExpiring(daysUntilExpiry: number): Promise<License[]> {
        const now = new Date();
        const futureDate = new Date(now.getTime() + daysUntilExpiry * 24 * 60 * 60 * 1000);

        return this.repository
            .createQueryBuilder('l')
            .where('l.status = :status', { status: LicenseStatus.ACTIVE })
            .andWhere('l.expires_at <= :futureDate', { futureDate })
            .andWhere('l.expires_at > :now', { now })
            .andWhere('l.deleted_at IS NULL')
            .getMany();
    }

    /**
     * Create license
     */
    async create(licenseData: Partial<License>): Promise<License> {
        const license = this.repository.create(licenseData);
        return this.repository.save(license);
    }

    /**
     * Update license
     */
    async update(id: string, updates: Partial<License>): Promise<License> {
        await this.repository.update(id, updates);
        return this.repository.findOne({ where: { id } });
    }

    /**
     * Soft delete license
     */
    async softDelete(id: string): Promise<void> {
        await this.repository.softDelete(id);
    }

    /**
     * Check if company has license
     */
    async hasLicense(companyId: string): Promise<boolean> {
        const count = await this.repository.count({
            where: { company_id: companyId, deleted_at: IsNull() },
        });
        return count > 0;
    }
}
