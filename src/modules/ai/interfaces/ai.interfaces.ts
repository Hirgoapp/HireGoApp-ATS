export interface ParsedResume {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
    skills: string[];
    experience: ResumeExperience[];
    education: ResumeEducation[];
    certifications: string[];
    languages: string[];
    softSkills: string[];
    yearsOfExperience: number;
}

export interface ResumeExperience {
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    keyAchievements: string[];
}

export interface ResumeEducation {
    school: string;
    degree: string;
    field: string;
    graduationDate: string;
}

export interface ScreeningQuestion {
    question: string;
    category: 'technical' | 'behavioral' | 'experience' | 'culture_fit';
    difficulty: 'basic' | 'intermediate' | 'advanced';
    weight: number; // 1-10
}

export interface CandidateMatch {
    candidateId: string;
    score: number; // 0-100
    skillMatch: number;
    experienceMatch: number;
    cultureFitScore: number;
    missingSkills: string[];
    matchingSkills: string[];
    recommendation: 'strong_fit' | 'good_fit' | 'fair_fit' | 'poor_fit';
}

export interface InterviewTranscript {
    interviewId: string;
    candidateId: string;
    interviewerName: string;
    duration: number; // seconds
    audioUrl?: string;
    transcript: string;
    keyInsights: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    technicalScore?: number;
    communicationScore?: number;
    cultureFitScore?: number;
    overallImpression: string;
    recommendedNextSteps: string[];
}

export interface EmailTemplate {
    type: 'rejection' | 'interview_invitation' | 'offer' | 'follow_up';
    candidateName: string;
    position: string;
    content: string;
    personalizationNotes?: string;
}

export interface AiUsageStats {
    company_id: string;
    month: string; // YYYY-MM
    resumesParsed: number;
    matchingOperations: number;
    questionsGenerated: number;
    transcriptsAnalyzed: number;
    emailsGenerated: number;
    estimatedCost: number;
    tokensUsed: number;
}
