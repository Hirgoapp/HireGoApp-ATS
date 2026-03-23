import {
    Injectable,
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In } from 'typeorm';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../auth/entities/user.entity';
import { SuperAdminUser } from '../entities/super-admin-user.entity';
import { SuperAdminInvite, SuperAdminInviteStatus } from '../entities/super-admin-invite.entity';
import { EmailService } from '../../modules/email/email.service';
import { EmailTemplate } from '../../modules/email/interfaces/email.interface';
import { AuditService } from '../../common/services/audit.service';
import { CreateSuperAdminInviteDto } from '../dto/create-super-admin-invite.dto';

function hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

function generateRawToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

export interface InvitePublicView {
    id: string;
    email: string;
    companyId: string | null;
    companyName: string | null;
    role: string;
    status: SuperAdminInviteStatus;
    expiresAt: string;
    invitedById: string | null;
    invitedByEmail: string | null;
    lastSentAt: string | null;
    resentCount: number;
    acceptedAt: string | null;
    revokedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

@Injectable()
export class SuperAdminInviteService {
    constructor(
        @InjectRepository(SuperAdminInvite)
        private readonly inviteRepository: Repository<SuperAdminInvite>,
        @InjectRepository(Company)
        private readonly companiesRepository: Repository<Company>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        @InjectRepository(SuperAdminUser)
        private readonly superAdminUsersRepository: Repository<SuperAdminUser>,
        private readonly emailService: EmailService,
        private readonly configService: ConfigService,
        private readonly auditService: AuditService,
    ) {}

    private normalizeEmail(email: string): string {
        return email.trim().toLowerCase();
    }

    private getAcceptBaseUrl(): string {
        return this.configService.get<string>('INVITATION_ACCEPT_BASE_URL', 'http://localhost:3001');
    }

    buildAcceptUrl(rawToken: string): string {
        const base = this.getAcceptBaseUrl().replace(/\/$/, '');
        return `${base}/invite/accept?token=${encodeURIComponent(rawToken)}`;
    }

    async countPendingValidInvites(): Promise<number> {
        return this.inviteRepository
            .createQueryBuilder('i')
            .where('i.status = :status', { status: SuperAdminInviteStatus.PENDING })
            .andWhere('i.expires_at > :now', { now: new Date() })
            .getCount();
    }

    private toPublicView(
        row: SuperAdminInvite,
        invitedByEmail: string | null,
    ): InvitePublicView {
        return {
            id: row.id,
            email: row.email,
            companyId: row.company_id,
            companyName: row.company_name,
            role: row.role,
            status: row.status,
            expiresAt: row.expires_at.toISOString(),
            invitedById: row.invited_by_id,
            invitedByEmail,
            lastSentAt: row.last_sent_at?.toISOString() ?? null,
            resentCount: row.resent_count,
            acceptedAt: row.accepted_at?.toISOString() ?? null,
            revokedAt: row.revoked_at?.toISOString() ?? null,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
        };
    }

    private async loadInviterEmails(ids: (string | null | undefined)[]): Promise<Map<string, string>> {
        const unique = [...new Set(ids.filter(Boolean) as string[])];
        if (unique.length === 0) return new Map();
        const users = await this.superAdminUsersRepository.find({ where: { id: In(unique) } });
        const m = new Map<string, string>();
        for (const u of users) {
            m.set(u.id, u.email);
        }
        return m;
    }

