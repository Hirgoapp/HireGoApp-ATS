import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import SurfaceCard from '../../components/ui/SurfaceCard';

export default function SubmissionsHub() {
    const navigate = useNavigate();

    return (
        <div className="page-stack">
            <PageHeader
                title="Submissions"
                subtitle="Submission workflows are available within each job."
                actions={
                    <button className="primary-button" onClick={() => navigate('/app/jobs')} type="button">
                        Open Jobs
                    </button>
                }
            />

            <SurfaceCard>
                <h2 className="block-title">How to Access</h2>
                <div className="state-message">
                    Open any job and use the submissions flow from that job context.
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="ghost-button" onClick={() => navigate('/app/jobs')} type="button">
                        Browse Jobs
                    </button>
                    <button className="ghost-button" onClick={() => navigate('/app/requirements/import')} type="button">
                        Import Requirement
                    </button>
                </div>
            </SurfaceCard>
        </div>
    );
}
