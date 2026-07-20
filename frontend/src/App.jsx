import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import useAuth from "./hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import InventoryManagement from "./pages/InventoryManagement";
import Login from "./pages/Login";
import RaiseTicketForm from "./pages/RaiseTicketForm";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import TicketsList from "./pages/TicketsList";
import UsersManagement from "./pages/UsersManagement";

export default function App() {
  const auth = useAuth();

  if (!auth.isAuthenticated) {
    return <Login onLogin={auth.login} />;
  }

  return (
    <ProtectedRoute isAuthenticated={auth.isAuthenticated}>
      <Layout onLogout={auth.logout} user={auth.user}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UsersManagement />} />
          <Route path="/inventory" element={<InventoryManagement />} />
          <Route path="/tickets" element={<TicketsList />} />
          <Route path="/raise-ticket" element={<RaiseTicketForm />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ProtectedRoute>
  );
}
