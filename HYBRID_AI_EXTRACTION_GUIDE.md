# Hybrid AI Job Extraction System

## Overview

The ATS now features a **three-tier hybrid AI extraction system** for intelligent job requirement parsing from emails and job descriptions:

1. **Regex-based Extraction** (baseline, always runs)
2. **Sambanova AI** (Meta-Llama-3.1-70B-Instruct) - Primary AI provider
3. **Google Gemini AI** (gemini-1.5-flash) - Fallback AI provider

## Architecture

```
JD Upload → Text Extraction → Three-Tier Parsing → Field Merging → Database Save
```

### Parsing Flow

```
1. Regex Parsing (email-parser.service.ts)
   ├─ Extract basic fields (ECMS, skills, locations, etc.)
   └─ Parse vendor rates, work modes, submission emails

2. Hybrid AI Parsing (hybrid-ai-parser.service.ts)
   ├─ Check Sambanova availability
   │  ├─ If available: Extract with Sambanova
   │  │  ├─ Confidence > 0.7: Use Sambanova result
   │  │  └─ Confidence ≤ 0.7: Try Gemini fallback
   │  └─ If unavailable: Try Gemini
   │
   └─ Check Gemini availability
      ├─ If available: Extract with Gemini
      └─ Return best result based on confidence score

3. Field Merging (jd-file.service.ts)
   ├─ Apply regex results first
   ├─ Apply AI results if confidence > 0.5
   └─ AI only fills empty fields (no overwrite)
```

## Services

### 1. AIJobParserService (Sambanova)
**File:** `src/modules/jobs/services/ai-job-parser.service.ts`

**Features:**
- Uses Sambanova Cloud API with Meta-Llama-3.1-70B-Instruct
- Structured JSON prompt engineering
- Temperature: 0.1 (deterministic)
- Max tokens: 2000
- Returns confidence score (0-1)

**Configuration:**
```env
SAMBANOVA_API_KEY=539e2ded-1e29-4113-80f6-d5229b9fccc0
SAMBANOVA_BASE_URL=https://api.sambanova.ai/v1
SAMBANOVA_MODEL=Meta-Llama-3.1-70B-Instruct
```

### 2. GeminiJobParserService (Google Gemini)
**File:** `src/modules/jobs/services/gemini-job-parser.service.ts`

**Features:**
- Uses Google Generative AI SDK
- Model: gemini-1.5-flash (fast, efficient)
- Structured JSON extraction
- Temperature: 0.1 (deterministic)
- Max output tokens: 2000
- Returns confidence score (0-1)

**Configuration:**
```env
GEMINI_API_KEY=AIzaSyBtbLbrcCVbR0AZWUV3G5fNXAj62U-UnPM
GEMINI_MODEL=gemini-1.5-flash
```

### 3. HybridAIParserService (Orchestrator)
**File:** `src/modules/jobs/services/hybrid-ai-parser.service.ts`

**Features:**
- Intelligent fallback logic
- Provider status monitoring
- Confidence-based selection
- Two extraction modes:
  - **Standard Mode:** Try providers sequentially, return best result
  - **Merge Mode:** Run both providers in parallel, merge results by field confidence

**Key Methods:**
- `extractJobDetails()`: Sequential extraction with smart fallback
- `extractAndMerge()`: Parallel extraction with field-level merging
- `getProvidersStatus()`: Check which AI providers are available
- `isAvailable()`: Check if any AI provider is ready

## Extracted Fields

The AI system extracts **25+ structured fields** from job emails:

