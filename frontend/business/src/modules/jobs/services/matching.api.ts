import api from '../../../services/api';

export interface JobMatchSuggestion {
    candidate_id: string;
    candidate_name: string;
    email: string;
    total_score: number;
    skills_score: number;
    experience_score: number;
    location_score: number;
    keyword_score: number;
    quality: string;
    already_submitted: boolean;
}

export interface JobMatchSuggestionsResponse {
    job_id: string;
    suggestions: JobMatchSuggestion[];
}

export async function fetchJobMatchSuggestions(
    jobId: string,
    opts?: { limit?: number; minScore?: number; poolSize?: number; includeSubmitted?: boolean },
): Promise<JobMatchSuggestionsResponse> {
    const response = await api.get<JobMatchSuggestionsResponse>(`/matching/jobs/${jobId}/suggestions`, {
        params: {
            limit: opts?.limit,
            minScore: opts?.minScore,
            poolSize: opts?.poolSize,
            includeSubmitted: opts?.includeSubmitted === true ? 'true' : undefined,
        },
    });
    return response.data;
}
