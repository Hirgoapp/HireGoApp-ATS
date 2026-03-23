import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from '../ai/ai.module';
import { EmbeddingService } from './services/embedding.service';
import { SemanticSearchService } from './services/semantic-search.service';
import { AnalyticsService } from './services/analytics.service';
import { SearchController } from './controllers/search.controller';

@Module({
    imports: [ConfigModule, AiModule],
    providers: [EmbeddingService, SemanticSearchService, AnalyticsService],
    controllers: [SearchController],
    exports: [EmbeddingService, SemanticSearchService, AnalyticsService],
})
export class SearchModule { }
