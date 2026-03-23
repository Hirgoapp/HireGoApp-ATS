import { NavLink, Outlet } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import SurfaceCard from '../../components/ui/SurfaceCard';
import StatePanel from '../../components/ui/StatePanel';
import { useAuthStore } from '../../stores/authStore';

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 12,
    textDecoration: 'none',
    fontWeight: 800,
    color: isActive ? 'color-mix(in srgb, var(--accent-color) 75%, black)' : '#111827',
    background: isActive ? 'color-mix(in srgb, var(--accent-color) 10%, white)' : 'transparent',
    border: `1px solid ${isActive ? 'color-mix(in srgb, var(--accent-color) 25%, #e5e7eb)' : 'transparent'}`,
} as React.CSSProperties);

export default function SettingsHub() {
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const has = (p: string) => permissions.includes('*') || permissions.includes(p);

    const canViewSettings = has('settings:view');
    const canManageRbac = has('roles:manage');
    const canManagePipelines = has('pipelines:read') || has('pipelines:update') || has('pipelines:create');
    const canManageApiKeys = has('api-keys:read') || has('api-keys:create') || has('api-keys:update');
    const canManageWebhooks = has('webhooks:read') || has('webhooks:create') || has('webhooks:update');
    const canManageIntegrations = has('integrations:view') || has('integrations:update');
    const canManageSkills = has('skills:read') || has('skills:create') || has('skills:update');
    const canManageSkillCategories = has('skill-categories:read') || has('skill-categories:create') || has('skill-categories:update');
    const canManageEducationLevels = has('education-levels:read') || has('education-levels:create') || has('education-levels:update');
    const canManageExperienceTypes = has('experience-types:read') || has('experience-types:create') || has('experience-types:update');
    const canManageQualifications = has('qualifications:read') || has('qualifications:create') || has('qualifications:update');
    const canViewAudit = has('audit:view');

    if (!canViewSettings && !canManageRbac) {
        return (
            <StatePanel
                title="Access Denied"
                message="You do not have permission to view Settings."
                tone="danger"
            />
        );
    }

    return (
        <div className="page-stack">
            <PageHeader
                title="Settings"
                subtitle="Manage company configuration, users, roles, and permissions."
            />

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14, alignItems: 'start' }}>
                <SurfaceCard>
                    <div className="block-title">Administration</div>
                    <div style={{ display: 'grid', gap: 6 }}>
                        {canViewSettings ? (
                            <NavLink to="/app/admin/settings/company" style={linkStyle}>
                                <span>Company</span>
                                <span className="nav-badge">Profile</span>
                            </NavLink>
                        ) : null}
                        {canManageRbac ? (
                            <>
                                <NavLink to="/app/admin/settings/users" style={linkStyle}>
                                    <span>Users</span>
                                </NavLink>
                                <NavLink to="/app/admin/settings/roles" style={linkStyle}>
                                    <span>Roles</span>
                                </NavLink>
                                <NavLink to="/app/admin/settings/permissions" style={linkStyle}>
                                    <span>Permissions</span>
                                </NavLink>
                                <NavLink to="/app/admin/settings/permissions/help" style={linkStyle}>
                                    <span>Permissions Help</span>
                                    <span className="nav-badge">Docs</span>
                                </NavLink>
                            </>
                        ) : null}
                        {canManagePipelines ? (
                            <NavLink to="/app/admin/settings/pipelines" style={linkStyle}>
                                <span>Pipelines</span>
                                <span className="nav-badge">Workflow</span>
                            </NavLink>
                        ) : null}
                        {canManageApiKeys ? (
                            <NavLink to="/app/admin/settings/api-keys" style={linkStyle}>
                                <span>API Keys</span>
                                <span className="nav-badge">Integration</span>
                            </NavLink>
                        ) : null}
                        {canManageWebhooks ? (
                            <NavLink to="/app/admin/settings/webhooks" style={linkStyle}>
                                <span>Webhooks</span>
                                <span className="nav-badge">Integration</span>
                            </NavLink>
                        ) : null}
                        {canManageIntegrations ? (
                            <NavLink to="/app/admin/settings/integrations" style={linkStyle}>
                                <span>Integrations</span>
                                <span className="nav-badge">Services</span>
                            </NavLink>
                        ) : null}
                        {canViewAudit ? (
                            <NavLink to="/app/admin/settings/audit" style={linkStyle}>
                                <span>Audit Logs</span>
                                <span className="nav-badge">Compliance</span>
                            </NavLink>
                        ) : null}
                    </div>

                    {(canManageSkills || canManageSkillCategories || canManageEducationLevels || canManageExperienceTypes || canManageQualifications) && (
                        <>
                            <div className="block-title" style={{ marginTop: '20px' }}>Skills Taxonomy</div>
                            <div style={{ display: 'grid', gap: 6 }}>
                                {canManageSkills ? (
                                    <NavLink to="/app/admin/settings/skills" style={linkStyle}>
                                        <span>Skills</span>
                                        <span className="nav-badge">Core</span>
                                    </NavLink>
                                ) : null}
                                {canManageSkillCategories ? (
                                    <NavLink to="/app/admin/settings/skill-categories" style={linkStyle}>
                                        <span>Skill Categories</span>
                                    </NavLink>
                                ) : null}
                                {canManageEducationLevels ? (
                                    <NavLink to="/app/admin/settings/education-levels" style={linkStyle}>
                                        <span>Education Levels</span>
                                    </NavLink>
                                ) : null}
                                {canManageExperienceTypes ? (
                                    <NavLink to="/app/admin/settings/experience-types" style={linkStyle}>
                                        <span>Experience Types</span>
                                    </NavLink>
                                ) : null}
                                {canManageQualifications ? (
                                    <NavLink to="/app/admin/settings/qualifications" style={linkStyle}>
                                        <span>Qualifications</span>
                                    </NavLink>
                                ) : null}
                            </div>
                        </>
                    )}
                </SurfaceCard>

                <div style={{ minWidth: 0 }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

