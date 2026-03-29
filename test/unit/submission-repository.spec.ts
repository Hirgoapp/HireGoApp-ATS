import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubmissionRepository } from '../../src/modules/submissions/repositories/submission.repository';
import { Submission, SubmissionStatus } from '../../src/modules/submissions/entities/submission.entity';

describe('SubmissionRepository.getStatusCounts', () => {
    let submissionRepo: SubmissionRepository;
    let typeormRepo: jest.Mocked<Repository<Submission>>;

    const buildQbMock = (rawResult: any[]) => {
        const qb: any = {
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockResolvedValue(rawResult),
        };
        return qb;
    };

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                SubmissionRepository,
                {
                    provide: getRepositoryToken(Submission),
                    useValue: {
                        createQueryBuilder: jest.fn(),
                        count: jest.fn(),
                    },
                },
            ],
        }).compile();

        submissionRepo = moduleRef.get(SubmissionRepository);
        typeormRepo = moduleRef.get(getRepositoryToken(Submission));
    });

    it('returns zero counts for all statuses when no rows returned', async () => {
        const qb = buildQbMock([]);
        typeormRepo.createQueryBuilder.mockReturnValue(qb);

        const result = await submissionRepo.getStatusCounts('company-1');

        expect(typeormRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
        for (const status of Object.values(SubmissionStatus)) {
            expect(result[status]).toBe(0);
        }
    });

    it('returns correct counts from a single GROUP BY query', async () => {
        const qb = buildQbMock([
            { status: SubmissionStatus.APPLIED, count: '10' },
            { status: SubmissionStatus.INTERVIEW, count: '3' },
        ]);
        typeormRepo.createQueryBuilder.mockReturnValue(qb);

        const result = await submissionRepo.getStatusCounts('company-1');

        // Only one query should be issued (GROUP BY), not one per status
        expect(typeormRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
        expect(result[SubmissionStatus.APPLIED]).toBe(10);
        expect(result[SubmissionStatus.INTERVIEW]).toBe(3);
        expect(result[SubmissionStatus.OFFER]).toBe(0);
    });

    it('passes jobId filter when provided', async () => {
        const qb = buildQbMock([{ status: SubmissionStatus.HIRED, count: '2' }]);
        typeormRepo.createQueryBuilder.mockReturnValue(qb);

        await submissionRepo.getStatusCounts('company-1', 'job-42');

        expect(qb.andWhere).toHaveBeenCalledWith(
            expect.stringContaining('job_id'),
            expect.objectContaining({ jobId: 'job-42' }),
        );
    });
});
