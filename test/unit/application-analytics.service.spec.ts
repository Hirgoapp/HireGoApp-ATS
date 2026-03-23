import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationAnalyticsService } from '../../src/modules/applications/application-analytics.service';
import { Application } from '../../src/modules/applications/entities/application.entity';
import { ApplicationTransition } from '../../src/modules/applications/entities/application-transition.entity';
import { PipelineStage } from '../../src/modules/pipelines/entities/pipeline-stage.entity';

describe('ApplicationAnalyticsService', () => {
    let service: ApplicationAnalyticsService;
    let appRepo: jest.Mocked<Repository<Application>>;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                ApplicationAnalyticsService,
                {
                    provide: getRepositoryToken(Application), useValue: {
                        createQueryBuilder: jest.fn(),
                    }
                },
                {
                    provide: getRepositoryToken(ApplicationTransition), useValue: {
                        createQueryBuilder: jest.fn(),
                    }
                },
                {
                    provide: getRepositoryToken(PipelineStage), useValue: {
                        findOne: jest.fn(),
                    }
                },
            ],
        }).compile();

        service = moduleRef.get(ApplicationAnalyticsService);
        appRepo = moduleRef.get(getRepositoryToken(Application));
    });

    it('statusBreakdown returns grouped counts', async () => {
        const getManyMock = jest.fn().mockResolvedValue([
            { status: 'NEW', count: '5' },
            { status: 'REVIEW', count: '3' },
        ]);
        const qb: any = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            getRawMany: getManyMock,
        };
        appRepo.createQueryBuilder.mockReturnValue(qb);

        const res = await service.statusBreakdown('company-1');
        expect(appRepo.createQueryBuilder).toHaveBeenCalled();
        expect(res).toEqual([
            { status: 'NEW', count: '5' },
            { status: 'REVIEW', count: '3' },
        ]);
    });
});
