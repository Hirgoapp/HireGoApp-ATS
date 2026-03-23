import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobById, updateJob, UpdateJobPayload, JobDetail } from '../services/jobs.api';
import { useAuthStore } from '../../../stores/authStore';
import JobForm from '../components/JobForm';
import PageHeader from '../../../components/ui/PageHeader';
import StatePanel from '../../../components/ui/StatePanel';
import SurfaceCard from '../../../components/ui/SurfaceCard';

export default function JobEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const permissions = useAuthStore((s) => s.user?.permissions || []);

    const [job, setJob] = useState<JobDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const hasPermission = (permission: string) => {
        return permissions.includes('*') || permissions.includes(permission);
    };

    const canUpdate = hasPermission('jobs:update');

    useEffect(() => {
        if (!canUpdate) {
            return;
        }

        const loadJob = async () => {
            if (!id) {
                setError('Invalid job ID');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const data = await getJobById(id);
                setJob(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load job');
                setJob(null);
            } finally {
                setLoading(false);
            }
        };

        loadJob();
    }, [id, canUpdate]);

    const handleSubmit = async (data: UpdateJobPayload) => {
        if (!id) return;
        await updateJob(id, data);
        navigate('/app/jobs');
    };

    const handleCancel = () => {
        navigate('/app/jobs');
    };

    if (!canUpdate) {
        return (
            <StatePanel
                title="Access Denied"
                message="You do not have permission to edit jobs."
                tone="danger"
                action={
                    <button onClick={() => navigate('/app/jobs')} className="ghost-button" type="button">
                        Back to Jobs
                    </button>
                }
            />
        );
    }

    if (loading) {
        return (
            <StatePanel title="Loading job" message="Fetching job details..." />
        );
    }

    if (error || !job) {
        return (
            <StatePanel
                title="Job not found"
                message={error || 'Job not found'}
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
                title="Edit Job"
                subtitle="Update job information and details."
                actions={
                    <button onClick={() => navigate('/app/jobs')} className="ghost-button" type="button">
                        Back to Jobs
                    </button>
                }
            />

            <SurfaceCard>
                <JobForm mode="edit" initialData={job} onSubmit={handleSubmit} onCancel={handleCancel} />
            </SurfaceCard>
        </div>
    );
}