| Field | Type | Example |
|-------|------|---------|
| `client_req_id` | string | "ECMS006792" |
| `title` | string | "Senior Python Developer" |
| `client_code` | string | "EAIS" |
| `domain_industry` | string | "Banking & Finance" |
| `pu_unit` | string | "Digital Banking" |
| `openings` | number | 2 |
| `required_skills` | string[] | ["Python", "Django", "REST API"] |
| `desired_skills` | string[] | ["AWS", "Kubernetes"] |
| `total_experience` | string | "5-8 years" |
| `relevant_experience` | string | "3+ years in Python" |
| `work_locations` | string[] | ["Bangalore", "Hyderabad"] |
| `work_mode` | string | "WFO" / "WFH" / "Hybrid" |
| `interview_mode` | string | "Virtual" / "In-person" |
| `background_check_timing` | string | "Before joining" / "After joining" |
| `vendor_rate_text` | string | "1200 INR per day" |
| `vendor_rate_value` | number | 1200 |
| `vendor_rate_currency` | string | "INR" / "USD" |
| `vendor_rate_unit` | string | "day" / "hour" / "month" |
| `submission_email` | string | "submissions@client.com" |
| `client_project_manager` | string | "John Doe" |
| `delivery_spoc` | string | "Jane Smith" |
| `confidence` | number | 0.85 (0-1 scale) |
| `provider` | string | "Sambanova" / "Gemini" / "merged" |

## Usage Example

### In JD Upload Flow

```typescript
// 1. Upload JD file
POST /api/jobs/:jobId/jd/upload

// 2. System automatically:
// a. Extracts text from file (PDF/DOCX/TXT)
const extractedText = await extractTextFromFile(file);

// b. Runs regex parsing first
const regexResult = emailParser.extractStructuredData(extractedText);

// c. Runs hybrid AI parsing
if (hybridAIParser.isAvailable()) {
    const aiResult = await hybridAIParser.extractJobDetails(extractedText);
    
    // d. Applies AI fields if confidence is good
    if (aiResult.confidence > 0.5) {
        console.log(`Using ${aiResult.provider} result with confidence ${aiResult.confidence}`);
        applyAIFields(job, aiResult);
    }
}

// e. Saves to database
await jobRepository.save(job);
```

### Provider Status Check

```typescript
const status = hybridAIParser.getProvidersStatus();
// Returns: { sambanova: true, gemini: true, anyAvailable: true }

console.log('Sambanova available:', status.sambanova);
console.log('Gemini available:', status.gemini);
```

## Fallback Logic

### Scenario 1: Sambanova Success (High Confidence)
```
Regex → Sambanova (confidence: 0.85) → ✅ Use Sambanova result
```

### Scenario 2: Sambanova Low Confidence → Gemini Fallback
```
Regex → Sambanova (confidence: 0.45) → Gemini (confidence: 0.78) → ✅ Use Gemini result
```

### Scenario 3: Sambanova Unavailable → Direct Gemini
```
Regex → Sambanova unavailable → Gemini (confidence: 0.82) → ✅ Use Gemini result
```

### Scenario 4: All AI Unavailable → Regex Only
```
Regex → Sambanova unavailable → Gemini unavailable → ✅ Use Regex result only
```

## Benefits

### 1. **Robustness**
- Multiple extraction methods ensure data is captured
- Graceful fallback prevents extraction failures
- Regex provides baseline even if all AI fails

### 2. **Accuracy**
- AI providers extract complex patterns regex misses
- Confidence scoring ensures quality results
- Field-level merging picks best extraction for each field

### 3. **Cost Efficiency**
- Uses free-tier APIs (Sambanova + Gemini)
- Only calls AI when available
- Falls back gracefully to avoid API costs

### 4. **Flexibility**
- Easy to add more AI providers
- Configurable confidence thresholds
- Can disable AI entirely via environment variables

## Monitoring & Debugging

### Console Logs

The system provides detailed logging:

```
Using Hybrid AI extraction for enhanced parsing...
AI Providers available: { sambanova: true, gemini: true, anyAvailable: true }
Attempting extraction with Sambanova AI...
Sambanova extraction: confidence 0.87
Using Sambanova result (high confidence)
AI extraction successful with Sambanova (confidence: 0.87)
```

### Low Confidence Warning

```
Attempting extraction with Sambanova AI...
Sambanova extraction: confidence 0.42
Attempting extraction with Gemini AI...
Gemini extraction: confidence 0.79
Using Gemini result with confidence 0.79
AI extraction successful with Gemini (confidence: 0.79)
```

### All AI Unavailable

