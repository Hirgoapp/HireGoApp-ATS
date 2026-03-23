import { X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { APP_INFO, SECTION_LABELS, type NavItem } from '../navigation/navigation.config';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { useWorkspaceStore } from '../stores/workspaceStore';

interface AppSidebarProps {
    items: NavItem[];
}

export default function AppSidebar({ items }: AppSidebarProps) {
    const { sidebarCollapsed, mobileNavOpen, setMobileNavOpen } = useUiStore((state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        mobileNavOpen: state.mobileNavOpen,
        setMobileNavOpen: state.setMobileNavOpen,
    }));
    const userCompanyName = useAuthStore((state) => state.user?.company?.name);
    const branding = useWorkspaceStore((state) => state.branding);
    const companyName = branding.name || userCompanyName || APP_INFO.company;
    const initials = companyName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part: string) => part[0]?.toUpperCase())
        .join('') || 'SA';

    const sectionOrder: NavItem['section'][] = ['overview', 'management', 'settings'];

    return (
        <>
            {mobileNavOpen && <div className="mobile-overlay" onClick={() => setMobileNavOpen(false)} />}
            <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileNavOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="brand-block">
                        <div className="brand-row">
                            {branding.logoUrl ? (
                                <img src={branding.logoUrl} alt={branding.name} className="brand-logo" />
                            ) : (
                                <div className="brand-logo-fallback">{initials}</div>
                            )}
                            {!sidebarCollapsed && (
                                <div>
                                    <div className="brand-title">{companyName}</div>
                                    <div className="brand-subtitle">Super Admin Platform</div>
                                </div>
                            )}
                        </div>
                    </div>
                    <button type="button" className="icon-button mobile-only" onClick={() => setMobileNavOpen(false)}>
                        <X size={18} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {sectionOrder.map((section) => {
                        const sectionItems = items.filter((item) => item.section === section);
                        if (sectionItems.length === 0) {
                            return null;
                        }

                        return (
                            <div key={section} className="nav-section">
                                {!sidebarCollapsed && <div className="nav-section-title">{SECTION_LABELS[section]}</div>}
                                <div className="nav-section-items">
                                    {sectionItems.map((item) => {
                                        const Icon = item.icon;
                                        if (item.status === 'coming-soon' || !item.path) {
                                            return (
                                                <div key={item.id} className="nav-item disabled" title={`${item.label} coming soon`}>
                                                    <Icon size={16} />
                                                    {!sidebarCollapsed && (
                                                        <>
                                                            <span>{item.label}</span>
                                                            <span className="nav-badge">Soon</span>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        }

                                        return (
                                            <NavLink
                                                key={item.id}
                                                to={item.path}
                                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                                onClick={() => setMobileNavOpen(false)}
                                            >
                                                <Icon size={16} />
                                                {!sidebarCollapsed && <span>{item.label}</span>}
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
