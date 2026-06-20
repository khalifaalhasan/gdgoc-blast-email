import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import CampaignList from './pages/CampaignList';
import CampaignCreate from './pages/CampaignCreate';
import CampaignDetail from './pages/CampaignDetail';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard Routes wrapped in Sidebar Layout */}
        <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
        <Route path="/dashboard/campaign" element={<DashboardLayout><CampaignList /></DashboardLayout>} />
        <Route path="/dashboard/campaign/create" element={<DashboardLayout><CampaignCreate /></DashboardLayout>} />
        
        {/* Campaign Detail is full-screen, so no DashboardLayout */}
        <Route path="/dashboard/campaign/:id" element={<CampaignDetail />} />
      </Routes>
    </Router>
  );
}
