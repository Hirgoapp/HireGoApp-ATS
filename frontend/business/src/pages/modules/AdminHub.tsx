import PageHeader from '../../components/ui/PageHeader';
import SurfaceCard from '../../components/ui/SurfaceCard';

export default function AdminHub() {
    return (
        <div className="page-stack">
            <PageHeader
                title="Administration"
                subtitle="User and company administration entry point for upcoming controls."
            />

            <SurfaceCard>
                <h2 className="block-title">Admin Workspace</h2>
                <div className="state-message">
                    This section is now active in navigation and reserved for user management, role templates,
                    module toggles, and organization settings.
                </div>
                <div style={{ marginTop: 12 }}>
                    <span className="nav-badge">Planned: User directory, permission matrix, settings</span>
                </div>
            </SurfaceCard>
        </div>
    );
}
