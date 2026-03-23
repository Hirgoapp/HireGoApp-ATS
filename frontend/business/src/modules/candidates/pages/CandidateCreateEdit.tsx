import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import CandidateForm from '../components/CandidateForm';
import {
    CreateCandidatePayload,
    createCandidate,
    getCandidate,
    updateCandidate,
} from '../services/candidates.api';
import PageHeader from '../../../components/ui/PageHeader';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import StatePanel from '../../../components/ui/StatePanel';

export default function CandidateCreateEdit() {
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const permissions = useAuthStore((s) => s.user?.permissions || []);

    const [initial, setInitial] = useState<Partial<CreateCandidatePayload> | null>(null);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);

    const hasPermission = (permission: string) =>
        permissions.includes('*') || permissions.includes(permission);

    const canCreate = hasPermission('candidates:create');
    const canUpdate = hasPermission('candidates:update');

    useEffect(() => {
        if (!isEdit || !id) return;
        if (!canUpdate) return;
        const load = async () => {
            try {
                setLoading(true);
                const c = await getCandidate(id);
                setInitial({
                    candidate_name: c.candidate_name,
                    email: c.email,
                    phone: c.phone,
                    total_experience: c.total_experience,
                    relevant_experience: c.relevant_experience,
                    current_company: c.current_company,
                    notice_period: c.notice_period as any,
                    skill_set: c.skill_set as any,
                    location_preference: c.location_preference as any,
                    candidate_status: c.candidate_status as any,
                    notes: c.notes as any,
                });
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isEdit, canUpdate]);

    if (isEdit && !canUpdate) {
        return (
            <StatePanel
                title="Access Denied"
                message="You do not have permission to edit candidates."
                tone="danger"
            />
        );
    }

    if (!isEdit && !canCreate) {
        return (
            <StatePanel
                title="Access Denied"
                message="You do not have permission to create candidates."
                tone="danger"
            />
        );
    }

    const handleSubmit = async (data: CreateCandidatePayload) => {
        try {
            setSaving(true);
            if (isEdit && id) {
                await updateCandidate(id, data);
                navigate(`/app/candidates/${id}`);
                return;
            }

            const created = await createCandidate(data);
            navigate(`/app/candidates/${created.id}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-stack">
            <PageHeader
                title={isEdit ? 'Edit Candidate' : 'New Candidate'}
                subtitle={
                    isEdit
                        ? 'Update candidate profile and contact information.'
                        : 'Create a new candidate profile in HireGoApp.'
                }
                actions={
                    <button
                        onClick={() =>
                            isEdit ? navigate(`/app/candidates/${id}`) : navigate('/app/candidates')
                        }
                        className="ghost-button"
                        type="button"
                    >
                        Back to candidates
                    </button>
                }
            />

            {isEdit && loading ? (
                <StatePanel title="Loading candidate" message="Fetching candidate profile..." />
            ) : (
                <SurfaceCard>
                    <CandidateForm initial={initial ?? undefined} onSubmit={handleSubmit} loading={saving} />
                </SurfaceCard>
            )}
        </div>
    );
}

