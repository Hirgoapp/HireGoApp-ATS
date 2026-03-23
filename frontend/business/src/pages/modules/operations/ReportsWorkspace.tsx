import { useMemo, useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import StatePanel from '../../../components/ui/StatePanel';
import { useAuthStore } from '../../../stores/authStore';
import api from '../../../services/api';

type ReportItem = {
    id: string;
    label: string;
    endpoint: string;
    description: string;
};

const REPORTS: ReportItem[] = [
    {
        id: 'funnel',
        label: 'Pipeline Funnel',
        endpoint: '/reports/analytics/funnel.csv',
        description: 'Conversion by stage and status.',
    },
    {
        id: 'time-to-hire',
        label: 'Time To Hire',
        endpoint: '/reports/analytics/time-to-hire.csv',
        description: 'Average, median, and p90 hire duration.',
    },
    {
        id: 'sources',
        label: 'Source Effectiveness',
        endpoint: '/reports/analytics/sources.csv',
        description: 'Applications, hires, and conversion by source.',
    },
    {
        id: 'recruiters',
        label: 'Recruiter Performance',
        endpoint: '/reports/analytics/recruiters.csv',
        description: 'Hiring outcomes and speed by recruiter.',
    },
    {
        id: 'jobs',
        label: 'Job Performance',
        endpoint: '/reports/analytics/jobs.csv',
        description: 'Applications, hires, conversion, and hire velocity by job.',
    },
];

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export default function ReportsWorkspace() {
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const has = (p: string) => permissions.includes('*') || permissions.includes(p);
    const canRead = has('reports:read') || has('reports:export');
    const canExport = has('reports:export');

    const cards = useMemo(() => REPORTS, []);

    const handleExport = async (item: ReportItem) => {
        try {
            setLoadingId(item.id);
            setError(null);
            const response = await api.get(item.endpoint, { responseType: 'blob' });
            const fileName = `${item.id}-${new Date().toISOString().slice(0, 10)}.csv`;
            downloadBlob(response.data, fileName);
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to export report');
        } finally {
            setLoadingId(null);
        }
    };

    if (!canRead) {
        return <StatePanel title="Access Denied" message="Missing required permissions: reports:read" tone="danger" />;
    }

    return (
        <div className="page-stack">
            <PageHeader
                title="Reports"
                subtitle="Export analytics datasets for leadership reviews and operational planning."
            />

            {error ? (
                <SurfaceCard>
                    <div className="state-message" style={{ color: '#b91c1c' }}>{error}</div>
                </SurfaceCard>
            ) : null}

            <SurfaceCard>
                <div className="block-title">Analytics Exports</div>
                <div className="state-message">Each export is generated using company-scoped analytics and downloaded as CSV.</div>
                <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                    {cards.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: 12,
                                padding: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                flexWrap: 'wrap',
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 800 }}>{item.label}</div>
                                <div className="state-message">{item.description}</div>
                            </div>
                            <button
                                className="primary-button"
                                type="button"
                                onClick={() => handleExport(item)}
                                disabled={!canExport || loadingId === item.id}
                            >
                                {loadingId === item.id ? 'Exporting...' : 'Export CSV'}
                            </button>
                        </div>
                    ))}
                </div>
            </SurfaceCard>
        </div>
    );
}