    async listInvites(
        page: number,
        limit: number,
        status?: SuperAdminInviteStatus,
        companyId?: string,
        search?: string,
    ): Promise<{ invites: InvitePublicView[]; pagination: { page: number; limit: number; total: number } }> {
        const qb = this.inviteRepository.createQueryBuilder('i').orderBy('i.created_at', 'DESC');

        if (status) {
            qb.andWhere('i.status = :status', { status });
        }

        if (companyId) {
            qb.andWhere('i.company_id = :companyId', { companyId });
        }

        if (search?.trim()) {
            const term = `%${search.trim()}%`;
            qb.andWhere(
                new Brackets((w) => {
                    w.where('i.email ILIKE :term', { term }).orWhere('i.company_name ILIKE :term', { term });
                }),
            );
        }

        const total = await qb.getCount();
        const rows = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        const inviterMap = await this.loadInviterEmails(rows.map((r) => r.invited_by_id));
        const invites = rows.map((r) => this.toPublicView(r, inviterMap.get(r.invited_by_id!) ?? null));

        return { invites, pagination: { page, limit, total } };
    }

    private async assertNoPendingDuplicate(email: string, companyId: string | null): Promise<void> {
        const qb = this.inviteRepository
            .createQueryBuilder('i')
            .where('i.email = :email', { email })
            .andWhere('i.status = :st', { st: SuperAdminInviteStatus.PENDING })
            .andWhere('i.expires_at > :now', { now: new Date() });

        if (companyId === null) {
            qb.andWhere('i.company_id IS NULL');
        } else {
            qb.andWhere('i.company_id = :cid', { cid: companyId });
        }

        const n = await qb.getCount();
        if (n > 0) {
            throw new ConflictException('A pending invite already exists for this email and scope');
        }
    }

    private async assertRecipientAvailable(
        email: string,
        role: string,
        companyId: string | null,
    ): Promise<void> {
        if (role === 'super_admin') {
            const sa = await this.superAdminUsersRepository.findOne({ where: { email } });
            if (sa) {
                throw new ConflictException('This email is already a super admin user');
            }
        } else {
            const existing = await this.usersRepository.findOne({ where: { email } });
            if (existing) {
                throw new ConflictException('This email is already registered as a platform user');
            }
        }
    }

    async createInvite(
        dto: CreateSuperAdminInviteDto,
        invitedById: string | undefined,
    ): Promise<{ invite: InvitePublicView; acceptUrl: string }> {
        const email = this.normalizeEmail(dto.email);
        const role = dto.role.trim();
        const companyId = dto.companyId ?? null;

        if (role !== 'super_admin' && !companyId) {
            throw new BadRequestException('companyId is required unless role is super_admin');
        }

        if (role === 'super_admin' && companyId) {
            throw new BadRequestException('companyId must be empty for super_admin invites');
        }

        let companyName: string | null = null;
        if (companyId) {
            const company = await this.companiesRepository.findOne({ where: { id: companyId } });
            if (!company) {
                throw new NotFoundException('Company not found');
            }
            companyName = company.name;
        }

        await this.assertNoPendingDuplicate(email, companyId);
        await this.assertRecipientAvailable(email, role, companyId);

        const raw = generateRawToken();
        const tokenHash = hashToken(raw);
        const days = dto.expiresInDays ?? 7;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        const row = this.inviteRepository.create({
            email,
            company_id: companyId,
            company_name: companyName,
            role,
            status: SuperAdminInviteStatus.PENDING,
            token_hash: tokenHash,
            expires_at: expiresAt,
            invited_by_id: invitedById ?? null,
            last_sent_at: new Date(),
            resent_count: 0,
            personal_message: dto.personalMessage?.trim() || null,
            metadata: {},
        });

        const saved = await this.inviteRepository.save(row);
        const acceptUrl = this.buildAcceptUrl(raw);

        await this.sendInviteEmail(saved, acceptUrl, invitedById);

        await this.auditService.log(null, invitedById ?? null, {
            action: 'SUPER_ADMIN_INVITE_CREATED',
            entityId: saved.id,
            entityType: 'SuperAdminInvite',
            newValues: { email, role, companyId },
        });

        const inviterMap = await this.loadInviterEmails([saved.invited_by_id]);
        return {
            invite: this.toPublicView(saved, inviterMap.get(saved.invited_by_id!) ?? null),
            acceptUrl,
        };
    }

