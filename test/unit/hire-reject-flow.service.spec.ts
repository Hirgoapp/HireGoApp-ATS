import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HireRejectFlowService } from '../../src/modules/applications/hire-reject-flow.service';
import { Application, ApplicationStatus } from '../../src/modules/applications/entities/application.entity';
import { RejectionReason } from '../../src/modules/applications/entities/rejection-reason.entity';
import { PipelineStage, StageType } from '../../src/modules/pipelines/entities/pipeline-stage.entity';
import { ApplicationWorkflowService } from '../../src/modules/applications/application-workflow.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('HireRejectFlowService', () => {
    let service: HireRejectFlowService;
    let appRepo: jest.Mocked<Repository<Application>>;
    let reasonRepo: jest.Mocked<Repository<RejectionReason>>;
    let stageRepo: jest.Mocked<Repository<PipelineStage>>;
    let workflowService: jest.Mocked<ApplicationWorkflowService>;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                HireRejectFlowService,
                {
                    provide: getRepositoryToken(Application), useValue: {
                        findOne: jest.fn(), save: jest.fn(),
                    }
                },
                {
                    provide: getRepositoryToken(RejectionReason), useValue: {
                        create: jest.fn(), save: jest.fn(),
                    }
                },
                {
                    provide: getRepositoryToken(PipelineStage), useValue: {
                        findOne: jest.fn(),
                    }
                },
                { provide: ApplicationWorkflowService, useValue: { moveToStage: jest.fn() } },
            ],
        }).compile();

        service = moduleRef.get(HireRejectFlowService);
        appRepo = moduleRef.get(getRepositoryToken(Application));
        reasonRepo = moduleRef.get(getRepositoryToken(RejectionReason));
        stageRepo = moduleRef.get(getRepositoryToken(PipelineStage));
        workflowService = moduleRef.get(ApplicationWorkflowService) as any;
    });

    it('rejects with reason', async () => {
        appRepo.findOne.mockResolvedValue({ id: 'a1', company_id: 'company-1', pipeline_id: 'p1', status: ApplicationStatus.ACTIVE } as any);
        stageRepo.findOne.mockResolvedValue({ id: 's-rej', stage_type: StageType.REJECTED } as any);
        reasonRepo.create.mockReturnValue({} as any);
        reasonRepo.save.mockResolvedValue({ id: 'r1' } as any);
        appRepo.save.mockResolvedValue({ id: 'a1', status: ApplicationStatus.REJECTED } as any);

        const res = await service.rejectApplication('a1', 'company-1', 'user-1', { reason_type: 'SKILL_GAP', reason_details: 'not fit' } as any);
        expect(res.status).toBe(ApplicationStatus.REJECTED);
    });

    it('throws when application already hired', async () => {
        appRepo.findOne.mockResolvedValue({ id: 'a1', company_id: 'company-1', pipeline_id: 'p1', status: ApplicationStatus.HIRED } as any);
        try {
            await service.hireApplication('a1', 'company-1', 'user-1', { notes: 'ok' } as any);
            fail('should have thrown');
        } catch (err: any) {
            expect(typeof err.getStatus).toBe('function');
            expect(err.getStatus()).toBe(400);
        }
    });
});
