/**
 * Rule-based job–candidate match (weights align with product spec).
 * Pure functions — easy to unit test and swap for ML later.
 */
const STOPWORDS = new Set(['and', 'or', 'the', 'with', 'for', 'to', 'of', 'in', 'a', 'an']);

export function tokenizeSkills(raw: string | undefined | null): Set<string> {
    const s = (raw || '')
        .toLowerCase()
        .replace(/[,;/|]+/g, ' ')
        .replace(/[^\w\s+#.-]/g, ' ')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 1 && !STOPWORDS.has(t));
    return new Set(s);
}

export function jobRequiredTokens(params: {
    requiredSkills?: string[] | null;
    requirements?: string | null;
}): Set<string> {
    const fromArr = Array.isArray(params.requiredSkills) ? params.requiredSkills : [];
    const joined = [fromArr.join(' '), params.requirements || ''].filter(Boolean).join(' ');
    return tokenizeSkills(joined);
}

export function jobKeywordTokens(params: {
    title?: string | null;
    description?: string | null;
    domainIndustry?: string | null;
    department?: string | null;
}): Set<string> {
    const blob = [params.title, params.description, params.domainIndustry, params.department].filter(Boolean).join(' ').toLowerCase();
    return tokenizeSkills(blob);
}

export function skillsMatchPercent(required: Set<string>, candidateSkillSet?: string | null): number {
    if (required.size === 0) return 55;
    const cand = tokenizeSkills(candidateSkillSet);
    if (cand.size === 0) return 15;
    let hit = 0;
    for (const t of required) {
        if (cand.has(t)) hit++;
        else {
            for (const c of cand) {
                if (c.includes(t) || t.includes(c)) {
                    hit++;
                    break;
                }
            }
        }
    }
    return Math.round((hit / required.size) * 100);
}

export function experienceMatchPercent(yearsRequired?: number | null, candidateYears?: number | null): number {
    const need = yearsRequired;
    const has = candidateYears;
    if (need == null || need <= 0) return 70;
    if (has == null || has < 0) return 35;
    if (has >= need) return 100;
    return Math.max(0, Math.round((has / need) * 100));
}

export function locationMatchPercent(jobLocationText: string, workLocations: string[] | null | undefined, candidateLocText: string): number {
    const pool = `${jobLocationText || ''} ${Array.isArray(workLocations) ? workLocations.join(' ') : workLocations || ''}`.toLowerCase().trim();
    if (!pool) return 60;
    const candLoc = (candidateLocText || '').toLowerCase();
    if (!candLoc.trim()) return 45;
    const jobTokens = tokenizeSkills(pool);
    const candTokens = tokenizeSkills(candLoc);
    let hit = 0;
    for (const t of jobTokens) {
        if (candTokens.has(t)) hit++;
    }
    if (hit > 0) return Math.min(100, 55 + hit * 15);
    return 30;
}

export function keywordMatchPercent(keys: Set<string>, candidateBlob: string): number {
    if (keys.size === 0) return 50;
    const candBlob = candidateBlob.toLowerCase();
    let hit = 0;
    for (const t of keys) {
        if (t.length < 3) continue;
        if (candBlob.includes(t)) hit++;
    }
    return Math.min(100, Math.round((hit / Math.max(1, keys.size)) * 100));
}

export interface MatchBreakdown {
    skills: number;
    experience: number;
    location: number;
    keywords: number;
    total: number;
}

export function computeMatchScore(input: {
    requiredSkillTokens: Set<string>;
    keywordTokens: Set<string>;
    yearsRequired?: number | null;
    candidateSkillSet?: string | null;
    candidateTotalExperience?: number | null;
    jobLocation?: string | null;
    workLocations?: string[] | null;
    candidateLocationText?: string | null;
    candidateName?: string | null;
    candidateCompany?: string | null;
}): MatchBreakdown {
    const sm = skillsMatchPercent(input.requiredSkillTokens, input.candidateSkillSet) / 100;
    const em = experienceMatchPercent(input.yearsRequired, input.candidateTotalExperience) / 100;
    const lm =
        locationMatchPercent(
            input.jobLocation || '',
            input.workLocations,
            `${input.candidateLocationText || ''}`,
        ) / 100;
    const candBlob = `${input.candidateName || ''} ${input.candidateSkillSet || ''} ${input.candidateCompany || ''}`;
    const km = keywordMatchPercent(input.keywordTokens, candBlob) / 100;
    const total = Math.round((sm * 0.5 + em * 0.2 + lm * 0.1 + km * 0.2) * 100);
    return {
        skills: Math.round(sm * 100),
        experience: Math.round(em * 100),
        location: Math.round(lm * 100),
        keywords: Math.round(km * 100),
        total,
    };
}

export function matchQualityLabel(score: number): string {
    if (score >= 85) return 'strong';
    if (score >= 65) return 'good';
    if (score >= 45) return 'fair';
    return 'weak';
}
