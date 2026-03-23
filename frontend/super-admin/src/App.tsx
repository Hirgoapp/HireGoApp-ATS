import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import Users from './pages/Users';
import Modules from './pages/Modules';
import Licensing from './pages/Licensing';
import SystemSettings from './pages/SystemSettings';
import Roadmap from './pages/Roadmap';
import Invites from './pages/Invites';
import Login from './pages/Login';

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
                    <Route path="companies" element={<Companies />} />
                    <Route path="companies/:id" element={<CompanyDetail />} />
                    <Route path="users" element={<Users />} />
                    <Route path="invites" element={<Invites />} />
                    <Route path="modules" element={<Modules />} />
                    <Route path="licensing" element={<Licensing />} />
                    <Route path="roadmap" element={<Roadmap />} />
                    <Route path="settings" element={<SystemSettings />} />
                </Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

