import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationWorkflowService } from '../../src/modules/applications/application-workflow.service';
import { Application, ApplicationStatus } from '../../src/modules/applications/entities/application.entity';
import { ApplicationTransition, TransitionReason } from '../../src/modules/applications/entities/application-transition.entity';
import { PipelineStage, StageType } from '../../src/modules/pipelines/entities/pipeline-stage.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ApplicationWorkflowService', () => {
    let service: ApplicationWorkflowService;
    let appRepo: jest.Mocked<Repository<Application>>;
    let transRepo: jest.Mocked<Repository<ApplicationTransition>>;
    let stageRepo: jest.Mocked<Repository<PipelineStage>>;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                ApplicationWorkflowService,
                {
                    provide: getRepositoryToken(Application),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                        createQueryBuilder: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(ApplicationTransition),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        find: jest.fn(),
                        createQueryBuilder: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(PipelineStage),
                    useValue: {
                        findOne: jest.fn(),
                        find: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = moduleRef.get(ApplicationWorkflowService);
        appRepo = moduleRef.get(getRepositoryToken(Application));
        transRepo = moduleRef.get(getRepositoryToken(ApplicationTransition));
        stageRepo = moduleRef.get(getRepositoryToken(PipelineStage));
    });

    it('throws if app not found', async () => {
        appRepo.findOne.mockResolvedValue(null as any);
        try {
            await service.moveToStage('missing', { to_stage_id: 's1' } as any, 'company-1', 'user-1');
            fail('should have thrown');
        } catch (err: any) {
            expect(typeof err.getStatus).toBe('function');
            expect(err.getStatus()).toBe(404);
        }
    });

    it('moves to HIRED stage updates application status', async () => {
        appRepo.findOne.mockResolvedValue({
            id: 'a1',
            current_stage_id: 's-offer',
            pipeline_id: 'p1',
            current_stage: { id: 's-offer', stage_type: StageType.OFFER },
        } as any);
        stageRepo.findOne.mockResolvedValue({ id: 's-hired', stage_type: StageType.HIRED } as any);
        stageRepo.find.mockResolvedValue([
            { id: 's-offer', stage_type: StageType.OFFER },
            { id: 's-hired', stage_type: StageType.HIRED },
        ] as any);
        transRepo.create.mockReturnValue({} as any);
        transRepo.save.mockResolvedValue({} as any);
        appRepo.save.mockResolvedValue({ id: 'a1', status: ApplicationStatus.HIRED } as any);

        const res = await service.moveToStage(
            'a1',
            { to_stage_id: 's-hired', reason: TransitionReason.HIRE } as any,
            'company-1',
            'user-1',
        );
        expect(appRepo.save).toHaveBeenCalled();
        expect(res.status).toBe(ApplicationStatus.HIRED);
    });
});
