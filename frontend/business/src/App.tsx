import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AppShell from './layout/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import JobsList from './modules/jobs/pages/JobsList';
import JobDetails from './modules/jobs/pages/JobDetails';
import JobCreate from './modules/jobs/pages/JobCreate';
import JobEdit from './modules/jobs/pages/JobEdit';
import RequirementImport from './modules/jobs/pages/RequirementImport';
import RequirementDetails from './modules/jobs/pages/RequirementDetails';
import RequirementVersions from './modules/jobs/pages/RequirementVersions';
import JobSubmissionsList from './modules/submissions/pages/JobSubmissionsList';
import SubmissionsList from './modules/submissions/pages/SubmissionsList';
import SubmissionDetails from './modules/submissions/pages/SubmissionDetails';
import SubmissionCreate from './modules/submissions/pages/SubmissionCreate';
import SubmissionEdit from './modules/submissions/pages/SubmissionEdit';
import SubmissionInterviewsList from './modules/interviews/pages/SubmissionInterviewsList';
import InterviewCreate from './modules/interviews/pages/InterviewCreate';
import InterviewDetails from './modules/interviews/pages/InterviewDetails';
import SubmissionOffersList from './modules/offers/pages/SubmissionOffersList';
import OfferCreate from './modules/offers/pages/OfferCreate';
import OfferDetails from './modules/offers/pages/OfferDetails';
import CandidatesList from './modules/candidates/pages/CandidatesList';
import CandidateDetails from './modules/candidates/pages/CandidateDetails';
import CandidateCreateEdit from './modules/candidates/pages/CandidateCreateEdit';
import ClientsList from './modules/clients/pages/ClientsList';
import ClientDetails from './modules/clients/pages/ClientDetails';
import ClientCreateEdit from './modules/clients/pages/ClientCreateEdit';
import InterviewsList from './modules/interviews/pages/InterviewsList';
import OffersList from './modules/offers/pages/OffersList';
import CompanySettings from './pages/modules/CompanySettings';
import AccessControl from './pages/modules/AccessControl';
import SettingsHub from './pages/modules/SettingsHub';
import UsersSettings from './pages/modules/settings/UsersSettings';
import RolesSettings from './pages/modules/settings/RolesSettings';
import PermissionsSettings from './pages/modules/settings/PermissionsSettings';
import PermissionsHelp from './pages/modules/settings/PermissionsHelp';
import ReportsWorkspace from './pages/modules/operations/ReportsWorkspace';
import DocumentsWorkspace from './pages/modules/operations/DocumentsWorkspace';
import PipelinesSettings from './pages/modules/settings/PipelinesSettings';
import ApiKeysSettings from './pages/modules/settings/ApiKeysSettings';
import WebhooksSettings from './pages/modules/settings/WebhooksSettings';
import IntegrationsSettings from './pages/modules/settings/IntegrationsSettings';
import SkillsSettings from './pages/modules/settings/SkillsSettings';
import SkillCategoriesSettings from './pages/modules/settings/SkillCategoriesSettings';
import EducationLevelsSettings from './pages/modules/settings/EducationLevelsSettings';
import ExperienceTypesSettings from './pages/modules/settings/ExperienceTypesSettings';
import QualificationsSettings from './pages/modules/settings/QualificationsSettings';
import ActivityExplorer from './pages/ActivityExplorer';
import AuditLogExplorer from './pages/AuditLogExplorer';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate to="/login" replace />} />

                <Route
                    path="/app"
                    element={
                        <ProtectedRoute>
                            <AppShell />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="clients" element={<ClientsList />} />
                    <Route path="clients/create" element={<ClientCreateEdit />} />
                    <Route path="clients/:id" element={<ClientDetails />} />
                    <Route path="clients/:id/edit" element={<ClientCreateEdit />} />
                    <Route path="candidates" element={<CandidatesList />} />
                    <Route path="candidates/create" element={<CandidateCreateEdit />} />
                    <Route path="candidates/:id" element={<CandidateDetails />} />
                    <Route path="candidates/:id/edit" element={<CandidateCreateEdit />} />
                    <Route path="jobs" element={<JobsList />} />
                    <Route path="submissions" element={<SubmissionsList />} />
                    <Route path="interviews" element={<InterviewsList />} />
                    <Route path="offers" element={<OffersList />} />
                    <Route path="reports" element={<ReportsWorkspace />} />
                    <Route path="documents" element={<DocumentsWorkspace />} />
                    <Route path="activity" element={<ActivityExplorer />} />
                    <Route path="audit" element={<AuditLogExplorer />} />
                    <Route path="admin" element={<Navigate to="admin/settings/company" replace />} />
                    <Route path="admin/settings" element={<SettingsHub />}>
                        <Route index element={<Navigate to="company" replace />} />
                        <Route path="company" element={<CompanySettings />} />
                        <Route path="users" element={<UsersSettings />} />
                        <Route path="roles" element={<RolesSettings />} />
                        <Route path="permissions" element={<PermissionsSettings />} />
                        <Route path="permissions/help" element={<PermissionsHelp />} />
                        <Route path="pipelines" element={<PipelinesSettings />} />
                        <Route path="api-keys" element={<ApiKeysSettings />} />
                        <Route path="webhooks" element={<WebhooksSettings />} />
                        <Route path="integrations" element={<IntegrationsSettings />} />
                        <Route path="skills" element={<SkillsSettings />} />
                        <Route path="skill-categories" element={<SkillCategoriesSettings />} />
                        <Route path="education-levels" element={<EducationLevelsSettings />} />
                        <Route path="audit" element={<AuditLogExplorer />} />
                        <Route path="experience-types" element={<ExperienceTypesSettings />} />
                        <Route path="qualifications" element={<QualificationsSettings />} />
                    </Route>
                    {/* Backward compatibility */}
                    <Route path="admin/access" element={<Navigate to="admin/settings/permissions" replace />} />
                    <Route path="jobs/create" element={<JobCreate />} />
                    <Route path="jobs/:id" element={<JobDetails />} />
                    <Route path="jobs/:id/edit" element={<JobEdit />} />
                    <Route path="jobs/:id/submissions" element={<JobSubmissionsList />} />
                    <Route path="jobs/:jobId/submissions/create" element={<SubmissionCreate />} />
                    {/* Requirements (Email-driven) */}
                    <Route path="requirements/import" element={<RequirementImport />} />
                    <Route path="requirements/:jobId" element={<RequirementDetails />} />
                    <Route path="requirements/client/:clientReqId/versions" element={<RequirementVersions />} />
                    <Route path="submissions/:id" element={<SubmissionDetails />} />
                    <Route path="submissions/:id/edit" element={<SubmissionEdit />} />
                    <Route path="submissions/:id/interviews" element={<SubmissionInterviewsList />} />
                    <Route path="submissions/:id/interviews/create" element={<InterviewCreate />} />
                    <Route path="interviews/:id" element={<InterviewDetails />} />
                    <Route path="submissions/:id/offers" element={<SubmissionOffersList />} />
                    <Route path="submissions/:id/offers/create" element={<OfferCreate />} />
                    <Route path="offers/:id" element={<OfferDetails />} />
                </Route>

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
