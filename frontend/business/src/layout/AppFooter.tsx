import { APP_INFO } from '../navigation/navigation.config';
import { useWorkspaceStore } from '../stores/workspaceStore';

export default function AppFooter() {
    const branding = useWorkspaceStore((state) => state.branding);

    return (
        <footer className="app-footer">
            <div className="app-footer-left">
                <span>{APP_INFO.version}</span>
                <span className={`env-pill ${APP_INFO.envClass}`}>{APP_INFO.envLabel}</span>
            </div>
            <div className="app-footer-right">
                <span>Support: {branding.supportEmail || APP_INFO.supportEmail}</span>
            </div>
        </footer>
    );
}
