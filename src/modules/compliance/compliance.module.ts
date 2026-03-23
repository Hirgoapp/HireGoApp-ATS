import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { Application } from '../applications/entities/application.entity';
import { Interview } from '../interviews/entities/interview.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Application, Interview])],
    controllers: [ComplianceController],
    providers: [ComplianceService],
})
export class ComplianceModule { }
