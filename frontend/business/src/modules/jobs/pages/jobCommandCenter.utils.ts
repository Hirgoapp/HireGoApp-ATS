import type { JobDetail } from '../services/jobs.api';
import type { Candidate } from '../../candidates/services/candidates.api';
import type { SubmissionListItem } from '../../submissions/services/submissions.api';

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

export function jobRequiredSkillTokens(job: JobDetail): Set<string> {
    const fromArr = Array.isArray(job.required_skills) ? job.required_skills : [];
    const joined = [fromArr.join(' '), job.requirements || '', (job as any).skills_required || '']
        .filter(Boolean)
        .join(' ');
    return tokenizeSkills(joined);
}

export function jobKeywordTokens(job: JobDetail): Set<string> {
    const blob = [job.title, job.job_title, job.description, job.domain_industry, job.department]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return tokenizeSkills(blob);
}

/** 0–100 overlap between candidate skills and job required skills */
export function skillsMatchPercent(job: JobDetail, candidate: Candidate): number {
    const req = jobRequiredSkillTokens(job);
    if (req.size === 0) return 55;
    const cand = tokenizeSkills(candidate.skill_set);
    if (cand.size === 0) return 15;
    let hit = 0;
    for (const t of req) {
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
    return Math.round((hit / req.size) * 100);
}

export function experienceMatchPercent(job: JobDetail, candidate: Candidate): number {
    const need = job.years_required;
    const has = candidate.total_experience;
    if (need == null || need <= 0) return 70;
    if (has == null || has < 0) return 35;
    if (has >= need) return 100;
    return Math.max(0, Math.round((has / need) * 100));
}

export function locationMatchPercent(job: JobDetail, candidate: Candidate): number {
    const jl = (job.location || '').toLowerCase();
    const wl = (
        Array.isArray(job.work_locations) ? job.work_locations.join(' ') : job.work_locations || ''
    ).toLowerCase();
    const pool = `${jl} ${wl}`.trim();
    if (!pool) return 60;
    const candLoc = `${candidate.job_location || ''} ${candidate.location_preference || ''}`.toLowerCase();
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

export function keywordMatchPercent(job: JobDetail, candidate: Candidate): number {
    const keys = jobKeywordTokens(job);
    if (keys.size === 0) return 50;
    const candBlob = `${candidate.candidate_name} ${candidate.skill_set} ${candidate.current_company || ''}`.toLowerCase();
    let hit = 0;
    for (const t of keys) {
        if (t.length < 3) continue;
        if (candBlob.includes(t)) hit++;
    }
    return Math.min(100, Math.round((hit / Math.max(1, keys.size)) * 100));
}

/**
 * Rule-based score (not ML): skills 50%, experience 20%, location 10%, keyword 20%
 */
export function computeMatchScore(job: JobDetail, candidate: Candidate): number {
    const sm = skillsMatchPercent(job, candidate) / 100;
    const em = experienceMatchPercent(job, candidate) / 100;
    const lm = locationMatchPercent(job, candidate) / 100;
    const km = keywordMatchPercent(job, candidate) / 100;
    const total = sm * 0.5 + em * 0.2 + lm * 0.1 + km * 0.2;
    return Math.round(total * 100);
}

export function matchLabel(score: number): string {
    if (score >= 85) return 'Strong';
    if (score >= 65) return 'Good';
    if (score >= 45) return 'Fair';
    return 'Weak';
}

const TERMINAL = new Set(['rejected', 'withdrawn', 'hired', 'joined', 'closed', 'declined']);

export function isTerminalSubmission(s: SubmissionListItem): boolean {
    const st = (s.status || '').toLowerCase();
    const oc = (s.outcome || '').toLowerCase();
    if (TERMINAL.has(st) || TERMINAL.has(oc)) return true;
    return st.includes('reject') || st.includes('hired') || st.includes('joined');
}

export function isHiredSubmission(s: SubmissionListItem): boolean {
    const st = (s.status || '').toLowerCase();
    const oc = (s.outcome || '').toLowerCase();
    return st.includes('hired') || st.includes('joined') || oc.includes('hired') || oc.includes('offer');
}

export function isInReviewSubmission(s: SubmissionListItem): boolean {
    if (isTerminalSubmission(s)) return false;
    const st = (s.status || '').toLowerCase();
    return (
        st.includes('review') ||
        st.includes('screen') ||
        st.includes('interview') ||
        st.includes('short') ||
        st.includes('submitted') ||
        st.includes('applied')
    );
}

export function aggregateSubmissionStatuses(subs: SubmissionListItem[]): { status: string; count: number }[] {
    const m = new Map<string, number>();
    for (const s of subs) {
        const k = (s.status || 'Unknown').trim() || 'Unknown';
        m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()]
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);
}

export function averageSubmissionScore(subs: SubmissionListItem[]): number | null {
    const scored = subs.map((s) => s.score).filter((x): x is number => x != null && !Number.isNaN(Number(x)));
    if (!scored.length) return null;
    const sum = scored.reduce((a, b) => a + Number(b), 0);
    return Math.round(sum / scored.length);
}

export function matchRateFromScores(subs: SubmissionListItem[]): number | null {
    const scored = subs.filter((s) => s.score != null && !Number.isNaN(Number(s.score)));
    if (!scored.length) return null;
    const strong = scored.filter((s) => Number(s.score) >= 65).length;
    return Math.round((strong / scored.length) * 100);
}

export function daysBetween(a: Date, b: Date): number {
    return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}
