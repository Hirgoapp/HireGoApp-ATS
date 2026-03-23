import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Source } from './entities/source.entity';
import { SourceService } from './source.service';
import { SourceController } from './source.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Source])],
    controllers: [SourceController],
    providers: [SourceService],
    exports: [SourceService],
})
export class SourceModule { }
