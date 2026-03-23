import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { BetaUser } from './entities/beta-user.entity';
import { Feedback } from './entities/feedback.entity';

@Module({
    imports: [TypeOrmModule.forFeature([BetaUser, Feedback])],
    controllers: [FeedbackController],
    providers: [FeedbackService],
    exports: [FeedbackService],
})
export class FeedbackModule { }
