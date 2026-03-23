import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createJob, CreateJobPayload, uploadJdFile } from '../services/jobs.api';
import { useAuthStore } from '../../../stores/authStore';
import { getClient } from '../../clients/services/clients.api';
import JobForm from '../components/JobForm';
import JobParseForm from '../../../components/jobs/JobParseForm';
import PageHeader from '../../../components/ui/PageHeader';
import StatePanel from '../../../components/ui/StatePanel';
import SurfaceCard from '../../../components/ui/SurfaceCard';

export default function JobCreate() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const clientIdFromUrl = searchParams.get('clientId') || undefined;
    const permissions = useAuthStore((s) => s.user?.permissions || []);
    const [useSmartParse, setUseSmartParse] = useState(false);
    const [clientName, setClientName] = useState<string | null>(null);

    useEffect(() => {
        if (!clientIdFromUrl) {
            setClientName(null);
            return;
        }
        getClient(clientIdFromUrl)
            .then((c) => setClientName(c.name))
            .catch(() => setClientName(null));
    }, [clientIdFromUrl]);

    const hasPermission = (permission: string) => {
        return permissions.includes('*') || permissions.includes(permission);
    };

    const canCreate = hasPermission('jobs:create');

    const handleSubmit = async (data: CreateJobPayload, file?: File) => {
        try {
            const response = await createJob(data);
            const jobId = response.id;

            if (file) {
                console.log('📁 Uploading JD file...');
                try {
                    await uploadJdFile(jobId, file);
                    console.log('✅ File uploaded successfully');
                } catch (uploadError) {
                    console.error('⚠️ File upload failed, but job was created:', uploadError);
                }
            }

            navigate('/app/jobs');
        } catch (error) {
            throw error;
        }
    };

    const handleCancel = () => {
        navigate('/app/jobs');
    };

    if (!canCreate) {
        return (
            <StatePanel
                title="Access Denied"
                message="You do not have permission to create jobs."
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
            {useSmartParse ? (
                <JobParseForm
                    onJobCreated={() => {
                        setUseSmartParse(false);
                        navigate('/app/jobs');
                    }}
                    onClose={() => setUseSmartParse(false)}
                />
            ) : (
                <>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <button
                            onClick={() => navigate('/app/jobs')}
                            className="ghost-button"
                            type="button"
                        >
                            Back to Jobs
                        </button>
                        <button
                            onClick={() => setUseSmartParse(true)}
                            className="primary-button"
                            type="button"
                        >
                            Smart Parser
                        </button>
                    </div>

                    <PageHeader title="Create New Job" subtitle="Add a new job opening to your system." />

                    <SurfaceCard>
                        <JobForm
                            mode="create"
                            initialData={clientIdFromUrl ? { client_id: clientIdFromUrl } : undefined}
                            clientId={clientIdFromUrl}
                            clientName={clientName ?? undefined}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                        />
                    </SurfaceCard>
                </>
            )}
        </div>
    );
}
