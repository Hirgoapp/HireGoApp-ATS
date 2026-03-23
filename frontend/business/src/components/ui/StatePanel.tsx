import { ReactNode } from 'react';

interface StatePanelProps {
    title: string;
    message?: string;
    tone?: 'neutral' | 'danger';
    action?: ReactNode;
}

export default function StatePanel({ title, message, tone = 'neutral', action }: StatePanelProps) {
    return (
        <div className={`state-panel ${tone === 'danger' ? 'danger' : ''}`}>
            <div className="state-title">{title}</div>
            {message && <div className="state-message">{message}</div>}
            {action && <div className="state-action">{action}</div>}
        </div>
    );
}
