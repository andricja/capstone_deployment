import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Renter pages
import RenterDashboard from './pages/renter/RenterDashboard';
import BrowseEquipment from './pages/renter/BrowseEquipment';
import MyRentals from './pages/renter/MyRentals';
import RenterMessages from './pages/renter/RenterMessages';

// Owner pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import MyEquipment from './pages/owner/MyEquipment';
import OwnerRentals from './pages/owner/OwnerRentals';


// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEquipment from './pages/admin/AdminEquipment';
import AdminRentals from './pages/admin/AdminRentals';
import AdminMessages from './pages/admin/AdminMessages';
import AdminReports from './pages/admin/AdminReports';
import AdminOwners from './pages/admin/AdminOwners';
import AdminAccounts from './pages/admin/AdminAccounts';
import ManageAds from './pages/admin/ManageAdsTemp';

// Shared
import AccountSettings from './pages/AccountSettings';

// Misc
import Unauthorized from './pages/Unauthorized';
import LandingPage from './pages/LandingPage';

export default function App() {
  return (
    <Routes>
      {/* Landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Renter routes */}
      <Route element={<ProtectedRoute allowedRoles={['renter']} />}>
        <Route element={<Layout />}>
          <Route path="/renter/dashboard" element={<RenterDashboard />} />
          <Route path="/renter/browse" element={<BrowseEquipment />} />
          <Route path="/renter/rentals" element={<MyRentals />} />
          <Route path="/renter/messages" element={<RenterMessages />} />
          <Route path="/renter/settings" element={<AccountSettings />} />
        </Route>
      </Route>

      {/* Owner routes */}
      <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
        <Route element={<Layout />}>
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/equipment" element={<MyEquipment />} />
          <Route path="/owner/rentals" element={<OwnerRentals />} />
          <Route path="/owner/settings" element={<AccountSettings />} />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<Layout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/owners" element={<AdminOwners />} />
          <Route path="/admin/equipment" element={<AdminEquipment />} />
          <Route path="/admin/rentals" element={<AdminRentals />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/accounts" element={<AdminAccounts />} />
          <Route path="/admin/ads" element={<ManageAds />} />
          <Route path="/admin/settings" element={<AccountSettings />} />
        </Route>
      </Route>

      {/* Public */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}
