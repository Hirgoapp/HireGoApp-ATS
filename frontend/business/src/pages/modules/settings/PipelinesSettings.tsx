import { useEffect, useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import StatePanel from '../../../components/ui/StatePanel';
import { useAuthStore } from '../../../stores/authStore';
import api from '../../../services/api';

type PipelineStage = {
    id: string;
    name: string;
    stage_order: number;
    stage_type: string;
    color?: string;
};

type Pipeline = {
    id: string;
    name: string;
    description?: string;
    is_default: boolean;
    is_active: boolean;
    stages: PipelineStage[];
};

type PipelineListResponse = {
    data: Pipeline[];
    total: number;
};

export default function PipelinesSettings() {
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const has = (p: string) => permissions.includes('*') || permissions.includes(p);

    const canRead = has('pipelines:read');
    const canCreate = has('pipelines:create');
    const canUpdate = has('pipelines:update');

    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadPipelines = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get<PipelineListResponse>('/pipelines', { params: { page: 1, limit: 30 } });
            setPipelines(response.data.data || []);
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to load pipelines');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (canRead) {
            loadPipelines();
        }
    }, []);

    const createDefault = async () => {
        try {
            setBusyId('default');
            setError(null);
            await api.post('/pipelines/default');
            await loadPipelines();
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to create default pipeline');
        } finally {
            setBusyId(null);
        }
    };

    const setAsDefault = async (pipeline: Pipeline) => {
        try {
            setBusyId(pipeline.id);
            setError(null);
            await api.put(`/pipelines/${pipeline.id}`, { is_default: true });
            await loadPipelines();
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to update pipeline');
        } finally {
            setBusyId(null);
        }
    };

    if (!canRead) {
        return <StatePanel title="Access Denied" message="Missing required permissions: pipelines:read" tone="danger" />;
    }

    return (
        <div className="page-stack">
            <PageHeader
                title="Pipelines"
                subtitle="Configure and govern hiring workflow stages used across jobs."
                actions={
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="ghost-button" type="button" onClick={loadPipelines} disabled={loading}>
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </button>
                        <button className="primary-button" type="button" onClick={createDefault} disabled={!canCreate || busyId === 'default'}>
                            {busyId === 'default' ? 'Creating...' : 'Create Default Pipeline'}
                        </button>
                    </div>
                }
            />

            {error ? (
                <SurfaceCard>
                    <div className="state-message" style={{ color: '#b91c1c' }}>{error}</div>
                </SurfaceCard>
            ) : null}

            <SurfaceCard>
                <div className="block-title">Configured Pipelines</div>
                <div className="state-message">Default pipeline is used as baseline workflow for new operations.</div>

                <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                    {pipelines.map((pipeline) => (
                        <div
                            key={pipeline.id}
                            style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, display: 'grid', gap: 10 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                <div>
                                    <div style={{ fontWeight: 800 }}>{pipeline.name}</div>
                                    <div className="state-message">{pipeline.description || 'No description'}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {pipeline.is_default ? <span className="nav-badge">Default</span> : null}
                                    <button
                                        className="ghost-button"
                                        type="button"
                                        disabled={!canUpdate || pipeline.is_default || busyId === pipeline.id}
                                        onClick={() => setAsDefault(pipeline)}
                                    >
                                        {busyId === pipeline.id ? 'Saving...' : 'Set as Default'}
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {pipeline.stages?.sort((a, b) => a.stage_order - b.stage_order).map((stage) => (
                                    <span
                                        key={stage.id}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            borderRadius: 999,
                                            border: '1px solid #e5e7eb',
                                            padding: '5px 10px',
                                            background: 'white',
                                            fontSize: 12,
                                            fontWeight: 700,
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                background: stage.color || '#9ca3af',
                                            }}
                                        />
                                        {stage.stage_order}. {stage.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {!loading && pipelines.length === 0 ? (
                    <div style={{ marginTop: 12 }}>
                        <StatePanel title="No pipelines found" message="Create a default pipeline to bootstrap workflow stages." />
                    </div>
                ) : null}
            </SurfaceCard>
        </div>
    );
}
