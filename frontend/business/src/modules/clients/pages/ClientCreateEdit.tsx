import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import ClientForm from '../components/ClientForm';
import {
    CreateClientPayload,
    createClient,
    getClient,
    updateClient,
} from '../services/clients.api';
import PageHeader from '../../../components/ui/PageHeader';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import StatePanel from '../../../components/ui/StatePanel';

export default function ClientCreateEdit() {
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const permissions = useAuthStore((s) => s.user?.permissions || []);

    const [initial, setInitial] = useState<Partial<CreateClientPayload> | null>(null);
    const [loading, setLoading] = useState(isEdit);

    const hasPermission = (permission: string) =>
        permissions.includes('*') || permissions.includes(permission);

    const canCreate = hasPermission('clients:create');
    const canUpdate = hasPermission('clients:update');

    useEffect(() => {
        if (!isEdit || !id) return;
        if (!canUpdate) return;
        const load = async () => {
            try {
                setLoading(true);
                const c = await getClient(id);
                setInitial({
                    name: c.name,
                    code: c.code,
                    contact_person: c.contact_person,
                    email: c.email,
                    phone: c.phone,
                    address: c.address,
                    city: c.city,
                    state: c.state,
                    country: c.country,
                    postal_code: c.postal_code,
                    website: c.website,
                    industry: c.industry,
                    status: c.status,
                    payment_terms: c.payment_terms,
                    tax_id: c.tax_id,
                    notes: c.notes,
                    is_active: c.is_active,
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
                message="You do not have permission to edit clients."
                tone="danger"
            />
        );
    }

    if (!isEdit && !canCreate) {
        return (
            <StatePanel
                title="Access Denied"
                message="You do not have permission to create clients."
                tone="danger"
            />
        );
    }

    const handleSubmit = async (data: CreateClientPayload) => {
        if (isEdit && id) {
            await updateClient(id, data);
            navigate(`/app/clients/${id}`);
            return;
        }

        const created = await createClient(data);
        navigate(`/app/clients/${created.id}`);
    };

    return (
        <div className="page-stack">
            <PageHeader
                title={isEdit ? 'Edit Client' : 'New Client'}
                subtitle={
                    isEdit
                        ? 'Update client CRM information and contact details.'
                        : 'Add a new recruitment client in HireGoApp CRM.'
                }
                actions={
                    <button
                        onClick={() =>
                            isEdit ? navigate(`/app/clients/${id}`) : navigate('/app/clients')
                        }
                        className="ghost-button"
                        type="button"
                    >
                        Back
                    </button>
                }
            />

            {isEdit && loading ? (
                <StatePanel title="Loading client" message="Fetching client profile..." />
            ) : (
                <SurfaceCard>
                    <ClientForm initial={initial ?? undefined} onSubmit={handleSubmit} />
                </SurfaceCard>
            )}
        </div>
    );
}

