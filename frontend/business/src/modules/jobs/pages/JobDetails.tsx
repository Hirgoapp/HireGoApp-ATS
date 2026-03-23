import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getJobById, JobDetail } from '../services/jobs.api';
import { fetchJobMatchSuggestions, type JobMatchSuggestion } from '../services/matching.api';
import { useAuthStore } from '../../../stores/authStore';
import StatePanel from '../../../components/ui/StatePanel';
import { fetchSubmissions, SubmissionListItem } from '../../submissions/services/submissions.api';
import { fetchCandidates, getCandidate, Candidate } from '../../candidates/services/candidates.api';
import { getClient, Client } from '../../clients/services/clients.api';
import { getEntityActivities, Activity } from '../../../services/api/activity.api';
import { formatListDate } from '../../../components/ui/moduleDataList';
import {
    aggregateSubmissionStatuses,
    averageSubmissionScore,
    computeMatchScore,
    daysBetween,
    isHiredSubmission,
    isInReviewSubmission,
    isTerminalSubmission,
    matchLabel,
    matchRateFromScores,
    skillsMatchPercent,
} from './jobCommandCenter.utils';
import './JobDetails.css';

type CommandTab = 'overview' | 'candidates' | 'submissions' | 'client' | 'activity';
type CandidateView = 'pipeline' | 'suggested' | 'rejected' | 'hired';

const TABS: { id: CommandTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'candidates', label: 'Candidates' },
    { id: 'submissions', label: 'Submissions' },
    { id: 'client', label: 'Client' },
    { id: 'activity', label: 'Activity' },
];

async function batchLoadCandidates(ids: string[]): Promise<Record<string, Candidate>> {
    const unique = [...new Set(ids)].filter(Boolean);
    const out: Record<string, Candidate> = {};
    const chunk = 8;
    for (let i = 0; i < unique.length; i += chunk) {
        const part = unique.slice(i, i + chunk);
        await Promise.all(
            part.map(async (cid) => {
                try {
                    out[cid] = await getCandidate(cid);
                } catch {
                    /* ignore */
                }
            }),
        );
    }
    return out;
}

