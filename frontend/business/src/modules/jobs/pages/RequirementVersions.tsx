import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRequirementVersionHistoryByClient, RequirementVersionHistoryResponseDto } from '../services/requirements.api';

export default function RequirementVersions() {
    const { clientReqId } = useParams();
    const [data, setData] = useState<RequirementVersionHistoryResponseDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!clientReqId) return;
        setLoading(true);
        setError(null);
        getRequirementVersionHistoryByClient(clientReqId)
            .then(setData)
            .catch((e) => setError(e?.response?.data?.message || e?.message || 'Failed to load version history'))
            .finally(() => setLoading(false));
    }, [clientReqId]);

    if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
    if (error) return <div style={{ padding: 16, color: '#b91c1c' }}>{error}</div>;
    if (!data) return <div style={{ padding: 16 }}>No data</div>;

    return (
        <div style={{ padding: 16 }}>
            <h2 style={{ marginTop: 0 }}>Requirement Versions — ECMS {data.clientReqId}</h2>
            <div style={{ color: '#6B7280', marginBottom: 12 }}>
                Total Versions: {data.totalVersions} · Current: v{data.currentVersion.version} ({data.currentVersion.status})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.versions.map((v) => (
                    <div key={v.jobId} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>v{v.version} — {v.status}</div>
                                <div style={{ color: '#6B7280' }}>{v.title}</div>
                                <div style={{ color: '#6B7280', fontSize: 12 }}>{v.createdAt || ''}</div>
                            </div>
                            <div>
                                <Link to={`/app/requirements/${v.jobId}`}>View Details</Link>
                            </div>
                        </div>
                        {v.replacedByJobId && (
                            <div style={{ marginTop: 8, color: '#6B7280' }}>Replaced by v{v.replacedByVersion}: <Link to={`/app/requirements/${v.replacedByJobId}`}>{v.replacedByJobId}</Link></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