```
No AI providers available, using only regex parsing
```

## Configuration

### Enable Both Providers (Recommended)

```env
# Sambanova (Primary)
SAMBANOVA_API_KEY=539e2ded-1e29-4113-80f6-d5229b9fccc0
SAMBANOVA_BASE_URL=https://api.sambanova.ai/v1
SAMBANOVA_MODEL=Meta-Llama-3.1-70B-Instruct

# Gemini (Fallback)
GEMINI_API_KEY=AIzaSyBtbLbrcCVbR0AZWUV3G5fNXAj62U-UnPM
GEMINI_MODEL=gemini-1.5-flash
```

### Disable AI (Regex Only)

```env
# Leave API keys empty or remove them
SAMBANOVA_API_KEY=
GEMINI_API_KEY=
```

### Use Only One Provider

```env
# Only Sambanova
SAMBANOVA_API_KEY=539e2ded-1e29-4113-80f6-d5229b9fccc0
GEMINI_API_KEY=

# Or only Gemini
SAMBANOVA_API_KEY=
GEMINI_API_KEY=AIzaSyBtbLbrcCVbR0AZWUV3G5fNXAj62U-UnPM
```

## Future Enhancements

### Potential Additions

1. **More AI Providers**
   - OpenAI GPT-4
   - Anthropic Claude
   - Cohere Command
   - AWS Bedrock

2. **Provider Priority Configuration**
   ```env
   AI_PROVIDER_PRIORITY=sambanova,gemini,openai
   ```

3. **Caching Layer**
   - Cache AI results by content hash
   - Reduce API calls for similar JDs

4. **Custom Confidence Thresholds**
   ```env
   AI_CONFIDENCE_THRESHOLD=0.6
   AI_HIGH_CONFIDENCE_THRESHOLD=0.8
   ```

5. **Field-Specific Provider Selection**
   - Use different providers for different fields
   - Example: Sambanova for skills, Gemini for rates

## Testing

### Manual Test

1. Upload a JD file through the UI
2. Check backend logs for AI extraction flow
3. Verify extracted fields in database
4. Inspect job details page for structured data

### API Test

```bash
# Upload JD file
curl -X POST http://localhost:3000/api/jobs/{jobId}/jd/upload \
  -H "Authorization: Bearer {token}" \
  -F "file=@job_description.pdf"

# Check job details
curl http://localhost:3000/api/jobs/{jobId} \
  -H "Authorization: Bearer {token}"
```

## Troubleshooting

### AI Extraction Not Working

1. **Check API keys in .env file**
   ```bash
   cat .env | grep -E "(SAMBANOVA|GEMINI)"
   ```

2. **Verify provider availability**
   - Check console logs for "AI Providers available" message
   - Should show `{ sambanova: true, gemini: true }`

3. **Check API rate limits**
   - Sambanova: Free tier limits
   - Gemini: Check Google AI Studio quota

### Low Confidence Scores

1. **Improve prompt engineering**
   - Edit prompt in `buildExtractionPrompt()` methods
   - Add more examples or clearer instructions

2. **Use merge mode**
   - Call `extractAndMerge()` instead of `extractJobDetails()`
   - Combines results from all providers

3. **Adjust confidence threshold**
   - Lower threshold in jd-file.service.ts
   - Current: `> 0.5`, can reduce to `> 0.3`

### API Errors

1. **Invalid API key**: Check key format in .env
2. **Rate limiting**: Add retry logic or wait
3. **Network issues**: Check internet connection

## Summary

The Hybrid AI Job Extraction System provides:

✅ **Three-tier extraction**: Regex → Sambanova → Gemini  
✅ **Intelligent fallback**: Automatic provider switching  
✅ **High accuracy**: AI extracts complex patterns  
✅ **Robustness**: Always has regex as baseline  
✅ **Cost-efficient**: Uses free-tier APIs  
✅ **Configurable**: Easy to enable/disable providers  
✅ **Extensible**: Easy to add more AI providers  

This system ensures maximum data extraction quality while maintaining reliability and cost efficiency.
