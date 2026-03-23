# Phase 16: Vector Embeddings & Advanced Search - Implementation Guide

## Overview

Phase 16 implements semantic search and advanced analytics using vector embeddings, enabling intelligent candidate-to-job matching, skill-based searching, and market insights.

## Architecture

### Core Components

#### 1. **EmbeddingService** (`src/modules/search/services/embedding.service.ts`)
Handles all vector embedding operations with Pinecone integration.

**Key Methods:**
- `generateEmbedding(text)` - Generate OpenAI embeddings (1536 dimensions)
- `storeEmbedding(metadata)` - Store vectors in Pinecone with metadata
- `findSimilar(query, filters)` - Vector similarity search with filtering
- `clusterSkills(skills)` - Group similar skills by embeddings
- `findCandidatesForJob(jobDescription)` - Semantic job matching
- `cosineSimilarity(vec1, vec2)` - Vector math calculations
- `truncateText(text, maxTokens)` - Token-aware text trimming

**Configuration:**
```env
OPENAI_API_KEY=sk-...              # OpenAI API key
PINECONE_API_KEY=pc-...            # Pinecone API key
PINECONE_ENVIRONMENT=us-west-2     # Pinecone environment
PINECONE_INDEX_NAME=candidates     # Index name
EMBEDDING_MODEL=text-embedding-3-small  # OpenAI embedding model
```

#### 2. **SemanticSearchService** (`src/modules/search/services/semantic-search.service.ts`)
Combines semantic matching with AI-driven scoring for composite results.

**Key Methods:**
- `findBestCandidatesForJob(jobId)` - Hybrid matching (40% semantic + 60% AI)
- `findSimilarCandidates(candidateId)` - Resume similarity search
- `findCandidatesBySkills(skills)` - Multi-skill search with averaging

**Scoring Logic:**
```
Final Score = (0.4 × Semantic Score) + (0.6 × AI Score)
```

#### 3. **AnalyticsService** (`src/modules/search/services/analytics.service.ts`)
Provides market insights and recruitment analytics.

**Insight Types:**
- **skill_trend** - Most in-demand skills by time period
- **market_gap** - Skills with high demand but low supply
- **candidate_pool** - Pool composition by experience/skills
- **hiring_pattern** - Historical hiring metrics and trends

**Dashboard Integration:**
```typescript
GET /api/v1/search/semantic/analytics/dashboard - Returns all 4 insights aggregated
```

## API Endpoints

### Semantic Search
```
POST /api/v1/search/semantic/candidates
  - Body: { jobDescription: string }
  - Returns: SemanticSearchResult[]
  - Permission: candidates:read

POST /api/v1/search/semantic/candidates/similar
  - Body: { candidateId: string }
  - Returns: JobCandidateMatch[]
  - Permission: candidates:read

POST /api/v1/search/semantic/candidates/skills
  - Body: { skills: string[] }
  - Returns: JobCandidateMatch[]
  - Permission: candidates:read
```

### Embeddings
```
POST /api/v1/search/semantic/embeddings/generate
  - Body: { text: string }
  - Returns: { embedding: number[] }
  - Permission: candidates:read

POST /api/v1/search/semantic/embeddings/similarity
  - Body: { text1: string; text2: string }
  - Returns: { similarity: number }
  - Permission: candidates:read
```

### Analytics
```
GET /api/v1/search/semantic/analytics/trends
  - Query: { days?: number; limit?: number }
  - Returns: AnalyticsInsight[]
  - Permission: analytics:read

GET /api/v1/search/semantic/analytics/market-gaps
  - Query: { industryId?: string; limit?: number }
  - Returns: AnalyticsInsight[]
  - Permission: analytics:read

GET /api/v1/search/semantic/analytics/candidate-pool
  - Query: { companyId?: string }
  - Returns: AnalyticsInsight
  - Permission: analytics:read

GET /api/v1/search/semantic/analytics/hiring-patterns
  - Query: { months?: number; limit?: number }
  - Returns: AnalyticsInsight[]
  - Permission: analytics:read

GET /api/v1/search/semantic/analytics/dashboard
  - Returns: { trends: [], gaps: [], pool: {}, patterns: [] }
  - Permission: analytics:read

GET /api/v1/search/semantic/health
  - Returns: { status: string; pinecone: boolean; openai: boolean }
```

## Vector Storage (Pinecone)

