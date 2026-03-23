import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import StatePanel from '../../../components/ui/StatePanel';
import { useAuthStore } from '../../../stores/authStore';
import api from '../../../services/api';

type DocumentRow = {
    id: string;
    original_name: string;
    entity_type: string;
    entity_id: string;
    document_type?: string;
    file_size: number;
    created_at: string;
};

type DocumentsResponse = {
    data: DocumentRow[];
    total: number;
    page: number;
    limit: number;
};

function formatBytes(bytes: number) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let idx = 0;
    while (size >= 1024 && idx < units.length - 1) {
        size /= 1024;
        idx += 1;
    }
    return `${size.toFixed(size >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

export default function DocumentsWorkspace() {
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const has = (p: string) => permissions.includes('*') || permissions.includes(p);

    const canRead = has('documents:read');
    const [items, setItems] = useState<DocumentRow[]>([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadDocuments = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get<DocumentsResponse>('/documents', {
                params: { page: 1, limit: 30, search: search.trim() || undefined },
            });
            setItems(response.data.data || []);
            setTotal(response.data.total || 0);
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || 'Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (canRead) {
            loadDocuments();
        }
    }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return items;
        const q = search.toLowerCase();
        return items.filter((item) =>
            [item.original_name, item.document_type || '', item.entity_type, item.entity_id]
                .join(' ')
                .toLowerCase()
                .includes(q)
        );
    }, [items, search]);

    const openDocument = async (id: string) => {
        try {
            const response = await api.get<{ url: string | null }>(`/documents/${id}/presigned-url`);
            if (response.data?.url) {
                window.open(response.data.url, '_blank', 'noopener,noreferrer');
                return;
            }
            window.open(`/api/v1/documents/${id}/download`, '_blank', 'noopener,noreferrer');
        } catch {
            window.open(`/api/v1/documents/${id}/download`, '_blank', 'noopener,noreferrer');
        }
    };

    if (!canRead) {
        return <StatePanel title="Access Denied" message="Missing required permissions: documents:read" tone="danger" />;
    }

    return (
        <div className="page-stack">
            <PageHeader
                title="Documents"
                subtitle="Centralized document inventory across candidates, jobs, and clients."
                actions={
                    <button className="ghost-button" type="button" onClick={loadDocuments} disabled={loading}>
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                }
            />

            {error ? (
                <SurfaceCard>
                    <div className="state-message" style={{ color: '#b91c1c' }}>{error}</div>
                </SurfaceCard>
            ) : null}

            <SurfaceCard>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="block-title">Document Library ({total})</div>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search filename, type, entity..."
                        style={{
                            minWidth: 260,
                            flex: '1 1 320px',
                            maxWidth: 420,
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: '1px solid #d1d5db',
                            background: 'white',
                        }}
                    />
                </div>

                <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                    {filtered.map((doc) => (
                        <div
                            key={doc.id}
                            style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: 10,
                                padding: 12,
                                display: 'grid',
                                gridTemplateColumns: 'minmax(220px, 2fr) minmax(120px, 1fr) minmax(130px, 1fr) minmax(90px, auto) minmax(110px, auto)',
                                gap: 12,
                                alignItems: 'center',
                            }}
                        >
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {doc.original_name}
                                </div>
                                <div className="state-message">{new Date(doc.created_at).toLocaleString()}</div>
                            </div>
                            <div>{doc.document_type || 'general'}</div>
                            <div>{doc.entity_type}</div>
                            <div>{formatBytes(doc.file_size)}</div>
                            <button className="ghost-button" type="button" onClick={() => openDocument(doc.id)}>
                                Open
                            </button>
                        </div>
                    ))}
                </div>

                {!loading && filtered.length === 0 ? (
                    <div style={{ marginTop: 12 }}>
                        <StatePanel title="No documents found" message="Try a different search or upload from entity pages." />
                    </div>
                ) : null}
            </SurfaceCard>
        </div>
    );
}
