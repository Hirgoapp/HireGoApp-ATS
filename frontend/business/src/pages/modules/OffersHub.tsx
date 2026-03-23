import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import SurfaceCard from '../../components/ui/SurfaceCard';

export default function OffersHub() {
    const navigate = useNavigate();

    return (
        <div className="page-stack">
            <PageHeader
                title="Offers"
                subtitle="Offer lifecycle is available from each submission context."
                actions={
                    <button className="primary-button" onClick={() => navigate('/app/submissions')} type="button">
                        Open Submissions
                    </button>
                }
            />

            <SurfaceCard>
                <h2 className="block-title">Offer Workflow</h2>
                <div className="state-message">
                    Select a submission and continue to offers to create, issue, and track outcomes.
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="ghost-button" onClick={() => navigate('/app/jobs')} type="button">
                        Browse Jobs
                    </button>
                    <button className="ghost-button" onClick={() => navigate('/app/submissions')} type="button">
                        Submission Hub
                    </button>
                </div>
            </SurfaceCard>
        </div>
    );
}
