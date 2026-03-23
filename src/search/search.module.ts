import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../modules/clients/entities/client.entity';
import { Job } from '../modules/jobs/entities/job.entity';
import { Candidate } from '../candidate/entities/candidate.entity';
import { Submission } from '../modules/submissions/entities/submission.entity';
import { SearchService } from './services/search.service';
import { SearchController } from './controllers/search.controller';
import { AuthModule } from '../auth/auth.module';

/**
 * Global search across clients, jobs, candidates, submissions.
 * Designed for future swap to PostgreSQL FTS, ElasticSearch, or Meilisearch.
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([Client, Job, Candidate, Submission]),
        AuthModule,
    ],
    controllers: [SearchController],
    providers: [SearchService],
    exports: [SearchService],
})
export class GlobalSearchModule {}
