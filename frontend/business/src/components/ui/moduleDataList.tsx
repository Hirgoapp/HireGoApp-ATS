import './moduleDataList.css';

export function shortId(uuid: string | undefined | null, len = 8): string {
    if (!uuid) return '—';
    return uuid.length <= len ? uuid : `${uuid.slice(0, len)}…`;
}

export function submissionPillClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('hired') || s.includes('offer')) return 'mdl-pill mdl-pill--emerald';
    if (s.includes('reject') || s.includes('withdraw')) return 'mdl-pill mdl-pill--rose';
    if (s.includes('interview')) return 'mdl-pill mdl-pill--violet';
    if (s.includes('screen')) return 'mdl-pill mdl-pill--blue';
    if (s.includes('applied')) return 'mdl-pill mdl-pill--cyan';
    return 'mdl-pill mdl-pill--slate';
}

export function interviewPillClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('complete')) return 'mdl-pill mdl-pill--emerald';
    if (s.includes('cancel') || s.includes('no_show')) return 'mdl-pill mdl-pill--rose';
    if (s.includes('schedule') || s.includes('progress')) return 'mdl-pill mdl-pill--blue';
    if (s.includes('reschedule')) return 'mdl-pill mdl-pill--amber';
    return 'mdl-pill mdl-pill--slate';
}

export function offerPillClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'accepted') return 'mdl-pill mdl-pill--emerald';
    if (s === 'issued') return 'mdl-pill mdl-pill--blue';
    if (s === 'rejected' || s === 'withdrawn') return 'mdl-pill mdl-pill--rose';
    if (s === 'draft') return 'mdl-pill mdl-pill--slate';
    return 'mdl-pill mdl-pill--amber';
}

export function formatListDate(iso?: string | null): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return '—';
    }
}

export function formatListDateTime(iso?: string | null): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '—';
    }
}

type PaginationProps = {
    page: number;
    pageSize: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
};

export function ModuleDataListPagination({ page, pageSize, total, onPrev, onNext }: PaginationProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    return (
        <div className="mdl-pagination">
            <span className="mdl-pagination__meta">
                Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{total}</strong>
            </span>
            <div className="mdl-pagination__nav">
                <button type="button" className="ghost-button" disabled={page <= 1} onClick={onPrev}>
                    ← Previous
                </button>
                <span className="mdl-pagination__page">
                    Page {page} / {totalPages}
                </span>
                <button type="button" className="ghost-button" disabled={page >= totalPages} onClick={onNext}>
                    Next →
                </button>
            </div>
        </div>
    );
}

type EmptyProps = {
    icon: string;
    title: string;
    message: string;
    action?: import('react').ReactNode;
};

export function ModuleDataListEmpty({ icon, title, message, action }: EmptyProps) {
    return (
        <div className="mdl-empty">
            <div className="mdl-empty__icon" aria-hidden>
                {icon}
            </div>
            <h3 className="mdl-empty__title">{title}</h3>
            <p className="mdl-empty__msg">{message}</p>
            {action ? <div style={{ marginTop: 20 }}>{action}</div> : null}
        </div>
    );
}
