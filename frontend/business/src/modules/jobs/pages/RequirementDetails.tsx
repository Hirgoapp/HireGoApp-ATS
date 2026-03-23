import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getRequirementDetails, RequirementDetailsResponseDto } from '../services/requirements.api';

export default function RequirementDetails() {
    const { jobId } = useParams();
    const [data, setData] = useState<RequirementDetailsResponseDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!jobId) return;
        setLoading(true);
        setError(null);
        getRequirementDetails(jobId)
            .then(setData)
            .catch((e) => setError(e?.response?.data?.message || e?.message || 'Failed to load requirement'))
            .finally(() => setLoading(false));
    }, [jobId]);

    if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
    if (error) return <div style={{ padding: 16, color: '#b91c1c' }}>{error}</div>;
    if (!data) return <div style={{ padding: 16 }}>No data</div>;

    return (
        <div style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* Raw Email (always visible) */}
            <div style={{ flex: 1 }}>
                <h2 style={{ marginTop: 0 }}>{data.title}</h2>
                <div style={{ color: '#6B7280', marginBottom: 8 }}>
                    <span>ECMS: {data.clientReqId}</span>
                    <span style={{ marginLeft: 12 }}>Version: {data.version}</span>
                    <span style={{ marginLeft: 12 }}>Status: {data.status}</span>
                </div>
                <h3 style={{ marginTop: 0 }}>Raw Email (Source of Truth)</h3>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 12, whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: 600, overflow: 'auto' }}>
                    {data.rawEmail?.rawEmailContent}
                </div>
            </div>

            {/* Structured Details */}
            <div style={{ flex: 1 }}>
                <h3 style={{ marginTop: 0 }}>Instructions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.instructions.map((i) => (
                        <div key={i.id} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 12, background: i.highlight_level === 'critical' ? '#fef2f2' : i.highlight_level === 'high' ? '#fffbeb' : '#ffffff' }}>
                            <div style={{ fontWeight: 600 }}>[{i.type}] {i.title}</div>
                            <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{i.content}</div>
                        </div>
                    ))}
                </div>

                <h3 style={{ marginTop: 16 }}>Candidate Tracker</h3>
                {data.candidateTracker ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Field</th>
                                <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Type</th>
                                <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Required</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.candidateTracker.required_fields.map((f, idx) => (
                                <tr key={idx}>
                                    <td style={{ borderBottom: '1px solid #f3f4f6', padding: 8 }}>{f.field}</td>
                                    <td style={{ borderBottom: '1px solid #f3f4f6', padding: 8 }}>{f.type}</td>
                                    <td style={{ borderBottom: '1px solid #f3f4f6', padding: 8 }}>{f.required ? '✓' : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ color: '#6B7280' }}>No candidate tracker for this requirement.</div>
                )}

                {data.previousVersionJobId && (
                    <div style={{ marginTop: 16, padding: 12, border: '1px solid #e5e7eb', borderRadius: 6 }}>
                        Previous Version: <a href={`/app/requirements/${data.previousVersionJobId}`}>{data.previousVersionJobId}</a>
                    </div>
                )}
            </div>
        </div>
    );
}
