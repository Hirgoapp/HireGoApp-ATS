import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from './entities/offer.entity';
import { OfferStatusHistory } from './entities/offer-status-history.entity';
import { Submission } from '../modules/submissions/entities/submission.entity';
import { OfferRepository } from './repositories/offer.repository';
import { OfferStatusHistoryRepository } from './repositories/offer-status-history.repository';
import { OfferService } from './services/offer.service';
import { OfferStatusService } from './services/offer-status.service';
import { OfferController } from './controllers/offer.controller';
import { SubmissionRepository } from '../modules/submissions/repositories/submission.repository';
import { AuthModule } from '../auth/auth.module';

/**
 * Module for Offer functionality (Phase 19)
 * Handles offer lifecycle management, versioning, status transitions, and audit logging
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([
            Offer,
            OfferStatusHistory,
            Submission,
        ]),
        AuthModule,
    ],
    providers: [
        OfferRepository,
        OfferStatusHistoryRepository,
        OfferService,
        OfferStatusService,
        SubmissionRepository,
    ],
    controllers: [OfferController],
    exports: [OfferService, OfferStatusService],
})
export class OffersModule { }