    private async sendInviteEmail(invite: SuperAdminInvite, acceptUrl: string, invitedById?: string): Promise<void> {
        let inviterName = 'HireGoApp Super Admin';
        if (invitedById) {
            const u = await this.superAdminUsersRepository.findOne({ where: { id: invitedById } });
            if (u) {
                inviterName = `${u.first_name} ${u.last_name}`.trim() || u.email;
            }
        }

        const companyLabel = invite.company_name || 'HireGoApp';
        const subject =
            invite.role === 'super_admin'
                ? `Super admin invitation — HireGoApp`
                : `Invitation to join ${companyLabel} on HireGoApp`;

        try {
            await this.emailService.sendEmail({
                to: invite.email,
                subject,
                template: EmailTemplate.INVITATION,
                templateData: {
                    name: invite.email.split('@')[0],
                    companyName: companyLabel,
                    inviterName,
                    acceptUrl,
                },
            });
        } catch (err: any) {
            console.warn('Failed to send invite email', err?.message || err);
        }
    }

    async resendInvite(
        id: string,
        invitedById: string | undefined,
    ): Promise<{ invite: InvitePublicView; acceptUrl: string }> {
        const row = await this.inviteRepository.findOne({ where: { id } });
        if (!row) {
            throw new NotFoundException('Invite not found');
        }

        if (row.status !== SuperAdminInviteStatus.PENDING) {
            throw new BadRequestException('Only pending invites can be resent');
        }

        if (row.expires_at <= new Date()) {
            row.status = SuperAdminInviteStatus.EXPIRED;
            await this.inviteRepository.save(row);
            throw new BadRequestException('Invite has expired; create a new one');
        }

        const raw = generateRawToken();
        row.token_hash = hashToken(raw);
        row.last_sent_at = new Date();
        row.resent_count = (row.resent_count || 0) + 1;
        const saved = await this.inviteRepository.save(row);
        const acceptUrl = this.buildAcceptUrl(raw);

        await this.sendInviteEmail(saved, acceptUrl, invitedById);

        await this.auditService.log(null, invitedById ?? null, {
            action: 'SUPER_ADMIN_INVITE_RESENT',
            entityId: saved.id,
            entityType: 'SuperAdminInvite',
        });

        const inviterMap = await this.loadInviterEmails([saved.invited_by_id]);
        return {
            invite: this.toPublicView(saved, inviterMap.get(saved.invited_by_id!) ?? null),
            acceptUrl,
        };
    }

    async revokeInvite(id: string, revokedById: string | undefined): Promise<InvitePublicView> {
        const row = await this.inviteRepository.findOne({ where: { id } });
        if (!row) {
            throw new NotFoundException('Invite not found');
        }

        if (row.status !== SuperAdminInviteStatus.PENDING) {
            throw new BadRequestException('Only pending invites can be revoked');
        }

        row.status = SuperAdminInviteStatus.REVOKED;
        row.revoked_at = new Date();
        const saved = await this.inviteRepository.save(row);

        await this.auditService.log(null, revokedById ?? null, {
            action: 'SUPER_ADMIN_INVITE_REVOKED',
            entityId: saved.id,
            entityType: 'SuperAdminInvite',
        });

        const inviterMap = await this.loadInviterEmails([saved.invited_by_id]);
        return this.toPublicView(saved, inviterMap.get(saved.invited_by_id!) ?? null);
    }

    /**
     * Marks pending invites past expires_at as expired (housekeeping).
     */
    async expireStaleInvites(): Promise<number> {
        const res = await this.inviteRepository
            .createQueryBuilder()
            .update(SuperAdminInvite)
            .set({ status: SuperAdminInviteStatus.EXPIRED })
            .where('status = :p', { p: SuperAdminInviteStatus.PENDING })
            .andWhere('expires_at <= :now', { now: new Date() })
            .execute();
        return res.affected ?? 0;
    }
}
