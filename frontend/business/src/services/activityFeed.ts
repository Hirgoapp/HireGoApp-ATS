import { fetchCandidates } from '../modules/candidates/services/candidates.api';
import { fetchClients } from '../modules/clients/services/clients.api';
import { fetchJobs } from '../modules/jobs/services/jobs.api';

export type ActivitySeverity = 'info' | 'warning' | 'critical';

export interface ActivityFeedItem {
    id: string;
    category: 'candidate' | 'client' | 'job';
    title: string;
    description: string;
    timestamp: string;
    severity: ActivitySeverity;
}

function toSeverity(ageHours: number): ActivitySeverity {
    if (ageHours <= 24) {
        return 'info';
    }

    if (ageHours <= 72) {
        return 'warning';
    }

    return 'critical';
}

export async function fetchRecentActivityFeed(limit = 10): Promise<ActivityFeedItem[]> {
    const [jobsRes, clientsRes, candidatesRes] = await Promise.allSettled([
        fetchJobs({ page: 1, limit: 6, orderBy: 'updated_at', orderDirection: 'DESC' }),
        fetchClients({ page: 1, limit: 6 }),
        fetchCandidates({ page: 1, limit: 6 }),
    ]);

    const jobs = jobsRes.status === 'fulfilled' ? jobsRes.value.items : [];
    const clients = clientsRes.status === 'fulfilled' ? clientsRes.value.data : [];
    const candidates = candidatesRes.status === 'fulfilled' ? candidatesRes.value.data : [];

    const items: ActivityFeedItem[] = [
        ...jobs.map((job) => {
            const ts = job.updated_at || job.created_at;
            const ageHours = Math.max(0, (Date.now() - new Date(ts).getTime()) / 36e5);

            return {
                id: `job-${job.id}`,
                category: 'job' as const,
                title: job.title || job.job_title || 'Job updated',
                description: `Job ${job.status} in ${job.department || 'General'} department`,
                timestamp: ts,
                severity: toSeverity(ageHours),
            };
        }),
        ...clients.map((client) => {
            const ts = client.updated_at || client.created_at;
            const ageHours = Math.max(0, (Date.now() - new Date(ts).getTime()) / 36e5);

            return {
                id: `client-${client.id}`,
                category: 'client' as const,
                title: client.name,
                description: `Client profile ${client.updated_at !== client.created_at ? 'updated' : 'created'}`,
                timestamp: ts,
                severity: toSeverity(ageHours),
            };
        }),
        ...candidates.map((candidate) => {
            const ts = candidate.updated_at || candidate.created_at;
            const ageHours = Math.max(0, (Date.now() - new Date(ts).getTime()) / 36e5);

            return {
                id: `candidate-${candidate.id}`,
                category: 'candidate' as const,
                title: candidate.candidate_name,
                description: `Candidate profile ${candidate.updated_at !== candidate.created_at ? 'updated' : 'added'}`,
                timestamp: ts,
                severity: toSeverity(ageHours),
            };
        }),
    ];

    return items
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
}
