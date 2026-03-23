import { Menu, Moon, SlidersHorizontal, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ACCENT_PRESETS, APP_INFO } from '../navigation/navigation.config';
import { getBreadcrumbFromPath } from '../navigation/navigation.utils';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { useWorkspaceStore } from '../stores/workspaceStore';

interface AppTopbarProps {
    onLogout: () => Promise<void>;
}

export default function AppTopbar({ onLogout }: AppTopbarProps) {
    const location = useLocation();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement | null>(null);

    const { user, sessionStartedAt } = useAuthStore((state) => ({
        user: state.user,
        sessionStartedAt: null,
    }));
    const branding = useWorkspaceStore((state) => state.branding);
    const [now, setNow] = useState(() => Date.now());
    const {
        toggleSidebar,
        sidebarCollapsed,
        setSidebarCollapsed,
        setMobileNavOpen,
        themeMode,
        setThemeMode,
        accentColor,
        setAccentColor,
        density,
        setDensity,
        resetPreferences,
    } = useUiStore((state) => ({
        toggleSidebar: state.toggleSidebar,
        sidebarCollapsed: state.sidebarCollapsed,
        setSidebarCollapsed: state.setSidebarCollapsed,
        setMobileNavOpen: state.setMobileNavOpen,
        themeMode: state.themeMode,
        setThemeMode: state.setThemeMode,
        accentColor: state.accentColor,
        setAccentColor: state.setAccentColor,
        density: state.density,
        setDensity: state.setDensity,
        resetPreferences: state.resetPreferences,
    }));

    useEffect(() => {
        const onDocumentPointerDown = (event: MouseEvent) => {
            if (!settingsRef.current) {
                return;
            }
            if (settingsRef.current.contains(event.target as Node)) {
                return;
            }
            setSettingsOpen(false);
        };

        const onEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSettingsOpen(false);
            }
        };

        document.addEventListener('mousedown', onDocumentPointerDown);
        document.addEventListener('keydown', onEscape);
        return () => {
            document.removeEventListener('mousedown', onDocumentPointerDown);
            document.removeEventListener('keydown', onEscape);
        };
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 30000);
        return () => window.clearInterval(timer);
    }, []);

    const sessionDurationLabel = (() => {
        if (!sessionStartedAt) {
            return 'Session: --';
        }
        const diffMs = Math.max(0, now - new Date(sessionStartedAt).getTime());
        const totalMinutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `Session: ${hours}h ${String(minutes).padStart(2, '0')}m`;
    })();

    const userInitials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.trim() || 'SA';
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const workspaceTimezone = branding.timezone || 'UTC';
    const timezoneMismatch = workspaceTimezone !== localTimezone;

    const nowDateLabel = new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: workspaceTimezone,
    }).format(now);

    const nowTimeLabel = new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: workspaceTimezone,
    }).format(now);

    return (
        <header className="app-topbar">
            <div className="topbar-left">
                <button type="button" className="icon-button desktop-only" onClick={toggleSidebar} aria-label="Toggle sidebar">
                    <Menu size={18} />
                </button>
                <button type="button" className="icon-button mobile-only" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation">
                    <Menu size={18} />
                </button>
                <div>
                    <div className="topbar-title">{getBreadcrumbFromPath(location.pathname)}</div>
                    <div className="topbar-subtitle">{APP_INFO.shortName}</div>
                </div>
            </div>

            <div className="topbar-right">
                <div className="clock-chip" title={`Workspace timezone: ${workspaceTimezone}`}>
                    <div className="clock-date">{nowDateLabel}</div>
                    <div className="clock-time">{nowTimeLabel} • {workspaceTimezone}</div>
                    {timezoneMismatch ? <div className="clock-meta">Local: {localTimezone}</div> : null}
                </div>

                <div className="settings-popover-wrap" ref={settingsRef}>
                    <button type="button" className="icon-button" onClick={() => setSettingsOpen((prev) => !prev)} aria-label="Open layout settings">
                        <SlidersHorizontal size={18} />
                    </button>

                    {settingsOpen && (
                        <div className="settings-popover" role="dialog" aria-label="Layout settings">
                            <div className="settings-title-row">
                                <div className="settings-title">Layout Settings</div>
                                <button type="button" className="ghost-button settings-reset" onClick={() => {
                                    resetPreferences();
                                    setSettingsOpen(false);
                                }}>
                                    Reset
                                </button>
                            </div>

                            <div className="settings-section">
                                <div className="settings-label">Theme</div>
                                <div className="segmented-control">
                                    <button type="button" className={`segment ${themeMode === 'light' ? 'active' : ''}`} onClick={() => setThemeMode('light')}>
                                        <Sun size={14} /> Light
                                    </button>
                                    <button type="button" className={`segment ${themeMode === 'dark' ? 'active' : ''}`} onClick={() => setThemeMode('dark')}>
                                        <Moon size={14} /> Dark
                                    </button>
                                </div>
                            </div>

                            <div className="settings-section">
                                <div className="settings-label">Accent</div>
                                <div className="accent-picker" title="Accent color">
                                    {ACCENT_PRESETS.map((color) => (
                                        <button key={color} aria-label={`Set accent ${color}`} className={`accent-dot ${accentColor === color ? 'active' : ''}`} style={{ backgroundColor: color }} onClick={() => setAccentColor(color)} />
                                    ))}
                                </div>
                            </div>

                            <div className="settings-section">
                                <div className="settings-label">Density</div>
                                <div className="segmented-control">
                                    <button type="button" className={`segment ${density === 'comfortable' ? 'active' : ''}`} onClick={() => setDensity('comfortable')}>
                                        Comfortable
                                    </button>
                                    <button type="button" className={`segment ${density === 'compact' ? 'active' : ''}`} onClick={() => setDensity('compact')}>
                                        Compact
                                    </button>
                                </div>
                            </div>

                            <div className="settings-section">
                                <div className="settings-label">Sidebar</div>
                                <button type="button" className="ghost-button" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                                    {sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="user-chip">
                    <div className="user-avatar user-avatar-fallback">{userInitials}</div>
                    <div>
                        <div className="user-name">{user?.firstName || 'Super Admin'}</div>
                        <div className="user-meta">{user?.role || 'Admin'}</div>
                        <div className="user-session-meta">{sessionDurationLabel}</div>
                    </div>
                </div>

                <button type="button" className="logout-button" onClick={onLogout}>Logout</button>
            </div>
        </header>
    );
}
