import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import Pipelines from './pages/Pipelines';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import TaskTemplates from './pages/TaskTemplates';
import ContractTemplates from './pages/ContractTemplates';
import Organisations from './pages/Organisations';
import Users from './pages/Users';
import Sign from './pages/Sign';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return !token ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
      <Route path="/sign/:token" element={<Sign />} />

      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index                    element={<Dashboard />} />
        <Route path="pipelines"         element={<Pipelines />} />
        <Route path="leads"             element={<Leads />} />
        <Route path="leads/:id"         element={<LeadDetail />} />
        <Route path="task-templates"      element={<TaskTemplates />} />
        <Route path="contract-templates" element={<ContractTemplates />} />
        <Route path="organisations"     element={<Organisations />} />
        <Route path="users"             element={<Users />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
