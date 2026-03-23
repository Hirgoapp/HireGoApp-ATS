import PageHeader from '../../../components/ui/PageHeader';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import StatePanel from '../../../components/ui/StatePanel';
import { useAuthStore } from '../../../stores/authStore';
import AccessControl from '../AccessControl';

export default function PermissionsSettings() {
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const has = (p: string) => permissions.includes('*') || permissions.includes(p);
    const canManage = has('roles:manage');

    if (!canManage) {
        return <StatePanel title="Access Denied" message="Missing required permissions: roles:manage" tone="danger" />;
    }

    return (
        <div className="page-stack">
            <PageHeader
                title="Permissions"
                subtitle="Use the matrix to control what each role can do."
            />
            <SurfaceCard>
                <div className="state-message">
                    Select a role, toggle permissions, then click Save. Users will need to log out and log in again to refresh their token permissions.
                </div>
            </SurfaceCard>
            <AccessControl />
        </div>
    );
}