export default function JobDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const permissions = useAuthStore((s) => s.user?.permissions || []);

    const hasPermission = useCallback(
        (permission: string) => permissions.includes('*') || permissions.includes(permission),
        [permissions],
    );

    const canReadJob = hasPermission('jobs:view') || hasPermission('jobs:read');
    /** Server-side match suggestions require `jobs:view` (matches backend matching controller). */
    const canMatch = hasPermission('jobs:view');
    const canUpdateJob = hasPermission('jobs:update');
    const canReadSubmissions = hasPermission('submissions:read');
    const canCreateSubmission = hasPermission('submissions:create');
    const canReadCandidates = hasPermission('candidates:read');
    const canReadClients = hasPermission('clients:read') || hasPermission('clients:view');
    const canReadActivity = hasPermission('activity:view');

    const [job, setJob] = useState<JobDetail | null>(null);
    const [jobLoading, setJobLoading] = useState(true);
    const [jobError, setJobError] = useState<string | null>(null);

    const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
    const [submissionsTotal, setSubmissionsTotal] = useState(0);
    const [intelLoading, setIntelLoading] = useState(false);
    const [intelError, setIntelError] = useState<string | null>(null);

    const [candidatePool, setCandidatePool] = useState<Candidate[]>([]);
    const [candidateById, setCandidateById] = useState<Record<string, Candidate>>({});
    /** When set, suggested tab uses this list (same scoring as API). `null` = client-side pool scoring. */
    const [serverMatchBlock, setServerMatchBlock] = useState<{ list: JobMatchSuggestion[] } | null>(null);
    const [linkedClient, setLinkedClient] = useState<Client | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);

    const tabParam = (searchParams.get('tab') || 'overview') as CommandTab;
    const [tab, setTab] = useState<CommandTab>(TABS.some((t) => t.id === tabParam) ? tabParam : 'overview');

    const [candidateView, setCandidateView] = useState<CandidateView>('pipeline');
    const [minSuggestedMatch, setMinSuggestedMatch] = useState(40);

    useEffect(() => {
        const t = (searchParams.get('tab') || 'overview') as CommandTab;
        if (TABS.some((x) => x.id === t)) setTab(t);
    }, [searchParams]);

    const setTabInUrl = (next: CommandTab) => {
        setTab(next);
        const p = new URLSearchParams(searchParams);
        if (next === 'overview') p.delete('tab');
        else p.set('tab', next);
        setSearchParams(p, { replace: true });
    };

    useEffect(() => {
        if (!canReadJob) return;
        const loadJob = async () => {
            if (!id) {
                setJobError('Invalid job ID');
                setJobLoading(false);
                return;
            }
            try {
                setJobLoading(true);
                setJobError(null);
                const data = await getJobById(id);
                setJob(data);
            } catch (err: unknown) {
                setJobError((err as Error)?.message || 'Failed to load job details');
                setJob(null);
            } finally {
                setJobLoading(false);
            }
        };
        void loadJob();
    }, [id, canReadJob]);

    useEffect(() => {
        if (!id || !job) return;
        let cancelled = false;
        const run = async () => {
            setIntelLoading(true);
            setIntelError(null);
            setServerMatchBlock(null);
            try {
                const tasks: Promise<void>[] = [];

                if (canReadSubmissions) {
                    tasks.push(
                        (async () => {
                            const res = await fetchSubmissions({
                                job_id: id,
                                take: 500,
                                skip: 0,
                                include: 'candidate',
                            });
                            if (!cancelled) {
                                setSubmissions(res.data || []);
                                setSubmissionsTotal(res.total ?? res.data?.length ?? 0);
                                const fromEmbed: Record<string, Candidate> = {};
                                for (const row of res.data || []) {
                                    if (row.candidate) fromEmbed[row.candidate_id] = row.candidate;
                                }
                                if (Object.keys(fromEmbed).length) {
                                    setCandidateById((prev) => ({ ...prev, ...fromEmbed }));
                                }
                            }
                        })(),
                    );
                } else if (!cancelled) {
                    setSubmissions([]);
                    setSubmissionsTotal(0);
                }

                if (canReadCandidates) {
                    tasks.push(
                        (async () => {
                            const res = await fetchCandidates({ page: 1, limit: 200 });
                            if (!cancelled) setCandidatePool(res.data || []);
                        })(),
                    );
                } else if (!cancelled) {
                    setCandidatePool([]);
                }

                if (canReadClients && job.client_id) {
                    tasks.push(
                        (async () => {
                            try {
                                const c = await getClient(job.client_id!);
                                if (!cancelled) setLinkedClient(c);
                            } catch {
                                if (!cancelled) setLinkedClient(null);
                            }
                        })(),
                    );
                } else if (!cancelled) {
                    setLinkedClient(null);
                }

                if (canReadActivity) {
                    tasks.push(
                        (async () => {
                            try {
                                const res = await getEntityActivities('job', id);
                                const rows = (res as { data?: Activity[] }).data ?? (res as unknown as Activity[]);
                                if (!cancelled) setActivities(Array.isArray(rows) ? rows : []);
                            } catch {
                                if (!cancelled) setActivities([]);
                            }
                        })(),
                    );
                } else if (!cancelled) {
                    setActivities([]);
                }

                if (canMatch && id) {
                    tasks.push(
                        (async () => {
                            try {
                                const res = await fetchJobMatchSuggestions(id, {
                                    limit: 100,
                                    poolSize: 250,
                                    minScore: 0,
                                });
                                if (!cancelled) {
                                    setServerMatchBlock({ list: res.suggestions || [] });
                                }
                            } catch {
                                if (!cancelled) setServerMatchBlock(null);
                            }
                        })(),
                    );
                }

                await Promise.all(tasks);
            } catch (e: unknown) {
                if (!cancelled) setIntelError((e as Error)?.message || 'Could not load hiring intelligence');
            } finally {
                if (!cancelled) setIntelLoading(false);
            }
        };
        void run();
        return () => {
            cancelled = true;
        };
    }, [id, job, canReadSubmissions, canReadCandidates, canReadClients, canReadActivity, canMatch]);

    const submissionCandidateKey = useMemo(() => submissions.map((s) => s.candidate_id).join('|'), [submissions]);

    useEffect(() => {
        if (!canReadCandidates || !submissionCandidateKey) return;
        const ids = [...new Set(submissions.map((s) => s.candidate_id))];
        let cancelled = false;
        void (async () => {
            const loaded = await batchLoadCandidates(ids);
            if (!cancelled) {
                setCandidateById((prev) => ({ ...prev, ...loaded }));
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [submissionCandidateKey, canReadCandidates, submissions]);

    useEffect(() => {
        if (!serverMatchBlock?.list.length || !canReadCandidates) return;
        const ids = serverMatchBlock.list.map((s) => s.candidate_id);
        let cancelled = false;
        void (async () => {
            const loaded = await batchLoadCandidates(ids);
            if (!cancelled) setCandidateById((prev) => ({ ...prev, ...loaded }));
        })();
        return () => {
            cancelled = true;
        };
    }, [serverMatchBlock, canReadCandidates]);

    const submittedIds = useMemo(() => new Set(submissions.map((s) => s.candidate_id)), [submissions]);

    const suggestedRoster = useMemo(() => {
        if (!job) return [];

        if (serverMatchBlock) {
            const resolveCandidate = (s: JobMatchSuggestion): Candidate => {
                const fromPool = candidatePool.find((c) => c.id === s.candidate_id);
                const fromMap = candidateById[s.candidate_id];
                if (fromPool) return fromPool;
                if (fromMap) return fromMap;
                return {
                    id: s.candidate_id,
                    company_id: job.company_id,
                    candidate_name: s.candidate_name,
                    email: s.email,
                    phone: '—',
                    skill_set: undefined,
                    total_experience: undefined,
                    created_at: new Date(0).toISOString(),
                    updated_at: new Date(0).toISOString(),
                };
            };

            return serverMatchBlock.list
                .filter((s) => !s.already_submitted)
                .map((s) => ({
                    candidate: resolveCandidate(s),
                    score: s.total_score,
                    skillsLabel: matchLabel(s.total_score),
                }));
        }

        return candidatePool
            .filter((c) => !submittedIds.has(c.id))
            .map((c) => ({
                candidate: c,
                score: computeMatchScore(job, c),
                skillsLabel: matchLabel(skillsMatchPercent(job, c)),
            }))
            .sort((a, b) => b.score - a.score);
    }, [job, candidatePool, submittedIds, serverMatchBlock, candidateById]);

    const insights = useMemo(() => {
        const apps = submissionsTotal;
        const inPipe = submissions.filter((s) => !isTerminalSubmission(s)).length;
        const inReview = submissions.filter((s) => isInReviewSubmission(s)).length;
        const hired = submissions.filter((s) => isHiredSubmission(s)).length;
        const avg = averageSubmissionScore(submissions);
        const rate = matchRateFromScores(submissions);
        const published = job?.published_at ? new Date(job.published_at) : null;
        const openDays = published ? daysBetween(published, new Date()) : null;
        const strongSuggestions = suggestedRoster.filter((r) => r.score >= 75).length;

        return {
            applications: apps,
            inPipeline: inPipe,
            inReview,
            hired,
            avgScore: avg,
            matchRate: rate,
            openDays,
            strongSuggestions,
        };
    }, [submissions, submissionsTotal, job?.published_at, suggestedRoster]);

    const alerts = useMemo(() => {
        const list: { tone: 'warn' | 'info'; text: string }[] = [];
        if (!job) return list;
        const published = job.published_at ? new Date(job.published_at) : null;
        if (published && submissionsTotal === 0 && daysBetween(published, new Date()) >= 3) {
            list.push({
                tone: 'warn',
                text: 'No applications yet — consider sharing the job link or adding candidates from the pool.',
            });
        }
        const avg = averageSubmissionScore(submissions);
        if (avg != null && avg < 50 && submissions.length >= 3) {
            list.push({
                tone: 'info',
                text: 'Average submission score is low — review job requirements vs. who is being submitted.',
            });
        }
        if (insights.matchRate != null && insights.matchRate < 40 && submissions.filter((s) => s.score != null).length >= 4) {
            list.push({ tone: 'info', text: 'Match rate (score ≥ 65) is below 40% for scored submissions.' });
        }
        return list;
    }, [job, submissions, submissionsTotal, insights.matchRate]);

    const statusPillClass = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'open') return 'job-cc__status-pill job-cc__status-pill--open';
        if (s === 'closed') return 'job-cc__status-pill job-cc__status-pill--closed';
        if (s === 'draft') return 'job-cc__status-pill job-cc__status-pill--draft';
        if (s === 'archived') return 'job-cc__status-pill job-cc__status-pill--archived';
        return 'job-cc__status-pill job-cc__status-pill--draft';
    };

    const copyJobLink = () => {
        const url = `${window.location.origin}/app/jobs/${id}`;
        void navigator.clipboard.writeText(url).then(undefined, () => undefined);
    };

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return '—';
        try {
            return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return dateString;
        }
    };

    const displayValue = (value: unknown) => {
        if (value === null || value === undefined || value === '') return '—';
        return value as React.ReactNode;
    };

    if (!canReadJob) {
        return (
            <StatePanel
                title="Access Denied"
                message="You do not have permission to view job details."
                tone="danger"
                action={
                    <button onClick={() => navigate('/app/jobs')} className="ghost-button" type="button">
                        Back to Jobs
                    </button>
                }
            />
        );
    }

    if (jobLoading) {
        return <StatePanel title="Loading job" message="Preparing hiring command center…" />;
    }

    if (jobError) {
        return (
            <StatePanel
                title="Unable to load job"
                message={jobError}
                tone="danger"
                action={
                    <button onClick={() => navigate('/app/jobs')} className="ghost-button" type="button">
                        Back to Jobs
                    </button>
                }
            />
        );
    }

    if (!job || !id) {
        return <StatePanel title="Job not found" message="This job does not exist or is no longer available." />;
    }

    const displayStatus = (job.requirement_status || job.status || 'open') as string;
    const funnel = aggregateSubmissionStatuses(submissions);

    const pipelineRows = submissions.filter((s) => !isTerminalSubmission(s));
    const rejectedRows = submissions.filter((s) => {
        const st = (s.status || '').toLowerCase();
        return st.includes('reject') || (s.outcome || '').toLowerCase().includes('reject');
    });
    const hiredRows = submissions.filter((s) => isHiredSubmission(s));

    const rowsForTable =
        candidateView === 'rejected'
            ? rejectedRows
            : candidateView === 'hired'
              ? hiredRows
              : candidateView === 'suggested'
                ? []
                : pipelineRows;

    return (
        <div className="page-stack job-cc">
            <div className="job-cc__sticky">
                <div className="job-cc__title-row">
                    <div className="job-cc__title-block">
                        <h1 className="job-cc__title">{job.title || job.job_title || 'Job'}</h1>
                        <p className="job-cc__subtitle">
                            {job.client_req_id ? `Req ID ${job.client_req_id}` : 'Hiring command center'} ·{' '}
                            {job.job_code ? `Code ${job.job_code}` : 'Job profile'}
                        </p>
                        <div className={statusPillClass(displayStatus)}>{displayStatus}</div>
                    </div>
                    <div className="job-cc__actions">
                        <button type="button" className="ghost-button" onClick={() => navigate('/app/jobs')}>
                            Back to jobs
                        </button>
                        {canReadCandidates ? (
                            <button type="button" className="ghost-button" onClick={() => navigate('/app/candidates')}>
                                View candidates
                            </button>
                        ) : null}
                        {canCreateSubmission ? (
                            <button
                                type="button"
                                className="primary-button"
                                onClick={() => navigate(`/app/jobs/${id}/submissions/create`)}
                            >
                                Add candidate
                            </button>
                        ) : null}
                        {canUpdateJob ? (
                            <button type="button" className="primary-button" onClick={() => navigate(`/app/jobs/${id}/edit`)}>
                                Edit job
                            </button>
                        ) : null}
                        <button type="button" className="ghost-button" onClick={copyJobLink}>
                            Share link
                        </button>
                        {canReadSubmissions ? (
                            <button type="button" className="ghost-button" onClick={() => navigate(`/app/jobs/${id}/submissions`)}>
                                Full submissions
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="job-cc__insights">
                    <div className="job-cc__insight">
                        <div className="job-cc__insight-value">{intelLoading ? '…' : insights.applications}</div>
                        <div className="job-cc__insight-label">Applications</div>
                    </div>
                    <div className="job-cc__insight">
                        <div className="job-cc__insight-value">{intelLoading ? '…' : insights.inReview}</div>
                        <div className="job-cc__insight-label">In review</div>
                    </div>
                    <div className="job-cc__insight">
                        <div className="job-cc__insight-value">{intelLoading ? '…' : insights.strongSuggestions}</div>
                        <div className="job-cc__insight-label">Strong matches (pool)</div>
                    </div>
                    <div className="job-cc__insight">
                        <div className="job-cc__insight-value">
                            {intelLoading ? '…' : insights.avgScore != null ? `${insights.avgScore}%` : '—'}
                        </div>
                        <div className="job-cc__insight-label">Avg submission score</div>
                    </div>
                    <div className="job-cc__insight">
                        <div className="job-cc__insight-value">
                            {intelLoading
                                ? '…'
                                : insights.matchRate != null
                                  ? `${insights.matchRate}%`
                                  : insights.openDays != null
                                    ? `${insights.openDays}d`
                                    : '—'}
                        </div>
                        <div className="job-cc__insight-label">
                            {insights.matchRate != null ? 'Match rate (scored)' : 'Days open'}
                        </div>
                    </div>
                </div>

                {intelError ? (
                    <div className="job-cc__alert job-cc__alert--info" style={{ marginTop: 10 }}>
                        {intelError}
                    </div>
                ) : null}

                {alerts.map((a, i) => (
                    <div key={i} className={a.tone === 'warn' ? 'job-cc__alert' : 'job-cc__alert job-cc__alert--info'}>
                        {a.text}
                    </div>
                ))}

                <div className="job-cc__tabs" role="tablist" aria-label="Job sections">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            role="tab"
                            aria-selected={tab === t.id}
                            className={`job-cc__tab${tab === t.id ? ' job-cc__tab--active' : ''}`}
                            onClick={() => setTabInUrl(t.id)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="job-cc__panel">
                {tab === 'overview' ? <OverviewTab job={job} formatDate={formatDate} displayValue={displayValue} /> : null}

                {tab === 'candidates' && canReadCandidates ? (
                    <CandidatesTab
                        job={job}
                        jobId={id}
                        candidateView={candidateView}
                        setCandidateView={setCandidateView}
                        minSuggestedMatch={minSuggestedMatch}
                        setMinSuggestedMatch={setMinSuggestedMatch}
                        rowsForTable={rowsForTable}
                        suggestedRoster={suggestedRoster}
                        candidateById={candidateById}
                        navigate={navigate}
                    />
                ) : null}

                {tab === 'candidates' && !canReadCandidates ? (
                    <div className="job-cc__empty">You do not have permission to browse candidates.</div>
                ) : null}

                {tab === 'submissions' && canReadSubmissions ? (
                    <SubmissionsTab
                        submissions={submissions}
                        funnel={funnel}
                        candidateById={candidateById}
                        jobId={id}
                        navigate={navigate}
                    />
                ) : null}

                {tab === 'submissions' && !canReadSubmissions ? (
                    <div className="job-cc__empty">You do not have permission to view submissions.</div>
                ) : null}

                {tab === 'client' ? (
                    <ClientTab job={job} client={linkedClient} canReadClients={canReadClients} navigate={navigate} />
                ) : null}

                {tab === 'activity' && canReadActivity ? <ActivityTab activities={activities} loading={intelLoading} /> : null}
                {tab === 'activity' && !canReadActivity ? (
                    <div className="job-cc__empty">You do not have permission to view the activity timeline.</div>
                ) : null}
            </div>
        </div>
    );
}

function OverviewTab({
    job,
    formatDate,
    displayValue,
}: {
    job: JobDetail;
    formatDate: (s?: string | null) => string;
    displayValue: (v: unknown) => React.ReactNode;
}) {
    return (
        <>
            {(job.description || job.jd_content) && (
                <section className="job-cc__section">
                    <div className="job-cc__section-head">
                        <h2 className="job-cc__section-title">Description</h2>
                    </div>
                    <div className="job-cc__section-body">
                        {Array.isArray(job.jd_sections) && job.jd_sections.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {job.jd_sections.map((s, idx) => (
                                    <div key={idx}>
                                        <div style={{ fontWeight: 700, marginBottom: 8, color: '#334155' }}>{s.heading}</div>
                                        <div style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                                            {s.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                                {job.jd_content || job.description}
                            </div>
                        )}
                        {job.requirements && (
                            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                                <div className="job-cc__field-label">Requirements</div>
                                <div className="job-cc__field-value" style={{ fontWeight: 500 }}>
                                    {job.requirements}
                                </div>
                            </div>
                        )}
                        {job.jd_file_url && (
                            <div style={{ marginTop: '1rem' }}>
                                <a
                                    className="job-cc__link"
                                    href={`${window.location.protocol}//${window.location.hostname}:3001${job.jd_file_url}`}
                                    download
                                >
                                    Download original JD file
                                </a>
                            </div>
                        )}
                    </div>
                </section>
            )}

            <section className="job-cc__section">
                <div className="job-cc__section-head">
                    <h2 className="job-cc__section-title">Position & client fields</h2>
                </div>
                <div className="job-cc__section-body">
                    <div className="job-cc__grid">
                        <Field label="Client Req ID (ECMS)" value={job.client_req_id} />
                        <Field label="Client code" value={job.client_code} />
                        <Field label="Domain / industry" value={job.domain_industry} />
                        <Field label="Business unit (PU)" value={job.pu_unit} />
                        <Field label="Openings" value={job.openings} highlight />
                        <Field label="Job code" value={job.job_code} />
                        <Field label="Version" value={job.version} />
                        <Field label="Latest version" value={job.is_latest_version ? 'Yes' : 'No'} />
                    </div>
                </div>
            </section>

            <section className="job-cc__section">
                <div className="job-cc__section-head">
                    <h2 className="job-cc__section-title">Skills & experience</h2>
                </div>
                <div className="job-cc__section-body">
                    <div className="job-cc__grid">
                        <Field
                            label="Mandatory skills"
                            value={Array.isArray(job.required_skills) ? job.required_skills.join(', ') : job.required_skills}
                            wide
                        />
                        <Field
                            label="Desired skills"
                            value={Array.isArray(job.desired_skills) ? job.desired_skills.join(', ') : job.desired_skills}
                            wide
                        />
                        <Field label="Years required" value={job.years_required != null ? `${job.years_required} yrs` : undefined} />
                        <Field label="Relevant experience" value={job.relevant_experience} />
                    </div>
                </div>
            </section>

            <section className="job-cc__section">
                <div className="job-cc__section-head">
                    <h2 className="job-cc__section-title">Work & employment</h2>
                </div>
                <div className="job-cc__section-body">
                    <div className="job-cc__grid">
                        <Field
                            label="Work locations"
                            value={Array.isArray(job.work_locations) ? job.work_locations.join(' · ') : job.work_locations || job.location}
                            wide
                        />
                        <Field label="Work mode" value={job.work_mode} />
                        <Field label="Interview mode" value={job.interview_mode} />
                        <Field label="Background check" value={job.background_check_timing} />
                        <Field label="Remote" value={job.is_remote ? 'Yes' : 'No'} />
                        <Field label="Employment type" value={job.employment_type} />
                    </div>
                </div>
            </section>

            <section className="job-cc__section">
                <div className="job-cc__section-head">
                    <h2 className="job-cc__section-title">Compensation & vendor</h2>
                </div>
                <div className="job-cc__section-body">
                    <div className="job-cc__grid">
                        <Field label="Vendor rate (text)" value={job.vendor_rate_text} wide />
                        <Field label="Vendor rate value" value={job.vendor_rate_value} highlight />
                        <Field label="Vendor currency" value={job.vendor_rate_currency || 'INR'} />
                        <Field label="Vendor unit" value={job.vendor_rate_unit} />
                        <Field label="Salary min" value={job.salary_min} />
                        <Field label="Salary max" value={job.salary_max} />
                        <Field label="Salary currency" value={job.salary_currency || job.currency || 'USD'} />
                    </div>
                </div>
            </section>

            <section className="job-cc__section">
                <div className="job-cc__section-head">
                    <h2 className="job-cc__section-title">Posting & contacts</h2>
                </div>
                <div className="job-cc__section-body">
                    <div className="job-cc__grid">
                        <Field label="Project manager" value={job.client_project_manager} wide />
                        <Field label="Delivery SPOC" value={job.delivery_spoc} wide />
                        <Field
                            label="Hiring manager"
                            value={
                                job.hiring_manager
                                    ? `${job.hiring_manager.first_name} ${job.hiring_manager.last_name}`
                                    : undefined
                            }
                        />
                        <Field
                            label="Created by"
                            value={job.created_by ? `${job.created_by.first_name} ${job.created_by.last_name}` : undefined}
                        />
                    </div>
                </div>
            </section>

            <section className="job-cc__section">
                <div className="job-cc__section-head">
                    <h2 className="job-cc__section-title">Submission guidelines</h2>
                </div>
                <div className="job-cc__section-body">
                    <Field label="Submission email" value={job.submission_email} wide />
                    {job.submission_guidelines && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                            <div className="job-cc__field-label">Guidelines</div>
                            <div style={{ fontSize: '0.875rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                {job.submission_guidelines}
                            </div>
                        </div>
                    )}
                    {job.candidate_tracker_format && (
                        <div style={{ marginTop: '1rem' }}>
                            <div className="job-cc__field-label">Tracker columns</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {job.candidate_tracker_format.columns?.map((col: string, idx: number) => (
                                    <span
                                        key={idx}
                                        style={{
                                            background: '#f1f5f9',
                                            color: '#475569',
                                            fontSize: 12,
                                            padding: '4px 10px',
                                            borderRadius: 999,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {col}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {job.extracted_fields && Object.keys(job.extracted_fields).length > 0 && (
                <section className="job-cc__section">
                    <div className="job-cc__section-head">
                        <h2 className="job-cc__section-title">Extracted fields</h2>
                    </div>
                    <div className="job-cc__section-body">
                        <div className="job-cc__grid">
                            {Object.entries(job.extracted_fields).map(([key, value]) => (
                                <div key={key}>
                                    <div className="job-cc__field-label">{key.replace(/_/g, ' ')}</div>
                                    <div className="job-cc__field-value">
                                        {displayValue(typeof value === 'object' ? JSON.stringify(value) : value)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section className="job-cc__section">
                <div className="job-cc__section-head">
                    <h2 className="job-cc__section-title">Timeline</h2>
                </div>
                <div className="job-cc__section-body">
                    <div className="job-cc__grid">
                        <Field label="Created" value={formatDate(job.created_at)} />
                        <Field label="Updated" value={formatDate(job.updated_at)} />
                        <Field label="Published" value={formatDate(job.published_at)} />
                        <Field label="Closed" value={formatDate(job.closed_at)} />
                        <Field label="Target hire" value={formatDate(job.target_hire_date)} />
                        <Field
                            label="Priority"
                            value={
                                job.priority === 1 ? 'Low' : job.priority === 2 ? 'Medium' : job.priority === 3 ? 'High' : undefined
                            }
                        />
                    </div>
                </div>
            </section>
        </>
    );
}

function Field({
    label,
    value,
    highlight,
    wide,
}: {
    label: string;
    value?: unknown;
    highlight?: boolean;
    wide?: boolean;
}) {
    const displayVal: ReactNode =
        value === null || value === undefined || value === ''
            ? '—'
            : typeof value === 'object'
              ? JSON.stringify(value)
              : (value as ReactNode);
    return (
        <div style={wide ? { gridColumn: '1 / -1' } : undefined}>
            <div className="job-cc__field-label">{label}</div>
            <div className={highlight ? 'job-cc__field-value job-cc__field-value--highlight' : 'job-cc__field-value'}>{displayVal}</div>
        </div>
    );
}

function CandidatesTab({
    job,
    jobId,
    candidateView,
    setCandidateView,
    minSuggestedMatch,
    setMinSuggestedMatch,
    rowsForTable,
    suggestedRoster,
    candidateById,
    navigate,
}: {
    job: JobDetail;
    jobId: string;
    candidateView: CandidateView;
    setCandidateView: (v: CandidateView) => void;
    minSuggestedMatch: number;
    setMinSuggestedMatch: (n: number) => void;
    rowsForTable: SubmissionListItem[];
    suggestedRoster: { candidate: Candidate; score: number; skillsLabel: string }[];
    candidateById: Record<string, Candidate>;
    navigate: (path: string) => void;
}) {
    const suggestedFiltered = suggestedRoster.filter((r) => r.score >= minSuggestedMatch);

    return (
        <>
            <section className="job-cc__section">
                <div className="job-cc__section-head">
                    <h2 className="job-cc__section-title">Rule-based matching</h2>
                </div>
                <div className="job-cc__section-body">
                    <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.55 }}>
                        Match scores combine required skills (50%), experience fit (20%), location (10%), and keyword overlap (20%). Suggested
                        candidates are people in your pool who are not yet submitted to this job.
                    </p>
                    <div className="job-cc__filters">
                        <div>
                            <label>View</label>
                            <select
                                value={candidateView}
                                onChange={(e) => setCandidateView(e.target.value as CandidateView)}
                                aria-label="Candidate view"
                            >
                                <option value="pipeline">Active pipeline</option>
                                <option value="suggested">Suggested (pool)</option>
                                <option value="rejected">Rejected</option>
                                <option value="hired">Hired / won</option>
                            </select>
                        </div>
                        {candidateView === 'suggested' ? (
                            <div>
                                <label>Min match %</label>
                                <select
                                    value={minSuggestedMatch}
                                    onChange={(e) => setMinSuggestedMatch(Number(e.target.value))}
                                    aria-label="Minimum match percent"
                                >
                                    {[0, 40, 55, 65, 75, 85].map((n) => (
                                        <option key={n} value={n}>
                                            {n}%+
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : null}
                    </div>

                    {candidateView === 'suggested' ? (
                        suggestedFiltered.length === 0 ? (
                            <div className="job-cc__empty">No candidates in the pool above this threshold.</div>
                        ) : (
                            <div className="job-cc__table-wrap">
                                <table className="job-cc__table">
                                    <thead>
                                        <tr>
                                            <th>Candidate</th>
                                            <th>Match</th>
                                            <th>Skills fit</th>
                                            <th>Experience</th>
                                            <th />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {suggestedFiltered.slice(0, 40).map(({ candidate: c, score, skillsLabel }) => (
                                            <tr key={c.id}>
                                                <td>
                                                    <button type="button" className="job-cc__link" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} onClick={() => navigate(`/app/candidates/${c.id}`)}>
                                                        {c.candidate_name}
                                                    </button>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.email}</div>
                                                </td>
                                                <td>
                                                    <strong>{score}%</strong>
                                                    <div className="job-cc__match-bar">
                                                        <span style={{ width: `${score}%` }} />
                                                    </div>
                                                </td>
                                                <td>{skillsLabel}</td>
                                                <td>{c.total_experience != null ? `${c.total_experience} yrs` : '—'}</td>
                                                <td>
                                                    <button type="button" className="ghost-button" onClick={() => navigate(`/app/jobs/${jobId}/submissions/create`)}>
                                                        Submit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : rowsForTable.length === 0 ? (
                        <div className="job-cc__empty">No rows for this view.</div>
                    ) : (
                        <div className="job-cc__table-wrap">
                            <table className="job-cc__table">
                                <thead>
                                    <tr>
                                        <th>Candidate</th>
                                        <th>Match</th>
                                        <th>Skills fit</th>
                                        <th>Experience</th>
                                        <th>Status</th>
                                        <th>Updated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rowsForTable.map((s) => {
                                        const c = candidateById[s.candidate_id];
                                        const scoreFromApi = s.score != null ? Math.round(Number(s.score)) : null;
                                        const ruleScore = c ? computeMatchScore(job, c) : null;
                                        const displayScore = scoreFromApi ?? ruleScore ?? null;
                                        const skillsLbl = c ? matchLabel(computeMatchScore(job, c)) : '—';
                                        return (
                                            <tr key={s.id}>
                                                <td>
                                                    {c ? (
                                                        <button type="button" className="job-cc__link" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} onClick={() => navigate(`/app/candidates/${c.id}`)}>
                                                            {c.candidate_name}
                                                        </button>
                                                    ) : (
                                                        <span style={{ color: '#94a3b8' }}>{s.candidate_id.slice(0, 8)}…</span>
                                                    )}
                                                    {c?.email ? <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.email}</div> : null}
                                                </td>
                                                <td>
                                                    {displayScore != null ? (
                                                        <>
                                                            <strong>{displayScore}%</strong>
                                                            <div className="job-cc__match-bar">
                                                                <span style={{ width: `${Math.min(100, displayScore)}%` }} />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td>{skillsLbl}</td>
                                                <td>{c?.total_experience != null ? `${c.total_experience} yrs` : '—'}</td>
                                                <td>{s.status || '—'}</td>
                                                <td>{formatListDate(s.updated_at)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

function SubmissionsTab({
    submissions,
    funnel,
    candidateById,
    jobId,
    navigate,
}: {
    submissions: SubmissionListItem[];
    funnel: { status: string; count: number }[];
    candidateById: Record<string, Candidate>;
    jobId: string;
    navigate: (path: string) => void;
}) {
    const max = Math.max(1, ...funnel.map((f) => f.count));
    return (
        <section className="job-cc__section">
            <div className="job-cc__section-head">
                <h2 className="job-cc__section-title">Submission funnel</h2>
            </div>
            <div className="job-cc__section-body">
                {funnel.length === 0 ? (
                    <div className="job-cc__empty">No submissions yet — funnel will populate as candidates move through stages.</div>
                ) : (
                    <div className="job-cc__funnel">
                        {funnel.slice(0, 8).map((f) => (
                            <div key={f.status} className="job-cc__funnel-step">
                                <div className="job-cc__funnel-count">{f.count}</div>
                                <div className="job-cc__funnel-name">{f.status}</div>
                                <div className="job-cc__match-bar" style={{ maxWidth: '100%', marginTop: 8 }}>
                                    <span style={{ width: `${(f.count / max) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <h3 className="job-cc__section-title" style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>
                    All submissions
                </h3>
                {submissions.length === 0 ? (
                    <div className="job-cc__empty">No submissions for this job.</div>
                ) : (
                    <div className="job-cc__table-wrap">
                        <table className="job-cc__table">
                            <thead>
                                <tr>
                                    <th>Candidate</th>
                                    <th>Status</th>
                                    <th>Score</th>
                                    <th>Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map((s) => {
                                    const c = candidateById[s.candidate_id];
                                    return (
                                        <tr key={s.id}>
                                            <td>
                                                {c ? (
                                                    <button type="button" className="job-cc__link" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} onClick={() => navigate(`/app/candidates/${c.id}`)}>
                                                        {c.candidate_name}
                                                    </button>
                                                ) : (
                                                    <span style={{ color: '#94a3b8' }}>{s.candidate_id.slice(0, 8)}…</span>
                                                )}
                                            </td>
                                            <td>{s.status}</td>
                                            <td>{s.score != null ? String(s.score) : '—'}</td>
                                            <td>{formatListDate(s.submitted_at)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                <div style={{ marginTop: '1rem' }}>
                    <button type="button" className="ghost-button" onClick={() => navigate(`/app/jobs/${jobId}/submissions`)}>
                        Open full submissions workspace
                    </button>
                </div>
            </div>
        </section>
    );
}

function ClientTab({
    job,
    client,
    canReadClients,
    navigate,
}: {
    job: JobDetail;
    client: Client | null;
    canReadClients: boolean;
    navigate: (path: string) => void;
}) {
    return (
        <section className="job-cc__section">
            <div className="job-cc__section-head">
                <h2 className="job-cc__section-title">Client context</h2>
            </div>
            <div className="job-cc__section-body">
                {!job.client_id ? (
                    <div className="job-cc__empty">No client is linked to this job.</div>
                ) : !canReadClients ? (
                    <div className="job-cc__empty">You do not have permission to load client records.</div>
                ) : !client ? (
                    <div className="job-cc__empty">Client could not be loaded.</div>
                ) : (
                    <div className="job-cc__grid">
                        <Field label="Client name" value={client.name} />
                        <Field label="Code" value={client.code} />
                        <Field label="Contact" value={client.contact_person} />
                        <Field label="Email" value={client.email} />
                        <Field label="Phone" value={client.phone} />
                        <Field label="Location" value={[client.city, client.state, client.country].filter(Boolean).join(', ') || undefined} />
                        <div style={{ gridColumn: '1 / -1' }}>
                            <button type="button" className="primary-button" onClick={() => navigate(`/app/clients/${client.id}`)}>
                                Open client profile
                            </button>
                        </div>
                    </div>
                )}

                <h3 className="job-cc__section-title" style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>
                    On this job
                </h3>
                <div className="job-cc__grid">
                    <Field label="Submission guidelines" value={job.submission_guidelines} wide />
                    <Field label="Submission email" value={job.submission_email} wide />
                    <Field label="Project manager" value={job.client_project_manager} />
                    <Field label="Delivery SPOC" value={job.delivery_spoc} />
                </div>
            </div>
        </section>
    );
}

function ActivityTab({ activities, loading }: { activities: Activity[]; loading: boolean }) {
    if (loading && activities.length === 0) {
        return <div className="job-cc__empty">Loading activity…</div>;
    }
    if (!activities.length) {
        return <div className="job-cc__empty">No activity logged for this job yet.</div>;
    }
    return (
        <section className="job-cc__section">
            <div className="job-cc__section-head">
                <h2 className="job-cc__section-title">Activity timeline</h2>
            </div>
            <div className="job-cc__section-body">
                <div className="job-cc__timeline">
                    {activities.map((a) => (
                        <div key={a.id} className="job-cc__timeline-item">
                            <div className="job-cc__timeline-msg">{a.message}</div>
                            <div className="job-cc__timeline-meta">
                                {a.activity_type} · {formatListDate(a.created_at)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
