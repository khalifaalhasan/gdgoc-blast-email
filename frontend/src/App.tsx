import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import CampaignList from "./pages/CampaignList";
import CampaignCreate from "./pages/CampaignCreate";
import CampaignOverview from "./pages/CampaignOverview";
import CampaignDetail from "./pages/CampaignDetail";
import Login from "./pages/Login";
import AuthGuard from "./components/AuthGuard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard Routes wrapped in AuthGuard and Sidebar Layout */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard/campaign"
          element={
            <AuthGuard>
              <DashboardLayout>
                <CampaignList />
              </DashboardLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard/campaign/create"
          element={
            <AuthGuard>
              <DashboardLayout>
                <CampaignCreate />
              </DashboardLayout>
            </AuthGuard>
          }
        />

        {/* Campaign Overview */}
        <Route
          path="/dashboard/campaign/:id"
          element={
            <AuthGuard>
              <CampaignOverview />
            </AuthGuard>
          }
        />

        {/* Campaign Detail (Edit/Setup) is full-screen, so no DashboardLayout, but still guarded */}
        <Route
          path="/dashboard/campaign/:id/edit"
          element={
            <AuthGuard>
              <CampaignDetail />
            </AuthGuard>
          }
        />
      </Routes>
    </Router>
  );
}
