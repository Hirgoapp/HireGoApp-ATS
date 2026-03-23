import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../src/modules/email/email.service';
import { EmailTemplate } from '../../src/modules/email/interfaces/email.interface';

describe('EmailService', () => {
    let service: EmailService;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                EmailService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn(() => undefined),
                    },
                },
            ],
        }).compile();

        service = moduleRef.get(EmailService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should handle missing SMTP config gracefully', async () => {
        const result = await service.sendEmail({
            to: 'test@example.com',
            subject: 'Test',
            template: EmailTemplate.WELCOME,
            templateData: { name: 'John', companyName: 'ACME', loginUrl: 'http://example.com' },
        });

        expect(result).toBe(false);
    });
});
