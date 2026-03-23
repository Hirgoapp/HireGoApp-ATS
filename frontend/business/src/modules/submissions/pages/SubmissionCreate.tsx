import { useParams, useNavigate } from 'react-router-dom';
import { createSubmission, CreateSubmissionPayload } from '../services/submissions.api';
import { useAuthStore } from '../../../stores/authStore';
import SubmissionForm from '../components/SubmissionForm';
import PageHeader from '../../../components/ui/PageHeader';
import StatePanel from '../../../components/ui/StatePanel';
import SurfaceCard from '../../../components/ui/SurfaceCard';

export default function SubmissionCreate() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const permissions = useAuthStore((s) => s.user?.permissions || []);

    const hasPermission = (permission: string) => {
        return permissions.includes('*') || permissions.includes(permission);
    };

    const canCreate = hasPermission('submissions:create');

    const handleSubmit = async (data: CreateSubmissionPayload) => {
        const result = await createSubmission(data);
        navigate(`/app/submissions/${result.id}`);
    };

    const handleCancel = () => {
        navigate(`/app/jobs/${jobId}/submissions`);
    };

    if (!canCreate) {
        return (
            <StatePanel
                title="Access Denied"
                message="You do not have permission to create submissions."
                tone="danger"
                action={
                    <button onClick={() => navigate(`/app/jobs/${jobId}/submissions`)} className="ghost-button" type="button">
                        Back to Job Submissions
                    </button>
                }
            />
        );
    }

    if (!jobId || isNaN(Number(jobId))) {
        return (
            <StatePanel
                title="Invalid Job ID"
                message="This submission flow must be opened from a valid job."
                tone="danger"
                action={
                    <button onClick={() => navigate('/app/jobs')} className="ghost-button" type="button">
                        Back to Jobs
                    </button>
                }
            />
        );
    }

    return (
        <div className="page-stack">
            <PageHeader
                title={`Create Submission for Job #${jobId}`}
                subtitle="Fill in the candidate details below."
                actions={
                    <button onClick={() => navigate(`/app/jobs/${jobId}/submissions`)} className="ghost-button" type="button">
                        Back to Job Submissions
                    </button>
                }
            />

            <SurfaceCard>
                <SubmissionForm mode="create" jobId={Number(jobId)} onSubmit={handleSubmit} onCancel={handleCancel} />
            </SurfaceCard>
        </div>
    );
}
