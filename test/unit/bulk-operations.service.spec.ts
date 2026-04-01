import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BulkOperationsService } from '../../src/modules/applications/bulk-operations.service';
import { Application } from '../../src/modules/applications/entities/application.entity';
import { ApplicationWorkflowService } from '../../src/modules/applications/application-workflow.service';
import { PipelineStage } from '../../src/modules/pipelines/entities/pipeline-stage.entity';

describe('BulkOperationsService.bulkArchive', () => {
    let service: BulkOperationsService;
    let appRepo: jest.Mocked<Repository<Application>>;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                BulkOperationsService,
                {
                    provide: getRepositoryToken(Application),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        update: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(PipelineStage),
                    useValue: { findOne: jest.fn() },
                },
                {
                    provide: ApplicationWorkflowService,
                    useValue: { moveToStage: jest.fn() },
                },
            ],
        }).compile();

        service = moduleRef.get(BulkOperationsService);
        appRepo = moduleRef.get(getRepositoryToken(Application));
    });

    it('archives found applications with a single batch update', async () => {
        const ids = ['app-1', 'app-2'];
        appRepo.find.mockResolvedValue([{ id: 'app-1' }, { id: 'app-2' }] as any);
        appRepo.update.mockResolvedValue({ affected: 2 } as any);

        const result = await service.bulkArchive(ids, 'company-1');

        // Only 2 queries: find + update (not 2*N individual find+save calls)
        expect(appRepo.find).toHaveBeenCalledTimes(1);
        expect(appRepo.update).toHaveBeenCalledTimes(1);
        expect(appRepo.save).not.toHaveBeenCalled();
        expect(result.success).toBe(2);
        expect(result.failed).toBe(0);
    });

    it('reports not-found ids as failures without touching update', async () => {
        appRepo.find.mockResolvedValue([{ id: 'app-1' }] as any);
        appRepo.update.mockResolvedValue({ affected: 1 } as any);

        const result = await service.bulkArchive(['app-1', 'missing-id'], 'company-1');

        expect(result.success).toBe(1);
        expect(result.failed).toBe(1);
        expect(result.errors['missing-id']).toBeDefined();
    });

    it('returns all failed when no applications found', async () => {
        appRepo.find.mockResolvedValue([]);

        const result = await service.bulkArchive(['app-x'], 'company-1');

        expect(appRepo.update).not.toHaveBeenCalled();
        expect(result.success).toBe(0);
        expect(result.failed).toBe(1);
    });
});
