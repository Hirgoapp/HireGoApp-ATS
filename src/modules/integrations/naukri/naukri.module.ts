import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from '../../../candidate/entities/candidate.entity';
import { FilesModule } from '../../../files/files.module';
import { ActivityModule } from '../../../activity/activity.module';
import { CommonModule } from '../../../common/common.module';
import { AuthModule } from '../../../auth/auth.module';
import { NaukriController } from './naukri.controller';
import { NaukriService } from './naukri.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Candidate]),
        FilesModule,
        ActivityModule,
        CommonModule,
        AuthModule,
    ],
    controllers: [NaukriController],
    providers: [NaukriService],
    exports: [NaukriService],
})
export class NaukriModule { }

