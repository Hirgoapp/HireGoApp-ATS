import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import SurfaceCard from '../../components/ui/SurfaceCard';

export default function InterviewsHub() {
    const navigate = useNavigate();

    return (
        <div className="page-stack">
            <PageHeader
                title="Interviews"
                subtitle="Interviews are managed from each submission record."
                actions={
                    <button className="primary-button" onClick={() => navigate('/app/submissions')} type="button">
                        Open Submissions
                    </button>
                }
            />

            <SurfaceCard>
                <h2 className="block-title">Workflow Entry</h2>
                <div className="state-message">
                    Start from a job submission and then open interviews for that submission.
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
