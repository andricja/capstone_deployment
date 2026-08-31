import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Auth
import GoogleCallback from './pages/GoogleCallback';

// Renter pages
import RenterDashboard from './pages/renter/RenterDashboard';
import BrowseEquipment from './pages/renter/BrowseEquipment';
import MyRentals from './pages/renter/MyRentals';
import RenterMessages from './pages/renter/RenterMessages';
import RenterCalendar from './pages/renter/RenterCalendar';

// Owner pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import MyEquipment from './pages/owner/MyEquipment';
import SalesDashboard from './pages/owner/SalesDashboard';


// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRentals from './pages/admin/AdminRentals';
import AdminMessages from './pages/admin/AdminMessages';
import AdminOwners from './pages/admin/AdminOwners';
import ManageAds from './pages/admin/ManageAdsTemp';
import PaymentTracker from './pages/admin/PaymentTracker';
import SalesManagement from './pages/admin/SalesManagement';

// Shared
import AccountSettings from './pages/AccountSettings';
import NotificationSettings from './pages/NotificationSettings';

// Misc
import Unauthorized from './pages/Unauthorized';
import LandingPage from './pages/LandingPage';

export default function App() {
  return (
    <Routes>
      {/* Landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Google OAuth Callback */}
      <Route path="/auth/google/callback" element={<GoogleCallback />} />

      {/* Renter routes */}
      <Route element={<ProtectedRoute allowedRoles={['renter']} />}>
        <Route element={<Layout />}>
          <Route path="/renter/dashboard" element={<RenterDashboard />} />
          <Route path="/renter/browse" element={<BrowseEquipment />} />
          <Route path="/renter/rentals" element={<MyRentals />} />
          <Route path="/renter/calendar" element={<RenterCalendar />} />
          <Route path="/renter/messages" element={<RenterMessages />} />
          <Route path="/renter/settings" element={<AccountSettings />} />
          <Route path="/renter/notifications" element={<NotificationSettings />} />
        </Route>
      </Route>

      {/* Owner routes */}
      <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
        <Route element={<Layout />}>
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/equipment" element={<MyEquipment />} />
          <Route path="/owner/sales" element={<SalesDashboard />} />
          <Route path="/owner/settings" element={<AccountSettings />} />
          <Route path="/owner/notifications" element={<NotificationSettings />} />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<Layout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/owners" element={<AdminOwners />} />
          <Route path="/admin/rentals" element={<AdminRentals />} />
          <Route path="/admin/payments" element={<PaymentTracker />} />
          <Route path="/admin/sales" element={<SalesManagement />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/ads" element={<ManageAds />} />
          <Route path="/admin/settings" element={<AccountSettings />} />
          <Route path="/admin/notifications" element={<NotificationSettings />} />
        </Route>
      </Route>

      {/* Public */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}
