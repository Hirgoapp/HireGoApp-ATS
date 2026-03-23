import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from '../../../candidate/entities/candidate.entity';
import { CaptureProfileDto } from './dto/capture-profile.dto';
import { ActivityService } from '../../../activity/services/activity.service';
import { AuditService } from '../../../common/services/audit.service';
import { FileService } from '../../../files/services/file.service';

@Injectable()
export class NaukriService {
    constructor(
        @InjectRepository(Candidate)
        private readonly candidateRepo: Repository<Candidate>,
        private readonly activityService: ActivityService,
        private readonly auditService: AuditService,
        private readonly fileService: FileService,
    ) {}

    private async findByNaukriProfileId(companyId: string, profileId: string) {
        return this.candidateRepo
            .createQueryBuilder('c')
            .where('c.company_id = :companyId', { companyId })
            .andWhere(`c.extra_fields->>'naukri_profile_id' = :profileId`, { profileId })
            .getOne();
    }

    private async findByEmail(companyId: string, email: string) {
        return this.candidateRepo.findOne({ where: { company_id: companyId, email } });
    }

    private async findByPhone(companyId: string, phone: string) {
        return this.candidateRepo.findOne({ where: { company_id: companyId, phone } });
    }

    async captureProfile(companyId: string, userId: string, payload: CaptureProfileDto) {
        const { naukri_profile_id, email, phone } = payload;

        let existing: Candidate | null = null;
        if (naukri_profile_id) {
            existing = await this.findByNaukriProfileId(companyId, naukri_profile_id);
        }
        if (!existing && email) {
            existing = await this.findByEmail(companyId, email);
        }
        if (!existing && phone) {
            existing = await this.findByPhone(companyId, phone);
        }

        const experienceYears = payload.experience ? Number(payload.experience) : null;
        const exp = Number.isNaN(experienceYears as number) ? null : experienceYears;

        if (existing) {
            const oldValues = { ...existing };
            const mergedExtra = {
                ...(existing.extra_fields || {}),
                ...(naukri_profile_id ? { naukri_profile_id } : {}),
            };

            existing.candidate_name = payload.candidate_name?.trim() || existing.candidate_name;
            existing.skill_set = payload.skills ?? existing.skill_set;
            if (exp != null) existing.total_experience = exp;
            if (payload.current_company != null) existing.current_company = payload.current_company;
            existing.extra_fields = mergedExtra;
            existing.updated_by = userId;

            const saved = await this.candidateRepo.save(existing);

            await this.activityService.logActivity(companyId, userId, {
                entityType: 'candidate',
                entityId: String(saved.id),
                activityType: 'candidate_imported_from_naukri',
                message: `Candidate imported from Naukri (updated): ${saved.candidate_name}`,
                metadata: { candidateId: saved.id, naukri_profile_id },
            });

            await this.auditService.log(companyId, userId, {
                entityType: 'candidate',
                entityId: String(saved.id),
                action: 'UPDATE',
                oldValues,
                newValues: saved,
            });

            return { ok: true, candidate_id: String(saved.id), updated: true };
        }

        const fullName = (payload.candidate_name || '').trim();
        const nameParts = fullName.split(/\s+/).filter(Boolean);
        const firstName = nameParts.length > 0 ? nameParts[0] : 'Naukri';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Candidate';
        const safeEmail = (email && email.trim()) || `${naukri_profile_id || 'unknown'}@naukri.local`;

        const created = this.candidateRepo.create({
            company_id: companyId,
            candidate_name: fullName || `${firstName} ${lastName}`,
            email: safeEmail,
            phone: phone?.trim() || '0000000000',
            current_company: payload.current_company || undefined,
            total_experience: exp ?? undefined,
            skill_set: payload.skills || undefined,
            candidate_status: 'Active',
            extra_fields: { ...(naukri_profile_id ? { naukri_profile_id } : {}), source: 'Naukri' },
            created_by: userId,
            updated_by: userId,
        });

        const saved = await this.candidateRepo.save(created);

        await this.activityService.logActivity(companyId, userId, {
            entityType: 'candidate',
            entityId: String(saved.id),
            activityType: 'candidate_imported_from_naukri',
            message: `Candidate imported from Naukri (created): ${saved.candidate_name}`,
            metadata: { candidateId: saved.id, naukri_profile_id },
        });

        await this.auditService.log(companyId, userId, {
            entityType: 'candidate',
            entityId: String(saved.id),
            action: 'CREATE',
            newValues: saved,
        });

        return { ok: true, candidate_id: String(saved.id), updated: false };
    }

    async uploadCv(
        companyId: string,
        userId: string,
        file: Express.Multer.File,
        body: { naukri_profile_id?: string; candidate_name?: string },
    ) {
        if (!file) {
            throw new NotFoundException('File is required');
        }

        const { naukri_profile_id } = body;

        if (!naukri_profile_id) {
            throw new NotFoundException('naukri_profile_id is required to link CV');
        }

        const candidate = await this.findByNaukriProfileId(companyId, naukri_profile_id);
        if (!candidate) {
            throw new NotFoundException('Candidate not found for provided Naukri profile');
        }

        const savedFile = await this.fileService.upload(companyId, userId, 'candidate', String(candidate.id), file);

        candidate.resume_source_type = 'Naukri';
        candidate.updated_by = userId;
        await this.candidateRepo.save(candidate);

        await this.activityService.logActivity(companyId, userId, {
            entityType: 'candidate',
            entityId: String(candidate.id),
            activityType: 'resume_uploaded',
            message: `Resume uploaded from Naukri: ${savedFile.file_name}`,
            metadata: {
                candidateId: candidate.id,
                fileId: savedFile.id,
                fileUrl: savedFile.file_url,
            },
        });

        await this.auditService.log(companyId, userId, {
            entityType: 'candidate',
            entityId: String(candidate.id),
            action: 'UPDATE',
            newValues: {
                resume_file_id: savedFile.id,
                resume_file_url: savedFile.file_url,
            },
        });

        return {
            filename: savedFile.file_name,
            path: savedFile.file_url,
            linked_candidate_id: String(candidate.id),
        };
    }
}
