import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Application, ApplicationStatus } from '../applications/entities/application.entity';
import { Interview, InterviewStatus } from '../interviews/entities/interview.entity';

@Injectable()
export class ComplianceService {
    constructor(
        @InjectRepository(Application) private readonly appRepo: Repository<Application>,
        @InjectRepository(Interview) private readonly interviewRepo: Repository<Interview>,
    ) { }

    private daysFromNow(n: number) {
        const d = new Date();
        d.setDate(d.getDate() + n);
        return d;
    }

    async exportSnapshot(companyId: string) {
        const [totalApps, activeApps, hiredApps, rejectedApps] = await Promise.all([
            this.appRepo.count({ where: { company_id: companyId } as any }),
            this.appRepo.count({ where: { company_id: companyId, status: ApplicationStatus.ACTIVE } as any }),
            this.appRepo.count({ where: { company_id: companyId, status: ApplicationStatus.HIRED } as any }),
            this.appRepo.count({ where: { company_id: companyId, status: ApplicationStatus.REJECTED } as any }),
        ]);

        const now = new Date();
        const in30d = this.daysFromNow(30);

        const [totalInterviewsScheduled, upcoming30d] = await Promise.all([
            this.interviewRepo
                .createQueryBuilder('i')
                .leftJoin(Application, 'a', 'a.id = i.application_id')
                .where('a.company_id = :companyId', { companyId })
                .andWhere('i.status = :status', { status: InterviewStatus.SCHEDULED })
                .getCount(),
            this.interviewRepo
                .createQueryBuilder('i')
                .leftJoin(Application, 'a', 'a.id = i.application_id')
                .where('a.company_id = :companyId', { companyId })
                .andWhere('i.status = :status', { status: InterviewStatus.SCHEDULED })
                .andWhere('i.scheduled_at BETWEEN :now AND :in30d', { now, in30d })
                .getCount(),
        ]);

        return {
            companyId,
            generatedAt: new Date().toISOString(),
            applications: {
                total: totalApps,
                byStatus: {
                    active: activeApps,
                    hired: hiredApps,
                    rejected: rejectedApps,
                },
            },
            interviews: {
                scheduledTotal: totalInterviewsScheduled,
                upcoming30d,
            },
        };
    }
}
