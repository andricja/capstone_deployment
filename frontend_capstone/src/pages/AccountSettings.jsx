import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { Settings, User, Lock, Eye, EyeOff, Save, Mail, Send, Server, Wallet, Archive, RotateCcw, Trash2, Users, FileText, Clock, ShieldCheck, ShieldX, X, UserCheck, UserX, Activity, Search, Filter } from 'lucide-react';
import { FormSkeleton, TableSkeleton } from '../components/Skeleton';
import api from '../lib/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';

const TABS = {
  profile: { label: 'Profile', icon: User },
  password: { label: 'Password', icon: Lock },
  gcash: { label: 'GCash Settings', icon: Wallet, ownerOnly: true },
  archive: { label: 'Archive', icon: Archive },
  accounts: { label: 'Accounts', icon: Users, adminOnly: true },
  auditTrail: { label: 'Audit Trail', icon: FileText, adminOnly: true },
  email: { label: 'Email Settings', icon: Server, adminOnly: true },
};

export default function AccountSettings() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  const visibleTabs = Object.entries(TABS).filter(
    ([, t]) => {
      if (t.adminOnly) return user?.role === 'admin';
      if (t.ownerOnly) return user?.role === 'owner';
      return true;
    }
  );

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // SMTP form (admin only)
  const [smtpForm, setSmtpForm] = useState({
    mail_host: 'smtp.gmail.com',
    mail_port: 587,
    mail_username: '',
    mail_password: '',
    mail_encryption: 'tls',
    mail_from_address: '',
    mail_from_name: 'FERMs',
  });
  const [hasSmtpPassword, setHasSmtpPassword] = useState(false);
  const [smtpLoading, setSmtpLoading] = useState(true);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // GCash form (owner only)
  const [gcashSetting, setGcashSetting] = useState(null);
  const [gcashForm, setGcashForm] = useState({ account_name: '', account_number: '', qr_code_image: null });
  const [gcashLoading, setGcashLoading] = useState(true);
  const [gcashSaving, setGcashSaving] = useState(false);

  // Accounts Management (admin only)
  const [accountsData, setAccountsData] = useState([]);
  const [accountsStats, setAccountsStats] = useState(null);
  const [accountsFilter, setAccountsFilter] = useState('email_verified');
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Audit Trail (admin only)
  const [auditTab, setAuditTab] = useState('audit');
  const [logs, setLogs] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [auditStats, setAuditStats] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilters, setAuditFilters] = useState({
    action: '',
    date_from: '',
    date_to: '',
    search: '',
  });

  // Load GCash settings for owner
  useEffect(() => {
    if (user?.role !== 'owner') {
      setGcashLoading(false);
      return;
    }
    api.get('/owner/gcash-settings')
      .then((r) => {
        setGcashSetting(r.data);
        setGcashForm({ account_name: r.data.account_name, account_number: r.data.account_number, qr_code_image: null });
      })
      .catch(() => { /* no settings yet */ })
      .finally(() => setGcashLoading(false));
  }, [user?.role]);

  const handleGcashSave = async (e) => {
    e.preventDefault();
    setGcashSaving(true);
    try {
      const fd = new FormData();
      fd.append('account_name', gcashForm.account_name);
      fd.append('account_number', gcashForm.account_number);
      if (gcashForm.qr_code_image) fd.append('qr_code_image', gcashForm.qr_code_image);
      const res = await api.post('/owner/gcash-settings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setGcashSetting(res.data.setting);
      toast.success('GCash settings saved successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save GCash settings.');
    } finally {
      setGcashSaving(false);
    }
  };

  // Load SMTP settings for admin
  useEffect(() => {
    if (user?.role !== 'admin') {
      setSmtpLoading(false);
      return;
    }
    api.get('/admin/smtp-settings')
      .then((r) => {
        if (r.data) {
          setSmtpForm((prev) => ({
            ...prev,
            mail_host: r.data.mail_host || prev.mail_host,
            mail_port: r.data.mail_port || prev.mail_port,
            mail_username: r.data.mail_username || '',
            mail_encryption: r.data.mail_encryption || prev.mail_encryption,
            mail_from_address: r.data.mail_from_address || '',
            mail_from_name: r.data.mail_from_name || prev.mail_from_name,
          }));
          setHasSmtpPassword(r.data.has_password);
          setLastUpdated(r.data.updated_at);
        }
      })
      .finally(() => setSmtpLoading(false));
  }, [user?.role]);

  // Archive state
  const [archiveData, setArchiveData] = useState({ owners: [], equipment: [], rentals: [], messages: [] });
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveLoaded, setArchiveLoaded] = useState(false);

  const loadArchive = async () => {
    setArchiveLoading(true);
    try {
      const role = user?.role;
      if (role === 'admin') {
        const res = await api.get('/admin/archived/all');
        setArchiveData(res.data);
      } else if (role === 'owner') {
        const [eqRes, rentalRes] = await Promise.all([
          api.get('/owner/archived/equipment'),
          api.get('/owner/archived/rentals'),
        ]);
        setArchiveData({ owners: [], equipment: eqRes.data, rentals: rentalRes.data, messages: [] });
      } else if (role === 'renter') {
        const [rentalRes, msgRes] = await Promise.all([
          api.get('/renter/archived/rentals'),
          api.get('/renter/archived/messages'),
        ]);
        setArchiveData({ owners: [], equipment: [], rentals: rentalRes.data, messages: msgRes.data });
      }
      setArchiveLoaded(true);
    } catch { /* ignore */ }
    finally { setArchiveLoading(false); }
  };

  // Load archive when tab is activated
  useEffect(() => {
    if (activeTab === 'archive' && !archiveLoaded) loadArchive();
  }, [activeTab]);

  const handleRestore = async (type, id) => {
    const role = user?.role;
    const prefix = role === 'admin' ? '/admin' : role === 'owner' ? '/owner' : '/renter';
    try {
      await api.patch(`${prefix}/archived/${type}/${id}`);
      toast.success('Item restored successfully.');
      loadArchive();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore.');
    }
  };

  const handlePermanentDelete = async (type, id) => {
    if (!window.confirm('This will permanently delete this item. Are you sure?')) return;
    const role = user?.role;
    const prefix = role === 'admin' ? '/admin' : role === 'owner' ? '/owner' : '/renter';
    try {
      await api.delete(`${prefix}/archived/${type}/${id}`);
      toast.success('Item permanently deleted.');
      loadArchive();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await api.put('/profile', { name, email });
      toast.success(res.data.message || 'Profile updated successfully.');
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await api.put('/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      toast.success(res.data.message || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSmtpChange = (e) => {
    const { name, value } = e.target;
    setSmtpForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSmtpSave = async (e) => {
    e.preventDefault();
    setSmtpSaving(true);
    try {
      const res = await api.post('/admin/smtp-settings', smtpForm);
      toast.success(res.data.message);
      setHasSmtpPassword(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save SMTP settings.');
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleSmtpTest = async () => {
    if (!testEmail) {
      toast.error('Enter a test email address first.');
      return;
    }
    setSmtpTesting(true);
    try {
      const res = await api.post('/admin/smtp-settings/test', { test_email: testEmail });
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test failed.');
    } finally {
      setSmtpTesting(false);
    }
  };

  // ======================== ACCOUNTS MANAGEMENT ========================
  const fetchAccounts = (f = accountsFilter) => {
    setAccountsLoading(true);
    api.get('/admin/accounts', { params: { status: f, all: 1 } })
      .then((r) => setAccountsData(Array.isArray(r.data) ? r.data : r.data?.data ?? []))
      .finally(() => setAccountsLoading(false));
  };

  const fetchAccountsStats = () => {
    api.get('/admin/accounts/stats').then((r) => setAccountsStats(r.data));
  };

  useEffect(() => {
    if (activeTab === 'accounts' && user?.role === 'admin') {
      fetchAccounts(accountsFilter);
      fetchAccountsStats();
    }
  }, [activeTab, accountsFilter, user?.role]);

  const handleApprove = async (id, e) => {
    e?.stopPropagation();
    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/accounts/${id}/approve`);
      toast.success(res.data.message);
      fetchAccounts(accountsFilter);
      fetchAccountsStats();
      if (selectedAccount?.id === id) setSelectedAccount(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve.');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (user, e) => {
    e?.stopPropagation();
    setRejectModal(user);
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/accounts/${rejectModal.id}/reject`, { reason: rejectReason });
      toast.success(res.data.message);
      fetchAccounts(accountsFilter);
      fetchAccountsStats();
      setRejectModal(null);
      if (selectedAccount?.id === rejectModal.id) setSelectedAccount(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = async (id, e) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this account? This action cannot be undone.')) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/admin/accounts/${id}`);
      toast.success(res.data.message);
      fetchAccounts(accountsFilter);
      fetchAccountsStats();
      if (selectedAccount?.id === id) setSelectedAccount(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account.');
    } finally {
      setActionLoading(false);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'email_verified': return 'bg-blue-100 text-blue-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending Verification';
      case 'email_verified': return 'Awaiting Approval';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  // ======================== AUDIT TRAIL ========================
  const fetchAuditStats = async () => {
    try {
      const response = await api.get('/admin/audit-logs/stats');
      setAuditStats(response.data);
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
    }
  };

  const fetchAuditLogs = async (page = 1) => {
    setAuditLoading(true);
    try {
      const response = await api.get('/admin/audit-logs', {
        params: { ...auditFilters, page },
      });
      setLogs(response.data);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setAuditLoading(false);
    }
  };

  const fetchSessions = async (page = 1) => {
    setAuditLoading(true);
    try {
      const response = await api.get('/admin/audit-logs/sessions', {
        params: { page },
      });
      setSessions(response.data);
    } catch (error) {
      toast.error('Failed to load session logs');
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'auditTrail' && user?.role === 'admin') {
      fetchAuditStats();
    }
  }, [activeTab, user?.role]);

  useEffect(() => {
    if (activeTab === 'auditTrail' && user?.role === 'admin') {
      if (auditTab === 'audit') {
        fetchAuditLogs();
      } else {
        fetchSessions();
      }
    }
  }, [activeTab, auditTab, auditFilters, user?.role]);

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionBadge = (action) => {
    const colors = {
      create: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      update: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      delete: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      login: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      logout: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      approve: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      reject: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      status_change: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    };
    return colors[action] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  const parseUserAgent = (userAgent) => {
    if (!userAgent) return 'Unknown Device';
    let browser = 'Unknown Browser';
    if (userAgent.includes('Edg/')) browser = 'Edge';
    else if (userAgent.includes('Chrome/')) browser = 'Chrome';
    else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Firefox/')) browser = 'Firefox';
    else if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) browser = 'Opera';
    let device = 'Unknown OS';
    if (userAgent.includes('Windows NT 10.0')) device = 'Windows 10';
    else if (userAgent.includes('Windows NT 11.0')) device = 'Windows 11';
    else if (userAgent.includes('Windows NT 6.3')) device = 'Windows 8.1';
    else if (userAgent.includes('Windows NT 6.2')) device = 'Windows 8';
    else if (userAgent.includes('Windows NT 6.1')) device = 'Windows 7';
    else if (userAgent.includes('Mac OS X')) device = 'macOS';
    else if (userAgent.includes('iPhone')) device = 'iPhone';
    else if (userAgent.includes('iPad')) device = 'iPad';
    else if (userAgent.includes('Android')) device = 'Android';
    else if (userAgent.includes('Linux')) device = 'Linux';
    return `${browser} on ${device}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="w-7 h-7 text-green-600 dark:text-green-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {visibleTabs.map(([key, tab]) => {
          const Icon = tab.icon;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
                activeTab === key
                  ? 'bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 transition-colors">
          <div className="flex items-center gap-2 px-6 py-4 border-b dark:border-gray-700">
            <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>
          </div>
          <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200 transition-colors"
                required
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="inline-block px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md text-xs font-medium capitalize">
                {user?.role}
              </span>
              <span>account</span>
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 transition-colors">
          <div className="flex items-center gap-2 px-6 py-4 border-b dark:border-gray-700">
            <Lock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h2>
          </div>
          <form onSubmit={handlePasswordUpdate} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200 transition-colors"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200 transition-colors"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GCash Settings Tab (owner only) */}
      {activeTab === 'gcash' && user?.role === 'owner' && (
        <div className="max-w-xl space-y-6">
          {gcashLoading ? (
            <FormSkeleton fields={4} />
          ) : (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
                <p>These details will be shown to renters when they pay via GCash. Payments go directly to your GCash account.</p>
              </div>

              <form onSubmit={handleGcashSave} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-6 space-y-5 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">GCash Payment Details</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GCash Account Name</label>
                  <input
                    type="text"
                    required
                    value={gcashForm.account_name}
                    onChange={(e) => setGcashForm({ ...gcashForm, account_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200 transition-colors"
                    placeholder="e.g. Juan Cruz"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GCash Account Number</label>
                  <input
                    type="text"
                    required
                    value={gcashForm.account_number}
                    onChange={(e) => setGcashForm({ ...gcashForm, account_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200 transition-colors"
                    placeholder="e.g. 09123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">QR Code Image</label>
                  {gcashSetting?.qr_code_image && (
                    <div className="mb-2">
                      <img src={`/storage/${gcashSetting.qr_code_image}`} alt="Current QR" className="w-40 h-40 object-contain border dark:border-gray-600 rounded-lg" />
                      <p className="text-xs text-gray-400 mt-1">Current QR code</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setGcashForm({ ...gcashForm, qr_code_image: e.target.files[0] })}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={gcashSaving}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-2.5 rounded-lg font-medium hover:from-green-700 hover:to-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {gcashSaving ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save GCash Settings</>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Archive Tab (all roles) */}
      {activeTab === 'archive' && (
        <div className="space-y-6">
          {archiveLoading ? (
            <FormSkeleton fields={5} />
          ) : (
            <>
              {/* Info banner */}
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
                <p>Archived items are hidden from your main views. You can restore or permanently delete them here.</p>
              </div>

              {/* Admin: Archived Owners */}
              {user?.role === 'admin' && (
                <ArchiveSection title="Owners" empty="No archived owners.">
                  {archiveData.owners.map((o) => (
                    <ArchiveRow key={`owner-${o.id}`} onRestore={() => handleRestore('owners', o.id)} onDelete={() => handlePermanentDelete('owners', o.id)}>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{o.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{o.email}</p>
                      </div>
                      <ArchivedDate date={o.archived_at} />
                    </ArchiveRow>
                  ))}
                </ArchiveSection>
              )}

              {/* Admin + Owner: Archived Equipment */}
              {(user?.role === 'admin' || user?.role === 'owner') && (
                <ArchiveSection title="Equipment" empty="No archived equipment.">
                  {archiveData.equipment.map((eq) => (
                    <ArchiveRow key={`eq-${eq.id}`} onRestore={() => handleRestore('equipment', eq.id)} onDelete={() => handlePermanentDelete('equipment', eq.id)}>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{eq.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{eq.category} • ₱{Number(eq.daily_rate).toLocaleString()}/day{user?.role === 'admin' && eq.owner ? ` • ${eq.owner.name}` : ''}</p>
                      </div>
                      <ArchivedDate date={eq.archived_at} />
                    </ArchiveRow>
                  ))}
                </ArchiveSection>
              )}

              {/* All roles: Archived Rentals */}
              <ArchiveSection title="Rental Requests" empty="No archived rental requests.">
                {archiveData.rentals.map((r) => (
                  <ArchiveRow key={`rental-${r.id}`} onRestore={() => handleRestore('rentals', r.id)} onDelete={() => handlePermanentDelete('rentals', r.id)}>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{r.equipment?.name || 'Equipment'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.role === 'renter' ? '' : `${r.renter?.name || 'Renter'} • `}
                        {r.rental_days} day{r.rental_days > 1 ? 's' : ''} • ₱{Number(r.total_cost).toLocaleString()} • <span className="capitalize">{r.status}</span>
                      </p>
                    </div>
                    <ArchivedDate date={r.archived_at} />
                  </ArchiveRow>
                ))}
              </ArchiveSection>

              {/* Admin + Renter: Archived Messages */}
              {(user?.role === 'admin' || user?.role === 'renter') && (
                <ArchiveSection title="Messages" empty="No archived messages.">
                  {archiveData.messages.map((m) => (
                    <ArchiveRow key={`msg-${m.id}`} onRestore={() => handleRestore('messages', m.id)} onDelete={() => handlePermanentDelete('messages', m.id)}>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-md">{m.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user?.role === 'admin' ? `${m.renter?.name || 'Renter'} • ` : ''}
                          <span className="capitalize">{m.status}</span> • {m.location}
                        </p>
                      </div>
                      <ArchivedDate date={m.archived_at} />
                    </ArchiveRow>
                  ))}
                </ArchiveSection>
              )}
            </>
          )}
        </div>
      )}

      {/* Accounts Tab (admin only) */}
      {activeTab === 'accounts' && user?.role === 'admin' && (
        <div>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Pending Verification', value: accountsStats?.pending ?? 0, icon: <Clock className="w-5 h-5" />, color: 'bg-gradient-to-br from-yellow-100 to-amber-200 dark:from-yellow-900/30 dark:to-amber-900/40 text-yellow-600 dark:text-yellow-400 ring-yellow-200 dark:ring-yellow-800', border: 'border-l-yellow-500' },
              { label: 'Awaiting Approval', value: accountsStats?.email_verified ?? 0, icon: <Mail className="w-5 h-5" />, color: 'bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-900/30 dark:to-cyan-900/40 text-blue-600 dark:text-blue-400 ring-blue-200 dark:ring-blue-800', border: 'border-l-blue-500' },
              { label: 'Approved', value: accountsStats?.approved ?? 0, icon: <ShieldCheck className="w-5 h-5" />, color: 'bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-900/40 text-green-600 dark:text-green-400 ring-green-200 dark:ring-green-800', border: 'border-l-green-500' },
              { label: 'Rejected', value: accountsStats?.rejected ?? 0, icon: <ShieldX className="w-5 h-5" />, color: 'bg-gradient-to-br from-red-100 to-rose-200 dark:from-red-900/30 dark:to-rose-900/40 text-red-600 dark:text-red-400 ring-red-200 dark:ring-red-800', border: 'border-l-red-500' },
            ].map((card) => (
              <div key={card.label} className={`bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 border-l-4 ${card.border} p-4 flex items-center gap-3 transition-colors`}>
                <div className={`${card.color} p-2.5 rounded-lg ring-1`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {[
              { label: 'Awaiting Approval', value: 'email_verified' },
              { label: 'Pending Verification', value: 'pending' },
              { label: 'Approved', value: 'approved' },
              { label: 'Rejected', value: 'rejected' },
              { label: 'All', value: 'all' },
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setAccountsFilter(btn.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  accountsFilter === btn.value
                    ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white border-green-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Table */}
          {accountsLoading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : (
            <DataTable
              columns={[
                {
                  key: 'name',
                  label: 'Name',
                  render: (row) => (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                        {row.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{row.email}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'role',
                  label: 'Role',
                  align: 'center',
                  render: (row) => (
                    <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {row.role}
                    </span>
                  ),
                },
                {
                  key: 'account_status',
                  label: 'Status',
                  align: 'center',
                  render: (row) => (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(row.account_status)}`}>
                      {statusLabel(row.account_status)}
                    </span>
                  ),
                },
                {
                  key: 'created_at',
                  label: 'Registered',
                  render: (row) => (
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(row.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  ),
                },
                {
                  key: '_action',
                  label: 'Action',
                  align: 'center',
                  sortable: false,
                  render: (row) => (
                    <div className="flex items-center justify-center gap-1.5">
                      {(row.account_status === 'email_verified' || row.account_status === 'rejected') && (
                        <button
                          onClick={(e) => handleApprove(row.id, e)}
                          disabled={actionLoading}
                          className="text-green-600 hover:bg-green-50 px-2 py-1 rounded text-xs font-medium border border-green-200 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                      {(row.account_status === 'email_verified' || row.account_status === 'approved') && (
                        <button
                          onClick={(e) => openRejectModal(row, e)}
                          disabled={actionLoading}
                          className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium border border-red-200 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteAccount(row.id, e)}
                        disabled={actionLoading}
                        className="text-gray-600 hover:bg-gray-50 p-1.5 rounded border border-gray-200 disabled:opacity-50"
                        title="Delete Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={accountsData}
              onRowClick={(row) => setSelectedAccount(row)}
              searchKeys={['name', 'email', 'role', 'account_status']}
              defaultSort={{ key: 'created_at', dir: 'desc' }}
              emptyMessage="No accounts found."
            />
          )}

          {/* Detail Modal */}
          {selectedAccount && createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedAccount(null)}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xl">
                      {selectedAccount.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedAccount.name}</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{selectedAccount.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedAccount(null)} className="text-gray-400 hover:text-gray-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor(selectedAccount.account_status)}`}>
                      {statusLabel(selectedAccount.account_status)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(selectedAccount.created_at).toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Role</p>
                      <p className="text-gray-700 dark:text-gray-300 capitalize">{selectedAccount.role}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Email Verified</p>
                      <p className="text-gray-700 dark:text-gray-300">{selectedAccount.email_verified_at ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {selectedAccount.admin_rejection_reason && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
                      <p className="text-xs font-semibold uppercase text-red-400 mb-1">Rejection Reason</p>
                      <p className="text-sm text-red-700">{selectedAccount.admin_rejection_reason}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t dark:border-gray-700">
                    {(selectedAccount.account_status === 'email_verified' || selectedAccount.account_status === 'rejected') && (
                      <button
                        onClick={(e) => handleApprove(selectedAccount.id, e)}
                        disabled={actionLoading}
                        className="text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-green-200 flex items-center gap-1 disabled:opacity-50"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}
                    {(selectedAccount.account_status === 'email_verified' || selectedAccount.account_status === 'approved') && (
                      <button
                        onClick={(e) => openRejectModal(selectedAccount, e)}
                        disabled={actionLoading}
                        className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 flex items-center gap-1 disabled:opacity-50"
                      >
                        <UserX className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteAccount(selectedAccount.id, e)}
                      disabled={actionLoading}
                      className="text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 flex items-center gap-1 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Reject Reason Modal */}
          {rejectModal && createPortal(
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setRejectModal(null)}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Reject Account</h2>
                  <button onClick={() => setRejectModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Rejecting <span className="font-semibold text-gray-900 dark:text-white">{rejectModal.name}</span> ({rejectModal.email}).
                    The user will receive an email with the reason below.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason (optional)</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      placeholder="Enter the reason for rejection..."
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none dark:bg-gray-700 dark:text-gray-200"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setRejectModal(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg flex items-center gap-1"
                    >
                      <UserX className="w-4 h-4" /> Reject Account
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      )}

      {/* Audit Trail Tab (admin only) */}
      {activeTab === 'auditTrail' && user?.role === 'admin' && (
        <div>
          {/* Stats Cards */}
          {auditStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Logs</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{auditStats.total_logs.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Today&apos;s Activity</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{auditStats.today_logs}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Sessions Today</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{auditStats.active_sessions}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-4">
              <button
                onClick={() => setAuditTab('audit')}
                className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                  auditTab === 'audit'
                    ? 'border-green-600 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <FileText className="inline w-4 h-4 mr-2 -mt-1" />
                Audit Trail
              </button>
              <button
                onClick={() => setAuditTab('sessions')}
                className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                  auditTab === 'sessions'
                    ? 'border-green-600 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Users className="inline w-4 h-4 mr-2 -mt-1" />
                Session Logs
              </button>
            </div>
          </div>

          {/* Filters */}
          {auditTab === 'audit' && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={auditFilters.action}
                  onChange={(e) => setAuditFilters({ ...auditFilters, action: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="">All Actions</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                  <option value="status_change">Status Change</option>
                </select>
                <input
                  type="date"
                  value={auditFilters.date_from}
                  onChange={(e) => setAuditFilters({ ...auditFilters, date_from: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="From Date"
                />
                <input
                  type="date"
                  value={auditFilters.date_to}
                  onChange={(e) => setAuditFilters({ ...auditFilters, date_to: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="To Date"
                />
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={auditFilters.search}
                    onChange={(e) => setAuditFilters({ ...auditFilters, search: e.target.value })}
                    placeholder="Search description..."
                    className="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {auditLoading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Activity className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Loading...</p>
            </div>
          ) : auditTab === 'audit' ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date/Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {logs?.data?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          No audit logs found.
                        </td>
                      </tr>
                    ) : (
                      logs?.data?.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                            {formatDate(log.created_at)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="text-gray-900 dark:text-white font-medium">{log.user?.name || 'System'}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-xs">{log.user?.email || '—'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionBadge(log.action)}`}>
                              {log.action.toUpperCase().replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{log.description || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{log.ip_address || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {logs && logs.data && logs.data.length > 0 && <Pagination data={logs} onPageChange={fetchAuditLogs} />}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP Address</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Device</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sessions?.data?.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          No session logs found.
                        </td>
                      </tr>
                    ) : (
                      sessions?.data?.map((session) => (
                        <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                            {formatDate(session.created_at)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="text-gray-900 dark:text-white font-medium">{session.user?.name || '—'}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-xs">{session.user?.email || '—'}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white capitalize">{session.user?.role || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionBadge(session.action)}`}>
                              {session.action.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{session.ip_address || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {session.user_agent ? parseUserAgent(session.user_agent) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {sessions && sessions.data && sessions.data.length > 0 && <Pagination data={sessions} onPageChange={fetchSessions} />}
            </div>
          )}
        </div>
      )}

      {/* Email Settings Tab (admin only) */}
      {activeTab === 'email' && user?.role === 'admin' && (
        <div className="max-w-2xl space-y-6">
          {smtpLoading ? (
            <FormSkeleton fields={7} />
          ) : (
            <>
              {/* SMTP Status */}
              {hasSmtpPassword && lastUpdated && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
                  <Mail className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">SMTP Configured</p>
                    <p className="text-xs text-green-600 dark:text-green-500">
                      Last updated: {new Date(lastUpdated).toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )}

              {/* SMTP Form */}
              <form onSubmit={handleSmtpSave} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-6 space-y-5 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">SMTP Configuration</h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">Configure email delivery for verification and notification emails</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP Host</label>
                    <input
                      name="mail_host"
                      value={smtpForm.mail_host}
                      onChange={handleSmtpChange}
                      required
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Port</label>
                    <input
                      name="mail_port"
                      type="number"
                      value={smtpForm.mail_port}
                      onChange={handleSmtpChange}
                      required
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username (Email)</label>
                  <input
                    name="mail_username"
                    type="email"
                    value={smtpForm.mail_username}
                    onChange={handleSmtpChange}
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200"
                    placeholder="yourname@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    App Password {hasSmtpPassword && <span className="text-gray-400">(leave blank to keep current)</span>}
                  </label>
                  <div className="relative">
                    <input
                      name="mail_password"
                      type={showSmtpPassword ? 'text' : 'password'}
                      value={smtpForm.mail_password}
                      onChange={handleSmtpChange}
                      required={!hasSmtpPassword}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200"
                      placeholder={hasSmtpPassword ? '••••••••••••••••' : 'Enter Gmail App Password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    For Gmail: Go to Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App Passwords
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Encryption</label>
                  <select
                    name="mail_encryption"
                    value={smtpForm.mail_encryption}
                    onChange={handleSmtpChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200"
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="null">None</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Address</label>
                    <input
                      name="mail_from_address"
                      type="email"
                      value={smtpForm.mail_from_address}
                      onChange={handleSmtpChange}
                      required
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200"
                      placeholder="noreply@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Name</label>
                    <input
                      name="mail_from_name"
                      value={smtpForm.mail_from_name}
                      onChange={handleSmtpChange}
                      required
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200"
                      placeholder="FERMs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={smtpSaving}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-2.5 rounded-lg font-medium hover:from-green-700 hover:to-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {smtpSaving ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Settings</>
                  )}
                </button>
              </form>

              {/* Test Email */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-6 transition-colors">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Send className="w-4 h-4 text-green-600" />
                  Test Email Configuration
                </h3>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200"
                  />
                  <button
                    onClick={handleSmtpTest}
                    disabled={smtpTesting}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm shrink-0"
                  >
                    {smtpTesting ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Sending...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Send Test</>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Archive helper sub-components                                      */
/* ================================================================== */

function ArchiveSection({ title, empty, children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 transition-colors overflow-hidden">
      <div className="px-6 py-4 border-b dark:border-gray-700 flex items-center gap-2">
        <Archive className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-gray-400 dark:text-gray-500">{empty}</div>
      ) : (
        <div className="divide-y dark:divide-gray-700">{children}</div>
      )}
    </div>
  );
}

function ArchiveRow({ children, onRestore, onDelete }) {
  return (
    <div className="px-6 py-4 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0 flex items-center gap-4">{children}</div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onRestore} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors" title="Restore">
          <RotateCcw className="w-3.5 h-3.5" /> Restore
        </button>
        <button onClick={onDelete} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors" title="Delete permanently">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

function ArchivedDate({ date }) {
  if (!date) return null;
  const d = new Date(date);
  return (
    <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
      Archived {d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
    </span>
  );
}


