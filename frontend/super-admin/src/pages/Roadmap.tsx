import { ClipboardList, CheckCircle2, Rocket, Hourglass, ArrowRight } from 'lucide-react';

export default function Roadmap() {
    const current = [
        'Companies: create/edit/view/soft-delete',
        'Company admins: create/list/edit/reset password/activate-deactivate',
        'Modules: per-company toggles (dynamic list from backend)',
        'Operational polish: clear errors + no stuck overlays',
    ];

    const next = [
        'Licensing enforcement (modules allowed by tier)',
        'RBAC v2: expand permission granularity where applicable (keep read-only modules read-only)',
        'Restore deleted companies + deleted filter',
        'Audit log viewer in UI',
        'Suspend company blocks portal logins',
    ];

    const later = [
        'DB-driven feature flags (no-deploy toggles) + beta rollout',
        'Session revoke / force logout tools',
        'Usage limits + metering + billing support',
    ];

    const Badge = ({ label, variant }: { label: string; variant: 'done' | 'next' | 'later' }) => {
        const cls =
            variant === 'done'
                ? 'bg-green-900/30 text-green-300 border-green-700'
                : variant === 'next'
                    ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700'
                    : 'bg-gray-900/30 text-gray-300 border-gray-700';
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs border ${cls}`}>
                {label}
            </span>
        );
    };

    const Section = ({
        title,
        icon: Icon,
        items,
        badge,
    }: {
        title: string;
        icon: any;
        items: string[];
        badge: React.ReactNode;
    }) => (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-brand-400" />
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                </div>
                {badge}
            </div>
            <ul className="space-y-3">
                {items.map((item) => (
                    <li key={item} className="flex gap-3 text-gray-200">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className="max-w-5xl space-y-6">
            <div className="flex items-start justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <ClipboardList className="w-8 h-8 text-brand-600" />
                        <h1 className="text-3xl font-bold text-white">Roadmap</h1>
                    </div>
                    <p className="text-gray-400">
                        Clear view of what’s <span className="text-white font-medium">already implemented</span> vs what’s <span className="text-white font-medium">planned</span>.
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                        Source doc: <span className="font-mono">SUPER_ADMIN_ROADMAP.md</span>
                    </p>
                </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 flex items-center justify-between">
                <div className="text-gray-200">
                    <div className="text-white font-semibold">How to read this page</div>
                    <div className="text-sm text-gray-400 mt-1">Green = done now, Yellow = next version, Gray = later/optional.</div>
                </div>
                <div className="flex gap-2">
                    <Badge label="DONE" variant="done" />
                    <Badge label="NEXT" variant="next" />
                    <Badge label="LATER" variant="later" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Section title="Current Version (Implemented)" icon={Rocket} items={current} badge={<Badge label="DONE" variant="done" />} />
                <Section title="Next Version (Planned)" icon={ArrowRight} items={next} badge={<Badge label="NEXT" variant="next" />} />
            </div>

            <Section title="Later (Optional / scale)" icon={Hourglass} items={later} badge={<Badge label="LATER" variant="later" />} />
        </div>
    );
}