### Index Structure
```
Index: candidates
Dimensions: 1536 (OpenAI text-embedding-3-small)
Metadata Fields:
  - candidateId: string
  - jobId: string (optional)
  - type: "resume" | "skill" | "profile"
  - companyId: string
  - createdAt: timestamp
  - skills: string[]
```

### Similarity Search
- Uses cosine similarity for vector comparison
- Supports metadata filtering (companyId, type, etc.)
- Top-K retrieval for result ranking

## Performance Characteristics

### Embedding Generation
- **Latency**: ~200-300ms per text
- **Cost**: $0.02 per 1M input tokens
- **Tokens Per Candidate Resume**: ~300-500 tokens

### Vector Search
- **Latency**: ~50-100ms per query
- **Throughput**: 1000+ queries/second
- **Cost**: $0.04 per 1M queries

### Analytics Computation
- **Cached Results**: 24-hour TTL
- **Refresh Window**: Off-peak hours
- **Data Retention**: 90 days

## Integration Points

### With AI Service (Phase 15)
- SemanticSearchService calls `AiService.matchCandidatesToJob()` for AI scoring
- Composite scoring: 40% semantic + 60% AI matching

### With Candidate Module
- Triggers embedding generation on candidate resume upload
- Updates vectors on profile changes
- Bulk embedding for CSV imports

### With Job Module
- Generates job embeddings on job creation
- Similarity search for recommendations

## Cost Estimation

### Monthly Costs (at 100K monthly searches)
```
OpenAI Embeddings:
  - 100K searches × 500 tokens = 50M tokens
  - 50M ÷ 1M × $0.02 = $1.00

Pinecone Storage:
  - 100K embeddings × 1536 dims × 0.0001 = ~$1.54/month

Pinecone Queries:
  - 100K queries × $0.04 ÷ 1M = $4.00

Total: ~$6.54/month (for 100K searches)
```

## Setup Instructions

### 1. Pinecone Setup
```bash
# Create index via Pinecone console
# Name: candidates
# Dimensions: 1536
# Metric: cosine
```

### 2. Environment Configuration
```bash
# .env
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=pc-...
PINECONE_ENVIRONMENT=us-west-2
PINECONE_INDEX_NAME=candidates
```

### 3. Dependencies
```bash
npm install @pinecone-database/pinecone js-tiktoken openai
```

### 4. Module Integration
- SearchModule automatically imported in AppModule
- EmbeddingService exported for use in other modules

## Data Flow

```
Candidate Resume Upload
    ↓
Generate Embedding (OpenAI)
    ↓
Store in Pinecone + Metadata
    ↓
Available for Search Queries

Job Search Request
    ↓
Generate Job Embedding
    ↓
Vector Similarity Search (Pinecone)
    ↓
AI Scoring (Phase 15)
    ↓
Composite Results (40% semantic + 60% AI)
```

## Error Handling

### Pinecone Connection Failures
- Graceful fallback to AI-only matching
- Automatic retry with exponential backoff
- Health check endpoint monitors availability

### Token Limit Handling
- Automatic text truncation via js-tiktoken
- Preserves semantic meaning through intelligent trimming

### Cost Control
- Token counting before API calls
- Rate limiting: 100 embeddings/minute
- Batch operations for efficiency

## Monitoring & Observability

### Health Check
```bash
GET /api/v1/search/semantic/health
```
Returns status of:
- Service availability
- Pinecone connection
- OpenAI API connectivity

### Metrics
- Embedding generation latency
- Search query response time
- Vector storage utilization
- API call costs

## Future Enhancements

1. **Custom Embeddings** - Fine-tuned models for recruitment domain
2. **Real-time Analytics** - Live dashboard updates
3. **Batch Processing** - Async embedding generation
4. **Model Evaluation** - A/B testing different embedding models
5. **Cost Optimization** - Caching and reuse strategies

## Troubleshooting

### "No exported member 'encoding_for_model'"
- Update js-tiktoken import: use `encodingForModel` (camelCase)

### Pinecone Connection Errors
- Verify API key and environment variables
- Check network connectivity
- Ensure index exists with correct dimensions

### Slow Search Performance
- Monitor query complexity
- Check vector database utilization
- Consider query filtering optimization

## References

- [Pinecone Documentation](https://docs.pinecone.io)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [js-tiktoken](https://github.com/js-tiktoken/js-tiktoken)
- [Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
