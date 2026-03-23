import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationService } from '../../src/modules/interviews/evaluation.service';
import { Evaluation, EvaluationStatus } from '../../src/modules/interviews/entities/evaluation.entity';
import { Application } from '../../src/modules/applications/entities/application.entity';
import { BadRequestException, NotFoundException, HttpException } from '@nestjs/common';

describe('EvaluationService', () => {
    let service: EvaluationService;
    let evaluationRepo: jest.Mocked<Repository<Evaluation>>;
    let applicationRepo: jest.Mocked<Repository<Application>>;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                EvaluationService,
                {
                    provide: getRepositoryToken(Evaluation), useValue: {
                        create: jest.fn(), save: jest.fn(), find: jest.fn(), findOne: jest.fn(),
                        createQueryBuilder: jest.fn(), remove: jest.fn(),
                    }
                },
                {
                    provide: getRepositoryToken(Application), useValue: {
                        findOne: jest.fn(),
                    }
                },
            ],
        }).compile();

        service = moduleRef.get(EvaluationService);
        evaluationRepo = moduleRef.get(getRepositoryToken(Evaluation));
        applicationRepo = moduleRef.get(getRepositoryToken(Application));
    });

    it('throws if application not found', async () => {
        applicationRepo.findOne.mockResolvedValue(null as any);
        try {
            await service.create({ application_id: 'app-1', evaluator_id: 'user-1', rating: 3 } as any, 'company-1');
            fail('should have thrown');
        } catch (err: any) {
            expect(typeof err.getStatus).toBe('function');
            expect(err.getStatus()).toBe(404);
        }
    });

    it('throws on invalid rating', async () => {
        applicationRepo.findOne.mockResolvedValue({ id: 'app-1' } as any);
        try {
            await service.create({ application_id: 'app-1', evaluator_id: 'user-1', rating: 6 } as any, 'company-1');
            fail('should have thrown');
        } catch (err: any) {
            expect(typeof err.getStatus).toBe('function');
            expect(err.getStatus()).toBe(400);
        }
    });

    it('creates evaluation with default status', async () => {
        applicationRepo.findOne.mockResolvedValue({ id: 'app-1' } as any);
        const created = { id: 'eval-1' } as any;
        evaluationRepo.create.mockReturnValue(created);
        evaluationRepo.save.mockResolvedValue({ ...created, status: EvaluationStatus.PENDING } as any);

        const result = await service.create({
            application_id: 'app-1', evaluator_id: 'user-1', rating: 4,
        } as any, 'company-1');

        expect(evaluationRepo.create).toHaveBeenCalledWith(expect.objectContaining({ rating: 4 }));
        expect(result).toMatchObject({ status: EvaluationStatus.PENDING });
    });
});
