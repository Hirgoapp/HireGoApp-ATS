import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from './entities/offer.entity';
import { OffersController } from './offers.controller';
import { OfferService } from './services/offer.service';
import { OfferRepository } from './repositories/offer.repository';
import { Submission } from '../submissions/entities/submission.entity';
import { SubmissionRepository } from '../submissions/repositories/submission.repository';
import { ActivityModule } from '../../activity/activity.module';
import { CommonModule } from '../../common/common.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Offer, Submission]),
        ActivityModule,
        CommonModule,
        AuthModule,
    ],
    controllers: [OffersController],
    providers: [OfferService, OfferRepository, SubmissionRepository],
    exports: [OfferService],
})
export class OffersModule { }

