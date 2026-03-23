import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AppFooter from './AppFooter';
import AppSidebar from './AppSidebar';
import AppTopbar from './AppTopbar';
import { getVisibleNavItems } from '../navigation/navigation.utils';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { UI_DEFAULTS } from '../stores/uiStore';
import { useWorkspaceStore } from '../stores/workspaceStore';

export default function AppShell() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore((state) => ({ user: state.user, logout: state.logout }));
    const permissions = user?.permissions || [];
    const items = getVisibleNavItems(permissions);

    const { themeMode, accentColor, density } = useUiStore((state) => ({
        themeMode: state.themeMode,
        accentColor: state.accentColor,
        density: state.density,
    }));
    const setAccentColor = useUiStore((state) => state.setAccentColor);
    const { branding, refreshBranding } = useWorkspaceStore((state) => ({
        branding: state.branding,
        refreshBranding: state.refreshBranding,
    }));

    useEffect(() => {
        void refreshBranding();
    }, [refreshBranding]);

    useEffect(() => {
        // Apply tenant brand color only when user hasn't chosen a custom accent.
        if (branding.brandColor && accentColor === UI_DEFAULTS.accentColor) {
            setAccentColor(branding.brandColor);
        }
    }, [branding.brandColor, accentColor, setAccentColor]);

    const onLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div
            className="app-shell"
            data-theme={themeMode}
            data-density={density}
            style={{ ['--accent-color' as any]: accentColor }}
        >
            <AppSidebar items={items} />
            <section className="app-main-column">
                <AppTopbar onLogout={onLogout} />
                <main className="app-content">
                    <Outlet />
                </main>
                <AppFooter />
            </section>
        </div>
    );
}
